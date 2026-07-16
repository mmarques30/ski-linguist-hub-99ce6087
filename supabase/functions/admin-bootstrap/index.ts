import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bootstrap-token",
};

const BOOTSTRAP_TOKEN = "k9Fp2XvR7mQ8nL3wYbT4hZaJ";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.headers.get("x-bootstrap-token") !== BOOTSTRAP_TOKEN) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: Record<string, unknown> = {};

  // 1) Reset info@fli.fr password
  const infoId = "5e85db99-159c-4705-a0de-2c5b5f704cbb";
  const { error: updErr } = await admin.auth.admin.updateUserById(infoId, {
    password: "FliTest#2026$Reset",
    email_confirm: true,
  });
  results.info_reset = updErr ? { error: updErr.message } : "ok";

  // 2) Create teste@fli.fr
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: "teste@fli.fr",
    password: "Teste#Fli2026$Ok",
    email_confirm: true,
    user_metadata: { full_name: "Utilisateur Test" },
  });

  if (createErr) {
    results.teste_create = { error: createErr.message };
  } else {
    const newId = created.user.id;
    results.teste_create = { id: newId };

    await admin.from("profiles").update({ full_name: "Utilisateur Test", is_active: true }).eq("id", newId);
    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: newId, role: "admin" });
    results.teste_role = roleErr ? { error: roleErr.message } : "ok";
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});