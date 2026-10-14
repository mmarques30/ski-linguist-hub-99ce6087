import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const adminCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonAuthError(status: number, error: string): Response {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { ...adminCorsHeaders, "Content-Type": "application/json" },
  });
}

/** Extrait le Bearer ; null si absent ou mal formé. */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
}

/**
 * Lit le claim `role` d'un JWT Supabase (anon / service_role / authenticated)
 * sans vérification crypto — uniquement pour filtrer la clé publique.
 */
export function readJwtRoleClaim(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function isAnonToken(token: string, anonKey: string): boolean {
  if (token === anonKey) return true;
  return readJwtRoleClaim(token) === "anon";
}

/**
 * Égalité stricte (temps constant) avec la vraie clé service_role.
 * Ne JAMAIS se fier au claim `role` décodé : un JWT forgé non signé
 * pourrait l'annoncer (finding « forged token »).
 */
function isServiceRoleToken(token: string, serviceRoleKey: string): boolean {
  if (!serviceRoleKey || token.length !== serviceRoleKey.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ serviceRoleKey.charCodeAt(i);
  }
  return diff === 0;
}

/** Comparaison à temps constant du jeton cron avec la valeur en base. */
async function isValidCronDispatchToken(
  adminClient: SupabaseClient,
  provided: string
): Promise<boolean> {
  const { data, error } = await adminClient
    .from("cron_dispatch_secret")
    .select("token")
    .eq("id", true)
    .maybeSingle();
  const expected = (data as { token?: string } | null)?.token;
  if (error || !expected || expected.length < 32) return false;
  if (expected.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}

export async function requireAdmin(
  req: Request
): Promise<{ adminClient: SupabaseClient; userId: string } | Response> {
  return requireRole(req, ["admin"], "Forbidden: admin only");
}

/** Staff back-office (admin ou user) — exclut formateur / stagiaire. */
export async function requireStaff(
  req: Request
): Promise<{ adminClient: SupabaseClient; userId: string } | Response> {
  return requireRole(req, ["admin", "user"], "Forbidden: staff only");
}

/**
 * Cron / dispatch SQL (JWT service_role) **ou** staff connecté.
 * Refuse explicitement la clé anon : `verify_jwt=true` l'accepte autrement.
 */
export async function requireServiceRoleOrStaff(
  req: Request
): Promise<
  | { adminClient: SupabaseClient; userId: string | null; authMode: "service_role" | "staff" }
  | Response
> {
  return requireServiceRoleOrRoles(req, ["admin", "user"], "Forbidden: staff or service role only");
}

/**
 * Cron / dispatch SQL (JWT service_role) **ou** admin connecté.
 * Pour les envois sensibles (prospection moniteurs).
 */
export async function requireServiceRoleOrAdmin(
  req: Request
): Promise<
  | { adminClient: SupabaseClient; userId: string | null; authMode: "service_role" | "admin" }
  | Response
> {
  const result = await requireServiceRoleOrRoles(req, ["admin"], "Forbidden: admin or service role only");
  if (result instanceof Response) return result;
  return {
    adminClient: result.adminClient,
    userId: result.userId,
    authMode: result.authMode === "service_role" ? "service_role" : "admin",
  };
}

async function requireServiceRoleOrRoles(
  req: Request,
  roles: Array<"admin" | "user">,
  forbiddenMessage: string
): Promise<
  | { adminClient: SupabaseClient; userId: string | null; authMode: "service_role" | "staff" }
  | Response
> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const token = extractBearerToken(req);

  if (!token) {
    return jsonAuthError(401, "Unauthorized");
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Cron pg_cron : jeton dédié généré en base (public.cron_dispatch_secret),
  // envoyé par dispatch_edge_function dans x-cron-dispatch-token.
  const cronHeader = req.headers.get("x-cron-dispatch-token")?.trim();
  if (cronHeader) {
    if (await isValidCronDispatchToken(adminClient, cronHeader)) {
      return { adminClient, userId: null, authMode: "service_role" };
    }
    return jsonAuthError(403, "Forbidden: invalid cron token");
  }

  if (isAnonToken(token, anonKey)) {
    return jsonAuthError(403, "Forbidden: anon key is not sufficient");
  }

  if (isServiceRoleToken(token, serviceRoleKey)) {
    return { adminClient, userId: null, authMode: "service_role" };
  }

  const staff = await requireRole(req, roles, forbiddenMessage);
  if (staff instanceof Response) return staff;
  return { adminClient: staff.adminClient, userId: staff.userId, authMode: "staff" };
}

async function requireRole(
  req: Request,
  roles: Array<"admin" | "user">,
  forbiddenMessage: string
): Promise<{ adminClient: SupabaseClient; userId: string } | Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonAuthError(401, "Unauthorized");
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return jsonAuthError(401, "Unauthorized");
  }

  // La clé publique franchit verify_jwt mais n'est jamais un appelant admin/staff.
  if (isAnonToken(token, anonKey)) {
    return jsonAuthError(403, "Forbidden: anon key is not sufficient");
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // getClaims (JWT local) puis repli getUser (Auth API) si le runtime
  // Deno / la lib ne résout pas les claims — sinon les boutons admin
  // semblent « morts » (401 silencieux côté client mal branché).
  let userId: string | null = null;
  const { data: claimsData } = await callerClient.auth.getClaims(token);
  if (claimsData?.claims?.sub && typeof claimsData.claims.sub === "string") {
    userId = claimsData.claims.sub;
  } else {
    const { data: userData, error: userError } = await callerClient.auth.getUser(token);
    if (!userError && userData?.user?.id) {
      userId = userData.user.id;
    }
  }

  if (!userId) {
    return jsonAuthError(401, "Unauthorized");
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  let allowed = false;
  for (const role of roles) {
    const { data } = await adminClient.rpc("has_role", {
      _user_id: userId,
      _role: role,
    });
    if (data) {
      allowed = true;
      break;
    }
  }

  if (!allowed) {
    return jsonAuthError(403, forbiddenMessage);
  }

  return { adminClient, userId };
}
