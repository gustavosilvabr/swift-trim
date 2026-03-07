import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Crown, Phone, User, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Subscription {
  id: string;
  client_name: string;
  client_phone: string;
  barber_id: string;
  plan_name: string;
  plan_price: number;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface Props {
  barbers: { id: string; name: string }[];
  barberId?: string; // if barber role, filter by this
}

const SubscribersSection = ({ barbers, barberId }: Props) => {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      let query = supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
      if (barberId) query = query.eq("barber_id", barberId);
      const { data } = await query;
      if (data) setSubs(data as Subscription[]);
      setLoading(false);
    };
    fetchSubs();

    const channel = supabase
      .channel("subscriptions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, () => fetchSubs())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [barberId]);

  const deleteSub = async (id: string) => {
    if (!confirm("Excluir esta assinatura?")) return;
    await supabase.from("subscriptions").delete().eq("id", id);
    setSubs((prev) => prev.filter((s) => s.id !== id));
    toast.success("Assinatura removida");
  };

  const activeSubs = subs.filter((s) => s.status === "active");
  const totalRevenue = activeSubs.reduce((sum, s) => sum + s.plan_price, 0);

  const getBarberName = (id: string) => barbers.find((b) => b.id === id)?.name || "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <Crown className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">Assinantes Ativos</p>
          <p className="text-lg font-bold text-primary">{activeSubs.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <Crown className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground">Receita Planos</p>
          <p className="text-lg font-bold text-green-400">R$ {totalRevenue.toFixed(0)}</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {subs.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-6">Nenhuma assinatura encontrada</p>
        )}
        {subs.map((s) => (
          <div key={s.id} className="glass-card rounded-xl p-3 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-sm font-semibold text-foreground truncate">{s.client_name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    s.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {s.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span>{s.client_phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{format(parseISO(s.start_date), "dd/MM/yyyy")} — {format(parseISO(s.end_date), "dd/MM/yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Barbeiro:</span>
                  <span className="text-foreground font-medium">{getBarberName(s.barber_id)}</span>
                  <span className="text-primary font-bold ml-auto">R$ {s.plan_price.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => deleteSub(s.id)} className="p-1.5 rounded-lg hover:bg-secondary flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscribersSection;
