import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return json({ error: message }, status);
}

/** Creates a supabase client scoped to the calling user */
function userClient(authHeader: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

/** Admin client with service role */
function adminClient() {
  return createClient(supabaseUrl, serviceRoleKey);
}

/** Extracts user from auth header, returns null if not authenticated */
async function getUser(authHeader: string | null) {
  if (!authHeader) return null;
  const client = userClient(authHeader);
  const { data: { user } } = await client.auth.getUser();
  return user;
}

/** Gets the user's role */
async function getUserRole(userId: string) {
  const admin = adminClient();
  const { data } = await admin
    .from("user_roles")
    .select("role, barber_id")
    .eq("user_id", userId)
    .single();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Path after /barbershop-api/
  const pathParts = url.pathname.replace(/^\/barbershop-api\/?/, "").split("/").filter(Boolean);
  const resource = pathParts[0] || "";
  const subResource = pathParts[1] || "";
  const method = req.method;
  const authHeader = req.headers.get("Authorization");

  try {
    // ═══════════════════════════════════════════
    // PUBLIC ENDPOINTS (no auth required)
    // ═══════════════════════════════════════════

    // POST /auth/login
    if (resource === "auth" && subResource === "login" && method === "POST") {
      const { email, password } = await req.json();
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) return err(error.message, 401);

      const role = await getUserRole(data.user.id);
      return json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: role?.role || null,
          barber_id: role?.barber_id || null,
        },
      });
    }

    // POST /auth/refresh
    if (resource === "auth" && subResource === "refresh" && method === "POST") {
      const { refresh_token } = await req.json();
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await client.auth.refreshSession({ refresh_token });
      if (error) return err(error.message, 401);
      return json({
        access_token: data.session!.access_token,
        refresh_token: data.session!.refresh_token,
        expires_at: data.session!.expires_at,
      });
    }

    // GET /barbers - public list of barbers
    if (resource === "barbers" && method === "GET" && !subResource) {
      const admin = adminClient();
      const { data } = await admin.from("barbers").select("id, name, phone, photo_url, specialty").eq("is_active", true);
      return json({ barbers: data });
    }

    // GET /services - public list of services
    if (resource === "services" && method === "GET") {
      const admin = adminClient();
      const { data } = await admin.from("services").select("*").eq("is_active", true).order("sort_order");
      return json({ services: data });
    }

    // GET /timeslots?barber_id=X&date=YYYY-MM-DD - available time slots
    if (resource === "timeslots" && method === "GET") {
      const barberId = url.searchParams.get("barber_id");
      const date = url.searchParams.get("date");
      if (!barberId || !date) return err("barber_id and date are required");

      const dayOfWeek = new Date(date + "T12:00:00").getDay();
      const admin = adminClient();

      // Get active slots for this day
      const { data: slots } = await admin
        .from("time_slots")
        .select("slot_time")
        .eq("barber_id", barberId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .order("slot_time");

      // Get booked appointments for this date
      const { data: booked } = await admin
        .from("appointments")
        .select("appointment_time")
        .eq("barber_id", barberId)
        .eq("appointment_date", date)
        .in("status", ["pendente", "confirmado"]);

      // Get blocked slots
      const { data: blocked } = await admin
        .from("blocked_slots")
        .select("blocked_time")
        .eq("barber_id", barberId)
        .eq("blocked_date", date);

      const bookedTimes = new Set((booked || []).map((b) => b.appointment_time));
      const blockedTimes = new Set((blocked || []).filter((b) => b.blocked_time).map((b) => b.blocked_time));
      const blockedFullDay = (blocked || []).some((b) => !b.blocked_time);

      const now = new Date();
      const isToday = date === now.toISOString().split("T")[0];

      const available = (slots || [])
        .filter((s) => {
          if (blockedFullDay) return false;
          if (bookedTimes.has(s.slot_time)) return false;
          if (blockedTimes.has(s.slot_time)) return false;
          if (isToday) {
            const [h, m] = s.slot_time.split(":").map(Number);
            const slotMinutes = h * 60 + m;
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            if (slotMinutes <= nowMinutes) return false;
          }
          return true;
        })
        .map((s) => s.slot_time);

      return json({ available_slots: available });
    }

    // POST /appointments - create appointment (public)
    if (resource === "appointments" && method === "POST" && !authHeader) {
      const body = await req.json();
      const { barber_id, client_name, client_phone, appointment_date, appointment_time, service_type, total_amount } = body;

      if (!barber_id || !client_name || !client_phone || !appointment_date || !appointment_time) {
        return err("Missing required fields: barber_id, client_name, client_phone, appointment_date, appointment_time");
      }

      const admin = adminClient();
      const { data, error } = await admin.from("appointments").insert({
        barber_id,
        client_name,
        client_phone,
        appointment_date,
        appointment_time,
        service_type: service_type || "corte",
        total_amount: total_amount || 0,
        status: "pendente",
      }).select().single();

      if (error) return err(error.message);
      return json({ appointment: data }, 201);
    }

    // ═══════════════════════════════════════════
    // AUTHENTICATED ENDPOINTS
    // ═══════════════════════════════════════════

    const user = await getUser(authHeader);
    if (!user) return err("Unauthorized", 401);

    const role = await getUserRole(user.id);
    if (!role) return err("No role assigned", 403);

    const isOwner = role.role === "owner";
    const myBarberId = role.barber_id;

    // ── GET /auth/me ──
    if (resource === "auth" && subResource === "me" && method === "GET") {
      return json({
        user: { id: user.id, email: user.email, role: role.role, barber_id: myBarberId },
      });
    }

    // ── POST /auth/update-password ──
    if (resource === "auth" && subResource === "update-password" && method === "POST") {
      const { password } = await req.json();
      const client = userClient(authHeader!);
      const { error } = await client.auth.updateUser({ password });
      if (error) return err(error.message);
      return json({ success: true });
    }

    // ═══════════════════════════════════════════
    // APPOINTMENTS
    // ═══════════════════════════════════════════

    if (resource === "appointments") {
      const admin = adminClient();

      // GET /appointments?date=YYYY-MM-DD&status=X
      if (method === "GET" && !subResource) {
        let query = admin.from("appointments").select("*, barbers(name, photo_url)");

        // Barbers can only see their own
        if (!isOwner && myBarberId) {
          query = query.eq("barber_id", myBarberId);
        }

        const date = url.searchParams.get("date");
        const dateFrom = url.searchParams.get("date_from");
        const dateTo = url.searchParams.get("date_to");
        const status = url.searchParams.get("status");

        if (date) query = query.eq("appointment_date", date);
        if (dateFrom) query = query.gte("appointment_date", dateFrom);
        if (dateTo) query = query.lte("appointment_date", dateTo);
        if (status) query = query.eq("status", status);

        query = query.order("appointment_date", { ascending: true }).order("appointment_time", { ascending: true });

        const { data, error } = await query;
        if (error) return err(error.message);
        return json({ appointments: data });
      }

      // GET /appointments/:id
      if (method === "GET" && subResource) {
        let query = admin.from("appointments").select("*, barbers(name, photo_url)").eq("id", subResource);
        if (!isOwner && myBarberId) query = query.eq("barber_id", myBarberId);
        const { data, error } = await query.single();
        if (error) return err(error.message, 404);
        return json({ appointment: data });
      }

      // PATCH /appointments/:id
      if (method === "PATCH" && subResource) {
        const body = await req.json();
        const allowedFields = ["status", "service_type", "total_amount", "products_sold", "observation", "payment_method"];
        const updates: Record<string, unknown> = {};
        for (const f of allowedFields) {
          if (body[f] !== undefined) updates[f] = body[f];
        }

        let query = admin.from("appointments").update(updates).eq("id", subResource);
        if (!isOwner && myBarberId) query = query.eq("barber_id", myBarberId);
        const { data, error } = await query.select().single();
        if (error) return err(error.message);
        return json({ appointment: data });
      }

      // DELETE /appointments/:id (owner only)
      if (method === "DELETE" && subResource) {
        if (!isOwner) return err("Forbidden", 403);
        const { error } = await admin.from("appointments").delete().eq("id", subResource);
        if (error) return err(error.message);
        return json({ success: true });
      }

      // POST /appointments (authenticated - creates with auth context)
      if (method === "POST") {
        const body = await req.json();
        const { data, error } = await admin.from("appointments").insert({
          barber_id: body.barber_id,
          client_name: body.client_name,
          client_phone: body.client_phone,
          appointment_date: body.appointment_date,
          appointment_time: body.appointment_time,
          service_type: body.service_type || "corte",
          total_amount: body.total_amount || 0,
          status: "pendente",
        }).select().single();
        if (error) return err(error.message);
        return json({ appointment: data }, 201);
      }
    }

    // ═══════════════════════════════════════════
    // FINANCIAL (authenticated)
    // ═══════════════════════════════════════════

    if (resource === "financial") {
      const admin = adminClient();
      const dateFrom = url.searchParams.get("date_from") || new Date().toISOString().split("T")[0];
      const dateTo = url.searchParams.get("date_to") || dateFrom;

      // GET /financial/summary
      if (subResource === "summary" && method === "GET") {
        // Revenue from appointments
        let apptQuery = admin
          .from("appointments")
          .select("barber_id, total_amount, barbers(name)")
          .gte("appointment_date", dateFrom)
          .lte("appointment_date", dateTo)
          .in("status", ["confirmado", "concluido"]);

        if (!isOwner && myBarberId) apptQuery = apptQuery.eq("barber_id", myBarberId);

        const { data: appointments } = await apptQuery;

        // Expenses (owner only sees all)
        let totalExpenses = 0;
        if (isOwner) {
          const { data: expenses } = await admin
            .from("expenses")
            .select("amount")
            .gte("expense_date", dateFrom)
            .lte("expense_date", dateTo);
          totalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);
        }

        const totalRevenue = (appointments || []).reduce((sum, a) => sum + Number(a.total_amount || 0), 0);
        const totalAppointments = (appointments || []).length;

        // Per-barber breakdown
        const barberMap: Record<string, { name: string; revenue: number; count: number }> = {};
        for (const a of appointments || []) {
          if (!barberMap[a.barber_id]) {
            barberMap[a.barber_id] = {
              name: (a.barbers as any)?.name || "Desconhecido",
              revenue: 0,
              count: 0,
            };
          }
          barberMap[a.barber_id].revenue += Number(a.total_amount || 0);
          barberMap[a.barber_id].count += 1;
        }

        return json({
          period: { from: dateFrom, to: dateTo },
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          profit: totalRevenue - totalExpenses,
          total_appointments: totalAppointments,
          per_barber: Object.entries(barberMap).map(([id, data]) => ({
            barber_id: id,
            ...data,
          })),
        });
      }

      // GET /financial/expenses (owner only)
      if (subResource === "expenses" && method === "GET") {
        if (!isOwner) return err("Forbidden", 403);
        const { data } = await admin
          .from("expenses")
          .select("*")
          .gte("expense_date", dateFrom)
          .lte("expense_date", dateTo)
          .order("expense_date", { ascending: false });
        return json({ expenses: data });
      }

      // POST /financial/expenses (owner only)
      if (subResource === "expenses" && method === "POST") {
        if (!isOwner) return err("Forbidden", 403);
        const body = await req.json();
        const { data, error } = await admin.from("expenses").insert({
          category: body.category,
          description: body.description || "",
          amount: body.amount,
          expense_date: body.expense_date || new Date().toISOString().split("T")[0],
        }).select().single();
        if (error) return err(error.message);
        return json({ expense: data }, 201);
      }

      // DELETE /financial/expenses/:id (owner only)
      if (subResource === "expenses" && pathParts[2] && method === "DELETE") {
        if (!isOwner) return err("Forbidden", 403);
        const { error } = await admin.from("expenses").delete().eq("id", pathParts[2]);
        if (error) return err(error.message);
        return json({ success: true });
      }
    }

    // ═══════════════════════════════════════════
    // BARBER MANAGEMENT (owner only)
    // ═══════════════════════════════════════════

    if (resource === "manage") {
      if (!isOwner) return err("Forbidden", 403);
      const admin = adminClient();

      // GET /manage/barbers
      if (subResource === "barbers" && method === "GET") {
        const { data: barbers } = await admin.from("barbers").select("*").order("name");
        const { data: roles } = await admin.from("user_roles").select("user_id, barber_id, role").eq("role", "barber");
        return json({ barbers, linked_users: roles });
      }

      // POST /manage/barbers - create barber
      if (subResource === "barbers" && method === "POST") {
        const body = await req.json();
        const { data, error } = await admin.from("barbers").insert({
          name: body.name,
          phone: body.phone,
          photo_url: body.photo_url || null,
          specialty: body.specialty || "",
        }).select().single();
        if (error) return err(error.message);
        return json({ barber: data }, 201);
      }

      // PATCH /manage/barbers/:id
      if (subResource === "barbers" && pathParts[2] && method === "PATCH") {
        const body = await req.json();
        const { data, error } = await admin.from("barbers").update(body).eq("id", pathParts[2]).select().single();
        if (error) return err(error.message);
        return json({ barber: data });
      }

      // POST /manage/barber-user - create auth user for barber
      if (subResource === "barber-user" && method === "POST") {
        const { email, password, barber_id } = await req.json();
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (createError) return err(createError.message);

        await admin.from("user_roles").insert({
          user_id: newUser.user.id,
          role: "barber",
          barber_id,
        });
        await admin.from("barbers").update({ user_id: newUser.user.id }).eq("id", barber_id);

        return json({ success: true, user_id: newUser.user.id }, 201);
      }

      // DELETE /manage/barber-user/:user_id
      if (subResource === "barber-user" && pathParts[2] && method === "DELETE") {
        const userId = pathParts[2];
        await admin.from("user_roles").delete().eq("user_id", userId);
        await admin.from("barbers").update({ user_id: null }).eq("user_id", userId);
        await admin.auth.admin.deleteUser(userId);
        return json({ success: true });
      }

      // ── Services management ──
      // GET /manage/services
      if (subResource === "services" && method === "GET") {
        const { data } = await admin.from("services").select("*").order("sort_order");
        return json({ services: data });
      }

      // POST /manage/services
      if (subResource === "services" && method === "POST") {
        const body = await req.json();
        const { data, error } = await admin.from("services").insert(body).select().single();
        if (error) return err(error.message);
        return json({ service: data }, 201);
      }

      // PATCH /manage/services/:id
      if (subResource === "services" && pathParts[2] && method === "PATCH") {
        const body = await req.json();
        const { data, error } = await admin.from("services").update(body).eq("id", pathParts[2]).select().single();
        if (error) return err(error.message);
        return json({ service: data });
      }

      // DELETE /manage/services/:id
      if (subResource === "services" && pathParts[2] && method === "DELETE") {
        const { error } = await admin.from("services").delete().eq("id", pathParts[2]);
        if (error) return err(error.message);
        return json({ success: true });
      }

      // ── Time slots ──
      // GET /manage/timeslots?barber_id=X
      if (subResource === "timeslots" && method === "GET") {
        const barberId = url.searchParams.get("barber_id");
        let query = admin.from("time_slots").select("*").order("day_of_week").order("slot_time");
        if (barberId) query = query.eq("barber_id", barberId);
        const { data } = await query;
        return json({ time_slots: data });
      }

      // POST /manage/timeslots
      if (subResource === "timeslots" && method === "POST") {
        const body = await req.json();
        const { data, error } = await admin.from("time_slots").insert(body).select();
        if (error) return err(error.message);
        return json({ time_slots: data }, 201);
      }

      // DELETE /manage/timeslots/:id
      if (subResource === "timeslots" && pathParts[2] && method === "DELETE") {
        const { error } = await admin.from("time_slots").delete().eq("id", pathParts[2]);
        if (error) return err(error.message);
        return json({ success: true });
      }

      // ── Blocked slots ──
      // POST /manage/blocked-slots
      if (subResource === "blocked-slots" && method === "POST") {
        const body = await req.json();
        const { data, error } = await admin.from("blocked_slots").insert(body).select().single();
        if (error) return err(error.message);
        return json({ blocked_slot: data }, 201);
      }

      // DELETE /manage/blocked-slots/:id
      if (subResource === "blocked-slots" && pathParts[2] && method === "DELETE") {
        const { error } = await admin.from("blocked_slots").delete().eq("id", pathParts[2]);
        if (error) return err(error.message);
        return json({ success: true });
      }
    }

    return err("Not found", 404);
  } catch (error) {
    return err(error.message || "Internal server error", 500);
  }
});
