import { useMemo } from "react";
import { format } from "date-fns";
import { TimeSlot, BlockedSlot, Appointment } from "@/hooks/useSupabase";

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
    const blocked = blockedSlots
      .filter((s) => s.blocked_date === dateStr && s.blocked_time)
      .map((s) => s.blocked_time!);

    const booked = appointments
      .filter((a) => a.appointment_date === dateStr && a.status !== "cancelado")
      .map((a) => a.appointment_time);

    return new Set([...blocked, ...booked]);
  }, [blockedSlots, appointments, dateStr]);

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum horário disponível para este dia.
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
            className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${
              isUnavailable
                ? "bg-secondary/50 text-muted-foreground/40 cursor-not-allowed line-through"
                : isSelected
                ? "bg-primary text-primary-foreground font-bold glow-gold"
                : "glass-card text-foreground hover:ring-1 hover:ring-primary/50"
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
