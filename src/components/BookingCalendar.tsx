import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BlockedSlot } from "@/hooks/useSupabase";

interface BookingCalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  blockedSlots: BlockedSlot[];
}

const BookingCalendar = ({ selectedDate, onSelectDate, blockedSlots }: BookingCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfDay(new Date());

  const blockedDates = useMemo(() => {
    return blockedSlots
      .filter((s) => !s.blocked_time)
      .map((s) => s.blocked_date);
  }, [blockedSlots]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { locale: ptBR });
    const calEnd = endOfWeek(monthEnd, { locale: ptBR });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const isBlocked = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return blockedDates.includes(dateStr);
  };

  const isDisabled = (date: Date) => {
    return isBefore(date, today) || date.getDay() === 0 || isBlocked(date);
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="glass-card rounded-xl p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h3 className="font-display text-lg font-semibold capitalize text-foreground">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const disabled = isDisabled(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={i}
              disabled={disabled || !isCurrentMonth}
              onClick={() => onSelectDate(day)}
              className={`h-10 rounded-lg text-sm font-medium transition-all ${
                !isCurrentMonth
                  ? "text-muted-foreground/30"
                  : disabled
                  ? "text-muted-foreground/40 cursor-not-allowed line-through"
                  : isSelected
                  ? "bg-primary text-primary-foreground font-bold"
                  : isToday
                  ? "ring-1 ring-primary text-primary hover:bg-primary/10"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BookingCalendar;
