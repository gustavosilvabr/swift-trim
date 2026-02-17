import { useState } from "react";
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
import { CheckCircle, Scissors, Package, ChevronRight, ArrowLeft, User, Phone, Calendar, Clock } from "lucide-react";

const stepLabels = ["Barbeiro", "Data", "Horário", "Serviços", "Confirmar"];

const BookingFlow = () => {
  const { barbers, loading } = useBarbers();
  const { appointments } = useAppointments();
  const { services } = useServices();

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
      <div className="space-y-6 animate-fade-in text-center py-6">
        <div className="w-20 h-20 rounded-full gold-gradient mx-auto flex items-center justify-center shadow-lg">
          <CheckCircle className="w-10 h-10 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Agendamento Confirmado!</h2>
          <p className="text-muted-foreground text-sm mt-1">Seu horário foi reservado com sucesso.</p>
        </div>
        <div className="pro-card rounded-xl p-5 text-sm space-y-2.5 text-left">
          <div className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /><span className="text-foreground">{selectedBarber?.name}</span></div>
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /><span className="text-foreground">{selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span></div>
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /><span className="text-foreground">{selectedTime?.substring(0, 5)}</span></div>
          {selectedServiceNames && <div className="flex items-center gap-2"><Scissors className="w-4 h-4 text-primary" /><span className="text-foreground">{selectedServiceNames}</span></div>}
          {totalAmount > 0 && (
            <div className="pt-2 border-t border-border flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Total</span>
              <span className="text-primary font-bold text-lg">R$ {totalAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
        <button onClick={resetFlow} className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-bold text-base shadow-lg hover:opacity-90 transition-all">
          Novo Agendamento
        </button>
      </div>
    );
  }

  const servicos = services.filter((s) => s.category === "servico");
  const produtos = services.filter((s) => s.category === "produto");

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {stepLabels.map((label, i) => {
          const s = i + 1;
          const isActive = s === step;
          const isDone = s < step;
          return (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1 w-full rounded-full transition-all duration-500 ${
                isDone ? "bg-primary" : isActive ? "bg-primary/60" : "bg-secondary"
              }`} />
              <span className={`text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : isDone ? "text-primary/60" : "text-muted-foreground/50"
              }`}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Active step */}
      <div key={step} className="animate-fade-in">
        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
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
            <p className="text-xs text-muted-foreground text-center">Selecione um ou mais serviços</p>

            {servicos.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" /> Serviços
                </p>
                {servicos.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                      selectedServices.includes(s.id)
                        ? "pro-card ring-2 ring-primary glow-gold"
                        : "pro-card hover:ring-1 hover:ring-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedServices.includes(s.id) ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}>
                        {selectedServices.includes(s.id) && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
                      </div>
                      <span className="font-medium text-foreground text-sm">{s.name}</span>
                    </div>
                    <span className="text-primary font-bold text-sm">R$ {s.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}

            {produtos.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Produtos
                </p>
                {produtos.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                      selectedServices.includes(s.id)
                        ? "pro-card ring-2 ring-primary glow-gold"
                        : "pro-card hover:ring-1 hover:ring-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedServices.includes(s.id) ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}>
                        {selectedServices.includes(s.id) && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
                      </div>
                      <span className="font-medium text-foreground text-sm">{s.name}</span>
                    </div>
                    <span className="text-primary font-bold text-sm">R$ {s.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}

            {totalAmount > 0 && (
              <div className="pro-card rounded-xl p-4 flex justify-between items-center glow-gold">
                <span className="text-foreground font-bold">Total</span>
                <span className="text-primary font-bold text-xl">R$ {totalAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground transition-all"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="WhatsApp (ex: 61 99999-9999)"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground transition-all"
                />
              </div>
            </div>

            <div className="pro-card rounded-xl p-5 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Resumo</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Barbeiro</span><span className="text-foreground font-medium">{selectedBarber?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Data</span><span className="text-foreground font-medium">{selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Horário</span><span className="text-foreground font-medium">{selectedTime?.substring(0, 5)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Serviços</span><span className="text-foreground font-medium text-right max-w-[180px]">{selectedServiceNames}</span></div>
              </div>
              <div className="pt-3 border-t border-border flex justify-between items-center">
                <span className="text-foreground font-bold">Total</span>
                <span className="text-primary font-bold text-xl">R$ {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-xl gold-gradient text-primary-foreground font-bold text-base shadow-lg disabled:opacity-50 hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  Confirmar Agendamento
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
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
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      )}
    </div>
  );
};

export default BookingFlow;
