import { useMemo } from "react";
import { format, isToday } from "date-fns";
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
  const todaySelected = isToday(selectedDate);

  const unavailableTimes = useMemo(() => {
    const blocked = blockedSlots
      .filter((s) => s.blocked_date === dateStr && s.blocked_time)
      .map((s) => s.blocked_time!);

    const booked = appointments
      .filter((a) => a.appointment_date === dateStr && a.status !== "cancelado")
      .map((a) => a.appointment_time);

    // If today, also block past times
    const pastTimes: string[] = [];
    if (todaySelected) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      slots.forEach((slot) => {
        const [h, m] = slot.slot_time.split(":").map(Number);
        if (h * 60 + m <= currentMinutes) {
          pastTimes.push(slot.slot_time);
        }
      });
    }

    return new Set([...blocked, ...booked, ...pastTimes]);
  }, [blockedSlots, appointments, dateStr, todaySelected, slots]);

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
