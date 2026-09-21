import { supabase } from "@/integrations/supabase/client";
import { messageFromFunctionsInvoke } from "@/lib/supabase-error";

/**
 * Appel authentifié d'une Edge Function admin avec message d'erreur lisible.
 * Évite le silence de `functions.invoke` quand le corps JSON porte `error`
 * et que le statut HTTP n'est pas 2xx.
 */
export async function invokeAdminEdgeFunction<T = unknown>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<T> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(sessionError.message || "Session illisible");
  }
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error("Non authentifié — reconnectez-vous puis réessayez.");
  }

  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !anonKey) {
    throw new Error("Configuration Supabase manquante (URL / clé anonyme).");
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch (networkError) {
    throw new Error(
      networkError instanceof Error
        ? `Réseau : ${networkError.message}`
        : "Impossible de joindre la fonction Edge."
    );
  }

  let payload: unknown = null;
  const raw = await response.text();
  if (raw.trim()) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { error: raw.slice(0, 280) };
    }
  }

  if (!response.ok) {
    const fromBody = messageFromFunctionsInvoke(
      { message: `HTTP ${response.status}` },
      payload
    );
    // Ne jamais remonter un « Erreur » nu : ajouter le statut HTTP.
    const enriched =
      !fromBody || fromBody === "Erreur" || fromBody === "Erreur interne"
        ? `Échec Edge ${functionName} (HTTP ${response.status})${
            raw.trim() ? ` — ${raw.trim().slice(0, 200)}` : ""
          }`
        : fromBody;
    throw new Error(enriched);
  }

  if (payload && typeof payload === "object" && "error" in payload) {
    const err = (payload as { error?: unknown }).error;
    if (typeof err === "string" && err.trim()) {
      throw new Error(err.trim());
    }
  }

  return payload as T;
}
