import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAppointments, useBarbers, Appointment } from "@/hooks/useSupabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LogOut, Check, X, Trash2, CheckCircle, Edit2, ArrowLeft, User, Phone } from "lucide-react";
import { toast } from "sonner";

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-500/20 text-yellow-400",
  confirmado: "bg-blue-500/20 text-blue-400",
  concluido: "bg-green-500/20 text-green-400",
  cancelado: "bg-red-500/20 text-red-400",
};

const Admin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const { appointments, refetch } = useAppointments();
  const { barbers } = useBarbers();

  // Settings state
  const [editingBarber, setEditingBarber] = useState<string | null>(null);
  const [barberName, setBarberName] = useState("");
  const [barberPhone, setBarberPhone] = useState("");
  const [activeTab, setActiveTab] = useState<"appointments" | "barbers">("appointments");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError("Email ou senha incorretos");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const updateStatus = async (id: string, status: Appointment["status"]) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    toast.success(`Status atualizado para ${status}`);
    refetch();
  };

  const deleteAppointment = async (id: string) => {
    await supabase.from("appointments").delete().eq("id", id);
    toast.success("Agendamento excluído");
    refetch();
  };

  const updateBarber = async (id: string) => {
    const updates: Record<string, string> = {};
    if (barberName.trim()) updates.name = barberName.trim();
    if (barberPhone.trim()) updates.phone = barberPhone.trim();
    if (Object.keys(updates).length === 0) return;

    await supabase.from("barbers").update(updates).eq("id", id);
    toast.success("Barbeiro atualizado");
    setEditingBarber(null);
    setBarberName("");
    setBarberPhone("");
  };

  const handlePhotoUpload = async (barberId: string, file: File) => {
    const ext = file.name.split(".").pop();
    const path = `barbers/${barberId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("barber-photos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar foto");
      return;
    }

    const { data } = supabase.storage.from("barber-photos").getPublicUrl(path);
    await supabase.from("barbers").update({ photo_url: data.publicUrl }).eq("id", barberId);
    toast.success("Foto atualizada");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Login screen
  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold gold-text mb-2">Admin</h1>
            <p className="text-muted-foreground text-sm">Acesso restrito</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
            {loginError && <p className="text-destructive text-sm">{loginError}</p>}
            <button type="submit" className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold transition-all hover:opacity-90">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard
  const getBarberName = (id: string) => barbers.find((b) => b.id === id)?.name || "—";

  const pendentes = appointments.filter((a) => a.status === "pendente");
  const confirmados = appointments.filter((a) => a.status === "confirmado");
  const concluidos = appointments.filter((a) => a.status === "concluido");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full py-4 px-4 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="font-display text-xl font-bold gold-text">Painel Admin</h1>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-12">
        {/* Dashboard cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{pendentes.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Pendentes</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{confirmados.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Confirmados</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{concluidos.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Concluídos</p>
          </div>
        </div>

        {/* Per barber stats */}
        <div className="grid grid-cols-2 gap-3">
          {barbers.map((b) => {
            const bApps = appointments.filter((a) => a.barber_id === b.id);
            return (
              <div key={b.id} className="glass-card rounded-xl p-4">
                <p className="font-display font-semibold text-foreground mb-2">{b.name}</p>
                <div className="space-y-1 text-xs">
                  <p className="text-yellow-400">{bApps.filter((a) => a.status === "pendente").length} pendentes</p>
                  <p className="text-blue-400">{bApps.filter((a) => a.status === "confirmado").length} confirmados</p>
                  <p className="text-green-400">{bApps.filter((a) => a.status === "concluido").length} concluídos</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "appointments" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            Agendamentos
          </button>
          <button
            onClick={() => setActiveTab("barbers")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "barbers" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            Barbeiros
          </button>
        </div>

        {activeTab === "appointments" && (
          <div className="space-y-3">
            {appointments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum agendamento</p>
            )}
            {appointments.map((a) => (
              <div key={a.id} className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{a.client_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {a.client_phone}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[a.status]}`}>
                    {a.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{getBarberName(a.barber_id)}</span>
                  <span>{format(new Date(a.appointment_date + "T00:00:00"), "dd/MM", { locale: ptBR })}</span>
                  <span>{a.appointment_time.substring(0, 5)}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {a.status === "pendente" && (
                    <button onClick={() => updateStatus(a.id, "confirmado")} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                      <Check className="w-3 h-3" /> Confirmar
                    </button>
                  )}
                  {(a.status === "pendente" || a.status === "confirmado") && (
                    <button onClick={() => updateStatus(a.id, "concluido")} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                      <CheckCircle className="w-3 h-3" /> Concluir
                    </button>
                  )}
                  {a.status !== "cancelado" && a.status !== "concluido" && (
                    <button onClick={() => updateStatus(a.id, "cancelado")} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                      <X className="w-3 h-3" /> Cancelar
                    </button>
                  )}
                  <button onClick={() => deleteAppointment(a.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3 h-3" /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "barbers" && (
          <div className="space-y-4">
            {barbers.map((b) => (
              <div key={b.id} className="glass-card rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
                    {b.photo_url ? (
                      <img src={b.photo_url} alt={b.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-semibold text-foreground">{b.name}</p>
                    <p className="text-sm text-muted-foreground">{b.phone}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingBarber(editingBarber === b.id ? null : b.id);
                      setBarberName(b.name);
                      setBarberPhone(b.phone);
                    }}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {editingBarber === b.id && (
                  <div className="space-y-3 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Nome"
                      value={barberName}
                      onChange={(e) => setBarberName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Telefone WhatsApp"
                      value={barberPhone}
                      onChange={(e) => setBarberPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none"
                    />
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">Alterar Foto</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(b.id, file);
                        }}
                        className="text-sm text-muted-foreground"
                      />
                    </div>
                    <button
                      onClick={() => updateBarber(b.id)}
                      className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
                    >
                      Salvar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
