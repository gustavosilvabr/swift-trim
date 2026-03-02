import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Barber {
  id: string;
  name: string;
  phone: string;
  photo_url: string | null;
}

export interface TimeSlot {
  id: string;
  barber_id: string;
  day_of_week: number;
  slot_time: string;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  barber_id: string;
  client_name: string;
  client_phone: string;
  appointment_date: string;
  appointment_time: string;
  status: "pendente" | "confirmado" | "concluido" | "cancelado";
  service_type: string | null;
  total_amount: number | null;
  products_sold: string | null;
  observation: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlockedSlot {
  id: string;
  barber_id: string;
  blocked_date: string;
  blocked_time: string | null;
}

export function useBarbers() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("barbers").select("*");
      if (data) setBarbers(data);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel("barbers-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "barbers" }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { barbers, loading };
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: true });
    if (data) setAppointments(data as Appointment[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel("appointments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { appointments, loading, refetch: fetchAppointments };
}

export function useBlockedSlots(barberId?: string) {
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);

  useEffect(() => {
    if (!barberId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("blocked_slots")
        .select("*")
        .eq("barber_id", barberId);
      if (data) setBlocked(data);
    };
    fetch();
  }, [barberId]);

  return blocked;
}

export function useTimeSlots(barberId?: string, dayOfWeek?: number) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    if (!barberId || dayOfWeek === undefined) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("time_slots")
        .select("*")
        .eq("barber_id", barberId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .order("slot_time");
      if (data) setSlots(data);
    };
    fetch();
  }, [barberId, dayOfWeek]);

  return slots;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  is_active: boolean;
  sort_order: number;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setServices(data as Service[]);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel("services-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { services, loading };
}
