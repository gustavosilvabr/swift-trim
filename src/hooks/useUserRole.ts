import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "barber" | null;

interface RoleState {
  role: AppRole;
  barberId: string | null;
  loading: boolean;
}

export function useUserRole() {
  const [state, setState] = useState<RoleState>({ role: null, barberId: null, loading: true });

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState({ role: null, barberId: null, loading: false });
        return;
      }

      const { data, error } = await supabase.functions.invoke("manage-barber-user", {
        body: { action: "get_role" },
      });

      if (error) {
        console.error("Error fetching role:", error);
        setState({ role: null, barberId: null, loading: false });
        return;
      }

      setState({
        role: data.role as AppRole,
        barberId: data.barber_id,
        loading: false,
      });
    };

    fetchRole();
  }, []);

  return state;
}
