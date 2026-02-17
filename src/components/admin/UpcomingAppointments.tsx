import { useMemo } from "react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Phone, MessageCircle, Scissors, Calendar } from "lucide-react";
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
      <div className="pro-card rounded-xl p-8 text-center">
        <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm font-medium">Nenhum agendamento próximo</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Próximos Agendamentos
        </h3>
        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {upcoming.length}
        </span>
      </div>
      <div className="space-y-2">
        {upcoming.map((a, index) => {
          const waLink = `https://wa.me/${a.client_phone.replace(/\D/g, "")}`;
          return (
            <div
              key={a.id}
              className="pro-card rounded-xl p-3.5 flex items-center gap-3 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Time */}
              <div className="w-12 h-12 rounded-xl gold-gradient flex flex-col items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-primary-foreground font-bold text-xs leading-none">{a.appointment_time.substring(0, 5)}</span>
                <span className="text-primary-foreground/70 text-[8px] leading-none mt-0.5">{getDateLabel(a.appointment_date)}</span>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-xs truncate">{a.client_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{a.client_phone}</p>
                <p className="text-[10px] text-primary truncate">
                  {(a as any).service_type || "Corte"} • {getBarberName(a.barber_id)}
                </p>
              </div>
              {/* WhatsApp */}
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 flex-shrink-0 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingAppointments;
