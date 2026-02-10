import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useBarbers, useBlockedSlots, useTimeSlots, useAppointments, Barber } from "@/hooks/useSupabase";
import BarberCard from "@/components/BarberCard";
import BookingCalendar from "@/components/BookingCalendar";
import TimeSlotsGrid from "@/components/TimeSlotsGrid";
import { toast } from "sonner";

const stepTitles = ["Escolha o Barbeiro", "Escolha a Data", "Escolha o Horário", "Seus Dados"];

const BookingFlow = () => {
  const { barbers, loading } = useBarbers();
  const { appointments } = useAppointments();

  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const blockedSlots = useBlockedSlots(selectedBarber?.id);
  const dayOfWeek = selectedDate ? selectedDate.getDay() : undefined;
  const timeSlots = useTimeSlots(selectedBarber?.id, dayOfWeek);

  const step = !selectedBarber ? 1 : !selectedDate ? 2 : !selectedTime ? 3 : 4;

  const handleSubmit = async () => {
    if (!selectedBarber || !selectedDate || !selectedTime || !clientName.trim() || !clientPhone.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSubmitting(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { error } = await supabase.from("appointments").insert({
      barber_id: selectedBarber.id,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      appointment_date: dateStr,
      appointment_time: selectedTime,
    });

    if (error) {
      toast.error("Erro ao agendar. Tente novamente.");
      setSubmitting(false);
      return;
    }

    toast.success("Agendamento criado com sucesso!");

    const displayDate = format(selectedDate, "dd/MM/yyyy", { locale: ptBR });
    const displayTime = selectedTime.substring(0, 5);
    const msg = encodeURIComponent(
      `Olá, meu nome é ${clientName.trim()}.\nPosso agendar no dia ${displayDate} às ${displayTime}?`
    );
    const waUrl = `https://wa.me/${selectedBarber.phone}?text=${msg}`;
    window.open(waUrl, "_blank");

    setSelectedBarber(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setClientName("");
    setClientPhone("");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              s <= step ? "w-8 bg-primary" : "w-4 bg-secondary"
            }`}
          />
        ))}
      </div>

      {/* Step title */}
      <h2 className="font-display text-xl font-bold text-foreground text-center">
        {stepTitles[step - 1]}
      </h2>

      {/* Only render the active step */}
      <div className="animate-fade-in" key={step}>
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            {barbers.map((b) => (
              <BarberCard
                key={b.id}
                barber={b}
                selected={selectedBarber?.id === b.id}
                onSelect={() => {
                  setSelectedBarber(b);
                  setSelectedDate(null);
                  setSelectedTime(null);
                }}
              />
            ))}
          </div>
        )}

        {step === 2 && selectedBarber && (
          <BookingCalendar
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setSelectedTime(null);
            }}
            blockedSlots={blockedSlots}
          />
        )}

        {step === 3 && selectedDate && selectedBarber && (
          <TimeSlotsGrid
            slots={timeSlots}
            blockedSlots={blockedSlots}
            appointments={appointments}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
          />
        )}

        {step === 4 && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Seu nome"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
            <input
              type="tel"
              placeholder="WhatsApp (ex: 61 99999-9999)"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />

            {/* Summary */}
            <div className="glass-card rounded-xl p-4 text-sm space-y-1">
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">Barbeiro:</span> {selectedBarber?.name}
              </p>
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">Data:</span>{" "}
                {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
              </p>
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">Horário:</span> {selectedTime?.substring(0, 5)}
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !clientName.trim() || !clientPhone.trim()}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed glow-gold"
            >
              {submitting ? "Agendando..." : "Confirmar Agendamento"}
            </button>
          </div>
        )}
      </div>

      {/* Back button */}
      {step > 1 && (
        <button
          onClick={() => {
            if (step === 4) setSelectedTime(null);
            else if (step === 3) setSelectedDate(null);
            else if (step === 2) setSelectedBarber(null);
          }}
          className="w-full py-3 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          ← Voltar
        </button>
      )}
    </div>
  );
};

export default BookingFlow;
