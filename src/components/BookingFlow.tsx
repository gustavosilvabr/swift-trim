import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import {
  useBarbers,
  useBlockedSlots,
  useTimeSlots,
  useAppointments,
  useServices,
  Barber,
} from "@/hooks/useSupabase";
import BarberCard from "@/components/BarberCard";
import BookingCalendar from "@/components/BookingCalendar";
import TimeSlotsGrid from "@/components/TimeSlotsGrid";
import { toast } from "sonner";
import { CheckCircle, Scissors } from "lucide-react";

const stepTitles = [
  "Escolha o Barbeiro",
  "Escolha a Data",
  "Escolha o Horário",
  "Escolha os Serviços",
  "Seus Dados",
];

const BookingFlow = () => {
  const { barbers: allBarbers, loading } = useBarbers();
  const { appointments } = useAppointments();
  const { services } = useServices();

  // Only show active barbers in booking
  const barbers = allBarbers.filter((b) => (b as any).is_active !== false);

  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const blockedSlots = useBlockedSlots(selectedBarber?.id);
  const dayOfWeek = selectedDate ? selectedDate.getDay() : undefined;
  const timeSlots = useTimeSlots(selectedBarber?.id, dayOfWeek);

  const totalAmount = services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  const selectedServiceNames = services
    .filter((s) => selectedServices.includes(s.id))
    .map((s) => s.name)
    .join(", ");

  const step = success
    ? 6
    : !selectedBarber
    ? 1
    : !selectedDate
    ? 2
    : !selectedTime
    ? 3
    : selectedServices.length === 0
    ? 4
    : 5;

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

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
      service_type: selectedServiceNames || "corte",
      total_amount: totalAmount,
    });

    if (error) {
      toast.error("Erro ao criar o agendamento");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSuccess(true);
  };

  const resetFlow = () => {
    setSelectedBarber(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedServices([]);
    setClientName("");
    setClientPhone("");
    setSuccess(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="space-y-6 animate-fade-in text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-foreground">Agendamento Confirmado!</h2>
        <p className="text-muted-foreground">Seu horário foi reservado com sucesso.</p>
        <div className="glass-card rounded-xl p-4 text-sm space-y-1 text-left">
          <p><strong>Barbeiro:</strong> {selectedBarber?.name}</p>
          <p><strong>Data:</strong> {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}</p>
          <p><strong>Horário:</strong> {selectedTime?.substring(0, 5)}</p>
          {selectedServiceNames && <p><strong>Serviços:</strong> {selectedServiceNames}</p>}
          {totalAmount > 0 && <p><strong>Total:</strong> R$ {totalAmount.toFixed(2)}</p>}
        </div>
        <button onClick={resetFlow} className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg">
          Novo Agendamento
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
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
                  setSelectedServices([]);
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
            <div className="space-y-2">
              {services.filter((s) => s.category === "servico").length > 0 && (
                <p className="text-sm font-semibold text-muted-foreground">Serviços</p>
              )}
              {services.filter((s) => s.category === "servico").map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                    selectedServices.includes(s.id)
                      ? "glass-card ring-2 ring-primary glow-gold"
                      : "glass-card hover:ring-1 hover:ring-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Scissors className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">{s.name}</span>
                  </div>
                  <span className="text-primary font-bold">R$ {s.price.toFixed(2)}</span>
                </button>
              ))}

              {services.filter((s) => s.category === "produto").length > 0 && (
                <p className="text-sm font-semibold text-muted-foreground mt-4">Produtos</p>
              )}
              {services.filter((s) => s.category === "produto").map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                    selectedServices.includes(s.id)
                      ? "glass-card ring-2 ring-primary glow-gold"
                      : "glass-card hover:ring-1 hover:ring-primary/50"
                  }`}
                >
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="text-primary font-bold">R$ {s.price.toFixed(2)}</span>
                </button>
              ))}
            </div>

            {totalAmount > 0 && (
              <div className="glass-card rounded-xl p-4 flex justify-between items-center">
                <span className="text-foreground font-semibold">Total</span>
                <span className="text-primary font-bold text-lg">R$ {totalAmount.toFixed(2)}</span>
              </div>
            )}

            <button
              onClick={() => {
                if (selectedServices.length === 0) {
                  toast.error("Selecione pelo menos um serviço");
                  return;
                }
              }}
              className="w-full py-3 rounded-xl bg-primary/20 text-primary font-semibold text-sm"
              style={{ display: selectedServices.length > 0 ? "none" : "block" }}
            >
              Selecione um serviço para continuar
            </button>
          </div>
        )}

        {step === 5 && (
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
              <p><strong>Barbeiro:</strong> {selectedBarber?.name}</p>
              <p><strong>Data:</strong> {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}</p>
              <p><strong>Horário:</strong> {selectedTime?.substring(0, 5)}</p>
              <p><strong>Serviços:</strong> {selectedServiceNames}</p>
              <p className="text-primary font-bold">Total: R$ {totalAmount.toFixed(2)}</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg disabled:opacity-50"
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
            if (step === 5) setSelectedServices([]);
            else if (step === 4) setSelectedTime(null);
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
