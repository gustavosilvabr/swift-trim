import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBarbers } from "@/hooks/useSupabase";
import { Crown, Scissors, Check, Infinity, Sparkles } from "lucide-react";
import { toast } from "sonner";

const benefits = [
  "Cortes ilimitados por 30 dias",
  "Prioridade no agendamento",
  "Válido para todos os tipos de corte",
  "Renovação mensal flexível",
];

const SubscriptionPlan = () => {
  const { barbers: allBarbers } = useBarbers();
  const barbers = allBarbers.filter((b) => (b as any).is_active !== false);

  const [selectedBarber, setSelectedBarber] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async () => {
    if (!selectedBarber || !clientName.trim() || !clientPhone.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("subscriptions").insert({
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      barber_id: selectedBarber,
      plan_name: "Corte Ilimitado",
      plan_price: 100,
      status: "active",
    });

    if (error) {
      toast.error("Erro ao assinar o plano");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSuccess(true);
    toast.success("Plano assinado com sucesso!");
  };

  if (success) {
    return (
      <section className="animate-fade-in">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground">
            Assinatura Confirmada!
          </h3>
          <p className="text-sm text-muted-foreground">
            Entraremos em contato pelo WhatsApp para confirmar o pagamento e ativar seu plano.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setClientName("");
              setClientPhone("");
              setSelectedBarber("");
            }}
            className="px-6 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium"
          >
            Fechar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-fade-in space-y-4">
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <h2 className="font-display text-2xl font-bold gold-text">Plano VIP</h2>
          <Crown className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Corte ilimitado por um preço fixo</p>
      </div>

      {/* Plan card */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 glow-gold">
        {/* Decorative top */}
        <div className="gold-gradient py-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
            <span className="font-display font-bold text-primary-foreground text-lg">Corte Ilimitado</span>
          </div>
          <div className="flex items-center gap-1">
            <Infinity className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>

        <div className="bg-card p-5 space-y-5">
          {/* Price */}
          <div className="text-center space-y-1">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-sm text-muted-foreground">R$</span>
              <span className="font-display text-5xl font-black gold-text">100</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
            <p className="text-xs text-muted-foreground">Válido por 30 dias a partir da ativação</p>
          </div>

          {/* Benefits */}
          <div className="space-y-2.5">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm text-foreground">{b}</span>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="space-y-3 pt-2">
            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">Escolha seu barbeiro</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Seu nome"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
            <input
              type="tel"
              placeholder="WhatsApp (ex: 61 99999-9999)"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
            <button
              onClick={handleSubscribe}
              disabled={submitting}
              className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-bold text-lg transition-all hover:scale-[1.02] hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Scissors className="w-5 h-5" />
              {submitting ? "Assinando..." : "Assinar Plano VIP"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlan;
