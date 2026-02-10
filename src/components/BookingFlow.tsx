import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import {
  useBarbers,
  useBlockedSlots,
  useTimeSlots,
  useAppointments,
  Barber,
} from "@/hooks/useSupabase";
import BarberCard from "@/components/BarberCard";
import BookingCalendar from "@/components/BookingCalendar";
import TimeSlotsGrid from "@/components/TimeSlotsGrid";
import { toast } from "sonner";

const stepTitles = [
  "Escolha o Barbeiro",
  "Escolha a Data",
  "Escolha o Horário",
  "Seus Dados",
];

const BookingFlow = () => {
  const { barbers, loading } = useBarbers();
  const { appointments } = useAppointments();

  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  const blockedSlots = useBlockedSlots(selectedBarber?.id);
  const dayOfWeek = selectedDate ? selectedDate.getDay() : undefined;
  const timeSlots = useTimeSlots(selectedBarber?.id, dayOfWeek);

  const step = !selectedBarber
    ? 1
    : !selectedDate
    ? 2
    : !selectedTime
    ? 3
    : 4;

  const handleSubmit = async () => {
    if (
      !selectedBarber ||
      !selectedDate ||
      !selectedTime ||
      !clientName.trim() ||
      !clientPhone.trim()
    ) {
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
      status: "PENDENTE",
    });

    if (error) {
      toast.error("Erro ao criar o agendamento");
      setSubmitting(false);
      return;
    }

    toast.success("Agendamento criado! Confirme no WhatsApp 👇");

    const displayDate = format(selectedDate, "dd/MM/yyyy", { locale: ptBR });
    const displayTime = selectedTime.substring(0, 5);

    const msg = encodeURIComponent(
      `Olá, meu nome é ${clientName.trim()}.\nGostaria de saber se posso agendar um horário no dia ${displayDate} às ${displayTime}.`
    );

    const waUrl = `https://wa.me/${selectedBarber.phone}?text=${msg}`;

    setWhatsappLink(waUrl);
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
      <div className="flex items-center justify-center gap-2">
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
      <h2 className="text-center text-xl font-bold font-display">
        {stepTitles[step - 1]}
      </h2>

      {/* Active step */}
      <div key={step} className="animate-fade-in">
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            {barbers.map((barber) => (
              <BarberCard
                key={barber.id}
                barber={barber}
                selected={selectedBarber?.id === barber.id}
                onSelect={() => {
                  setSelectedBarber(barber);
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setWhatsappLink(null);
                }}
              />
            ))}
          </div>
        )}

        {step === 2 && selectedBarber && (
          <BookingCalendar
            selectedDate={selectedDate}
            blockedSlots={blockedSlots}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setSelectedTime(null);
            }}
          />
        )}

        {step === 3 && selectedBarber && selectedDate && (
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
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:ring-2 focus:ring-primary outline-none"
            />

            <input
              type="tel"
              placeholder="WhatsApp (ex: 61 99999-9999)"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border focus:ring-2 focus:ring-primary outline-none"
            />

            <div className="glass-card rounded-xl p-4 text-sm space-y-1">
              <p>
                <strong>Barbeiro:</strong> {selectedBarber?.name}
              </p>
              <p>
                <strong>Data:</strong>{" "}
                {selectedDate &&
                  format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
              </p>
              <p>
                <strong>Horário:</strong> {selectedTime?.substring(0, 5)}
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg disabled:opacity-50"
            >
              {submitting ? "Agendando..." : "Confirmar Agendamento"}
            </button>

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-4 py-4 rounded-xl bg-green-500 text-white font-bold text-lg flex items-center justify-center gap-2 animate-pulse"
                onClick={() => {
                  setTimeout(() => {
                    setSelectedBarber(null);
                    setSelectedDate(null);
                    setSelectedTime(null);
                    setClientName("");
                    setClientPhone("");
                    setWhatsappLink(null);
                  }, 500);
                }}
              >
                Abrir WhatsApp para confirmar
              </a>
            )}
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
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar
        </button>
      )}
    </div>
  );
};

export default BookingFlow;
