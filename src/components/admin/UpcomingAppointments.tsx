import { useMemo } from "react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Phone, MessageCircle, Scissors } from "lucide-react";
import { Appointment } from "@/hooks/useSupabase";

interface Props {
  appointments: Appointment[];
  barbers: { id: string; name: string; phone: string }[];
}

const UpcomingAppointments = ({ appointments, barbers }: Props) => {
  const upcoming = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const currentTime = format(now, "HH:mm:ss");

    return appointments
      .filter((a) => {
        if (a.status === "cancelado") return false;
        if (a.appointment_date > todayStr) return true;
        if (a.appointment_date === todayStr && a.appointment_time >= currentTime) return true;
        return false;
      })
      .sort((a, b) => {
        const da = `${a.appointment_date}T${a.appointment_time}`;
        const db = `${b.appointment_date}T${b.appointment_time}`;
        return da.localeCompare(db);
      })
      .slice(0, 6);
  }, [appointments]);

  const getBarberName = (id: string) => barbers.find((b) => b.id === id)?.name || "—";

  const getDateLabel = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return "Hoje";
    if (isTomorrow(d)) return "Amanhã";
    return format(d, "dd/MM", { locale: ptBR });
  };

  if (upcoming.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">Nenhum agendamento próximo</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold text-foreground">Próximos Agendamentos</h3>
      </div>
      <div className="space-y-2">
        {upcoming.map((a) => {
          const waLink = `https://wa.me/${a.client_phone.replace(/\D/g, "")}`;
          return (
            <div key={a.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
              {/* Time circle */}
              <div className="w-14 h-14 rounded-full border-2 border-primary flex flex-col items-center justify-center flex-shrink-0 glow-gold">
                <span className="text-primary font-bold text-sm leading-none">{a.appointment_time.substring(0, 5)}</span>
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">{getDateLabel(a.appointment_date)}</span>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate flex items-center gap-1">
                  <User className="w-3 h-3 flex-shrink-0" /> {a.client_name}
                </p>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <Phone className="w-3 h-3 flex-shrink-0" /> {a.client_phone}
                </p>
                <p className="text-xs text-primary truncate flex items-center gap-1">
                  <Scissors className="w-3 h-3 flex-shrink-0" /> {(a as any).service_type || "Corte"} • {getBarberName(a.barber_id)}
                </p>
              </div>
              {/* WhatsApp */}
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 flex-shrink-0">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingAppointments;
