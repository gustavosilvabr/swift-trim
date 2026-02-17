import { useMemo } from "react";
import { format } from "date-fns";
import { TimeSlot, BlockedSlot, Appointment } from "@/hooks/useSupabase";
import { Clock } from "lucide-react";

interface TimeSlotsGridProps {
  slots: TimeSlot[];
  blockedSlots: BlockedSlot[];
  appointments: Appointment[];
  selectedDate: Date;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
}

const TimeSlotsGrid = ({ slots, blockedSlots, appointments, selectedDate, selectedTime, onSelectTime }: TimeSlotsGridProps) => {
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const unavailableTimes = useMemo(() => {
    const blocked = blockedSlots.filter((s) => s.blocked_date === dateStr && s.blocked_time).map((s) => s.blocked_time!);
    const booked = appointments.filter((a) => a.appointment_date === dateStr && a.status !== "cancelado").map((a) => a.appointment_time);
    return new Set([...blocked, ...booked]);
  }, [blockedSlots, appointments, dateStr]);

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum horário disponível para este dia.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 animate-fade-in">
      {slots.map((slot) => {
        const timeStr = slot.slot_time;
        const displayTime = timeStr.substring(0, 5);
        const isUnavailable = unavailableTimes.has(timeStr);
        const isSelected = selectedTime === timeStr;

        return (
          <button
            key={slot.id}
            disabled={isUnavailable}
            onClick={() => onSelectTime(timeStr)}
            className={`py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isUnavailable
                ? "bg-secondary/30 text-muted-foreground/30 cursor-not-allowed line-through"
                : isSelected
                ? "gold-gradient text-primary-foreground font-bold shadow-lg"
                : "pro-card text-foreground hover:ring-1 hover:ring-primary/50 hover:translate-y-[-1px]"
            }`}
          >
            {displayTime}
          </button>
        );
      })}
    </div>
  );
};

export default TimeSlotsGrid;
