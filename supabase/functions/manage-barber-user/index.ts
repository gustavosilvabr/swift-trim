import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is owner
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Check owner role using service role client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "owner")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: owner only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, email, password, barber_id, user_id } = await req.json();

    if (action === "create") {
      // Create auth user
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Assign barber role
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role: "barber" });

      // Link to barber record
      if (barber_id) {
        await supabaseAdmin
          .from("barbers")
          .update({ user_id: newUser.user.id })
          .eq("id", barber_id);
      }

      return new Response(
        JSON.stringify({ success: true, user_id: newUser.user.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Remove role
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", user_id);

      // Unlink barber
      await supabaseAdmin
        .from("barbers")
        .update({ user_id: null })
        .eq("user_id", user_id);

      // Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(user_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_role") {
      const { data: myRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", callerId)
        .maybeSingle();

      // Get linked barber_id
      const { data: myBarber } = await supabaseAdmin
        .from("barbers")
        .select("id")
        .eq("user_id", callerId)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          role: myRole?.role || null,
          barber_id: myBarber?.id || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "list_barber_users") {
      // Get all barbers with linked users
      const { data: barbersData } = await supabaseAdmin
        .from("barbers")
        .select("id, name, user_id");

      const result = [];
      for (const b of barbersData || []) {
        if (b.user_id) {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(b.user_id);
          const { data: roleData } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", b.user_id)
            .maybeSingle();
          result.push({
            barber_id: b.id,
            barber_name: b.name,
            user_id: b.user_id,
            email: userData?.user?.email || "",
            role: roleData?.role || "barber",
          });
        } else {
          result.push({
            barber_id: b.id,
            barber_name: b.name,
            user_id: null,
            email: null,
            role: null,
          });
        }
      }

      return new Response(JSON.stringify({ users: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
