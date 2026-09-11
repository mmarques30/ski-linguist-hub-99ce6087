import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller is admin
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: claimsData.claims.sub,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, full_name, role, permissions, instructor_id } =
      await req.json();

    const allowedRoles = ["admin", "user", "formateur"];
    const assignedRole = role || "user";
    if (!allowedRoles.includes(assignedRole)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (assignedRole === "formateur") {
      if (!instructor_id) {
        return new Response(
          JSON.stringify({ error: "instructor_id required for role formateur" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const { data: instructor, error: instructorError } = await adminClient
        .from("instructors")
        .select("id, auth_user_id")
        .eq("id", instructor_id)
        .maybeSingle();
      if (instructorError || !instructor) {
        return new Response(JSON.stringify({ error: "Instructor not found" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (instructor.auth_user_id) {
        return new Response(
          JSON.stringify({ error: "Instructor already linked to a user" }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create user
    const { data: userData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Profile is created by trigger, but update full_name
    await adminClient
      .from("profiles")
      .update({ full_name })
      .eq("id", userId);

    // Assign role
    await adminClient
      .from("user_roles")
      .insert({ user_id: userId, role: assignedRole });

    if (assignedRole === "formateur") {
      const { error: linkError } = await adminClient
        .from("instructors")
        .update({ auth_user_id: userId })
        .eq("id", instructor_id)
        .is("auth_user_id", null);
      if (linkError) {
        await adminClient.auth.admin.deleteUser(userId);
        return new Response(
          JSON.stringify({ error: "Failed to link instructor: " + linkError.message }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Insert permissions if role is 'user'
    if (assignedRole === "user" && permissions && Array.isArray(permissions)) {
      const permRows = permissions.map(
        (p: { route_key: string; can_view: boolean; can_edit: boolean }) => ({
          user_id: userId,
          route_key: p.route_key,
          can_view: p.can_view,
          can_edit: p.can_edit,
        })
      );
      if (permRows.length > 0) {
        await adminClient.from("user_permissions").insert(permRows);
      }
    }

    return new Response(
      JSON.stringify({
        user: { id: userId, email, full_name, role: assignedRole, instructor_id: instructor_id || null },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
