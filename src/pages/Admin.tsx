import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAppointments, useBarbers, Appointment } from "@/hooks/useSupabase";
import { format, parseISO, startOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LogOut, Check, X, Trash2, Edit2, ArrowLeft,
  User, Phone, DollarSign, Image, Settings, Clock,
  Upload, Plus, MessageCircle, Users, Scissors, ChevronLeft, ChevronRight, Shield
} from "lucide-react";
import { toast } from "sonner";
import FinancialTab from "@/components/admin/FinancialTab";
import WorkingHoursManager from "@/components/admin/WorkingHoursManager";
import ServicesManager from "@/components/admin/ServicesManager";
import UpcomingAppointments from "@/components/admin/UpcomingAppointments";

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-500/20 text-yellow-400",
  confirmado: "bg-green-500/20 text-green-400",
  cancelado: "bg-red-500/20 text-red-400",
};

type Tab = "appointments" | "barbers" | "financial" | "gallery" | "clients" | "hours" | "services" | "settings" | "access";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const { appointments, refetch } = useAppointments();
  const { barbers } = useBarbers();

  // Role state
  const [userRole, setUserRole] = useState<"owner" | "barber" | null>(null);
  const [myBarberId, setMyBarberId] = useState<string | null>(null);

  const [editingBarber, setEditingBarber] = useState<string | null>(null);
  const [barberName, setBarberName] = useState("");
  const [barberPhone, setBarberPhone] = useState("");
  const [barberSpecialty, setBarberSpecialty] = useState("");
  const [barberPrice, setBarberPrice] = useState("");
  const [barberActive, setBarberActive] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("appointments");

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [editingAppointment, setEditingAppointment] = useState<string | null>(null);
  const [editServiceType, setEditServiceType] = useState("corte");
  const [editProducts, setEditProducts] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editObs, setEditObs] = useState("");
  const [editPayment, setEditPayment] = useState("");

  const [galleryImages, setGalleryImages] = useState<{ id: string; image_url: string; title: string }[]>([]);

  const [newEmail, setNewEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // Calendar date for appointments
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Barber user management
  const [newBarberEmail, setNewBarberEmail] = useState("");
  const [newBarberPw, setNewBarberPw] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState("");
  const [barberUsers, setBarberUsers] = useState<{ user_id: string; barber_id: string | null; role: string }[]>([]);

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

  // Fetch role
  useEffect(() => {
    if (!session) { setUserRole(null); setMyBarberId(null); return; }
    const fetchRole = async () => {
      const { data: roles } = await supabase.from("user_roles").select("role, barber_id").eq("user_id", session.user.id);
      if (roles && roles.length > 0) {
        const r = roles[0];
        setUserRole(r.role as "owner" | "barber");
        setMyBarberId(r.barber_id);
      } else {
        // Check if this is the original admin (owner without role entry)
        const { data: isOwner } = await supabase.rpc("is_owner");
        if (isOwner) {
          setUserRole("owner");
        }
      }
    };
    fetchRole();
  }, [session]);

  // Fetch barber users for access tab
  useEffect(() => {
    if (!session || userRole !== "owner") return;
    const fetchBarberUsers = async () => {
      const { data } = await supabase.from("user_roles").select("user_id, barber_id, role");
      if (data) setBarberUsers(data);
    };
    fetchBarberUsers();
  }, [session, userRole]);

  useEffect(() => {
    if (!session) return;
    const fetchExpenses = async () => {
      const { data } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
      if (data) setExpenses(data as Expense[]);
    };
    fetchExpenses();
    const ch = supabase.channel("expenses-rt").on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => fetchExpenses()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const fetchGallery = async () => {
      const { data } = await supabase.from("gallery_images").select("*").order("sort_order");
      if (data) setGalleryImages(data);
    };
    fetchGallery();
  }, [session]);

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

  const saveAppointmentEdit = async (id: string) => {
    await supabase.from("appointments").update({
      service_type: editServiceType,
      products_sold: editProducts,
      total_amount: parseFloat(editAmount) || 0,
      observation: editObs,
      payment_method: editPayment,
    }).eq("id", id);
    toast.success("Agendamento atualizado");
    setEditingAppointment(null);
    refetch();
  };

  const updateBarber = async (id: string) => {
    const updates: Record<string, unknown> = {};
    if (barberName.trim()) updates.name = barberName.trim();
    if (barberPhone.trim()) updates.phone = barberPhone.trim();
    updates.specialty = barberSpecialty.trim();
    updates.default_price = parseFloat(barberPrice) || 0;
    updates.is_active = barberActive;
    await supabase.from("barbers").update(updates).eq("id", id);
    toast.success("Barbeiro atualizado");
    setEditingBarber(null);
  };

  const handlePhotoUpload = async (barberId: string, file: File) => {
    const ext = file.name.split(".").pop();
    const path = `barbers/${barberId}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("barber-photos").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Erro ao enviar foto"); return; }
    const { data } = supabase.storage.from("barber-photos").getPublicUrl(path);
    await supabase.from("barbers").update({ photo_url: data.publicUrl }).eq("id", barberId);
    toast.success("Foto atualizada");
  };

  const handleGalleryUpload = async (file: File) => {
    const path = `cuts/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("gallery").upload(path, file);
    if (error) { toast.error("Erro ao enviar imagem"); return; }
    const { data } = supabase.storage.from("gallery").getPublicUrl(path);
    await supabase.from("gallery_images").insert({ image_url: data.publicUrl, title: "", sort_order: galleryImages.length });
    toast.success("Imagem adicionada");
    const { data: imgs } = await supabase.from("gallery_images").select("*").order("sort_order");
    if (imgs) setGalleryImages(imgs);
  };

  const deleteGalleryImage = async (id: string) => {
    await supabase.from("gallery_images").delete().eq("id", id);
    setGalleryImages((prev) => prev.filter((i) => i.id !== id));
    toast.success("Imagem removida");
  };

  const handleFacadeUpload = async (file: File) => {
    const path = `facade/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar foto"); return; }
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    await supabase.from("site_settings").upsert({ key: "store_facade_url", value: data.publicUrl }, { onConflict: "key" });
    toast.success("Foto da fachada atualizada");
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) { toast.error(error.message); return; }
    toast.success("Email de confirmação enviado");
    setNewEmail("");
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || newPw !== confirmPw) {
      toast.error("Senhas não conferem");
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session?.user?.email || "",
      password: currentPw,
    });
    if (signInError) { toast.error("Senha atual incorreta"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) { toast.error(error.message); return; }
    toast.success("Senha alterada com sucesso");
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  const handleCreateBarberUser = async () => {
    if (!newBarberEmail.trim() || !newBarberPw || !selectedBarberId) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("manage-barber-user", {
        body: { action: "create", email: newBarberEmail.trim(), password: newBarberPw, barber_id: selectedBarberId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Conta de barbeiro criada!");
      setNewBarberEmail(""); setNewBarberPw(""); setSelectedBarberId("");
      // Refresh
      const { data: roles } = await supabase.from("user_roles").select("user_id, barber_id, role");
      if (roles) setBarberUsers(roles);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta");
    }
  };

  const handleDeleteBarberUser = async (userId: string) => {
    if (!confirm("Excluir esta conta de barbeiro?")) return;
    try {
      const { data, error } = await supabase.functions.invoke("manage-barber-user", {
        body: { action: "delete", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Conta excluída");
      setBarberUsers((prev) => prev.filter((u) => u.user_id !== userId));
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
            <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
            {loginError && <p className="text-destructive text-sm">{loginError}</p>}
            <button type="submit" className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold transition-all hover:opacity-90">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  const isOwner = userRole === "owner";
  const getBarberName = (id: string) => barbers.find((b) => b.id === id)?.name || "—";

  // Filter appointments based on role
  const visibleAppointments = isOwner
    ? appointments
    : appointments.filter((a) => a.barber_id === myBarberId);

  // Filter by selected date
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const dateFilteredAppointments = visibleAppointments.filter((a) => a.appointment_date === selectedDateStr);

  const pendentes = visibleAppointments.filter((a) => a.status === "pendente");
  const confirmados = visibleAppointments.filter((a) => a.status === "confirmado");

  // Tabs based on role
  const ownerTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "appointments", label: "Agenda", icon: <Clock className="w-4 h-4" /> },
    { id: "barbers", label: "Barbeiros", icon: <User className="w-4 h-4" /> },
    { id: "financial", label: "Financeiro", icon: <DollarSign className="w-4 h-4" /> },
    { id: "services", label: "Serviços", icon: <Scissors className="w-4 h-4" /> },
    { id: "clients", label: "Clientes", icon: <Users className="w-4 h-4" /> },
    { id: "hours", label: "Horários", icon: <Clock className="w-4 h-4" /> },
    { id: "gallery", label: "Galeria", icon: <Image className="w-4 h-4" /> },
    { id: "access", label: "Acessos", icon: <Shield className="w-4 h-4" /> },
    { id: "settings", label: "Config", icon: <Settings className="w-4 h-4" /> },
  ];

  const barberTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "appointments", label: "Agenda", icon: <Clock className="w-4 h-4" /> },
    { id: "financial", label: "Financeiro", icon: <DollarSign className="w-4 h-4" /> },
    { id: "settings", label: "Config", icon: <Settings className="w-4 h-4" /> },
  ];

  const tabs = isOwner ? ownerTabs : barberTabs;

  const thisMonth = format(new Date(), "yyyy-MM");
  const thisYear = format(new Date(), "yyyy");

  // Navigate date
  const goDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full py-3 sm:py-4 px-3 sm:px-4 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="font-display text-lg sm:text-xl font-bold gold-text">
            {isOwner ? "Painel Admin" : "Minha Agenda"}
          </h1>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-12">
        {/* Dashboard cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="glass-card rounded-xl p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-yellow-400">{pendentes.length}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Pendentes</p>
          </div>
          <div className="glass-card rounded-xl p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-400">{confirmados.length}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Confirmados</p>
          </div>
        </div>

        {/* Upcoming appointments */}
        <UpcomingAppointments appointments={visibleAppointments} barbers={barbers} />

        {/* Per barber stats - only for owner */}
        {isOwner && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {barbers.map((b) => {
              const bApps = appointments.filter((a) => a.barber_id === b.id);
              return (
                <div key={b.id} className="glass-card rounded-xl p-3 sm:p-4">
                  <p className="font-display font-semibold text-foreground text-sm mb-2">{b.name}</p>
                  <div className="space-y-1 text-xs">
                    <p className="text-yellow-400">{bApps.filter((a) => a.status === "pendente").length} pendentes</p>
                    <p className="text-green-400">{bApps.filter((a) => a.status === "confirmado").length} confirmados</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap ${activeTab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* APPOINTMENTS TAB */}
        {activeTab === "appointments" && (
          <div className="space-y-3">
            {/* Date navigator */}
            <div className="glass-card rounded-xl p-3 flex items-center justify-between">
              <button onClick={() => goDate(-1)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="text-center">
                <p className="font-display font-semibold text-foreground text-sm">
                  {isSameDay(selectedDate, new Date()) ? "Hoje" : format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-[10px] text-muted-foreground">{format(selectedDate, "EEEE", { locale: ptBR })}</p>
              </div>
              <button onClick={() => goDate(1)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Quick date buttons */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {[-2, -1, 0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const d = new Date();
                d.setDate(d.getDate() + offset);
                const isActive = isSameDay(d, selectedDate);
                return (
                  <button key={offset} onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-w-[48px] ${isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    <span className="text-[10px]">{format(d, "EEE", { locale: ptBR })}</span>
                    <span className="font-bold">{format(d, "dd")}</span>
                  </button>
                );
              })}
            </div>

            {dateFilteredAppointments.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nenhum agendamento para esta data</p>}
            {dateFilteredAppointments.map((a) => (
              <div key={a.id} className="glass-card rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm truncate">{a.client_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3 flex-shrink-0" /> {a.client_phone}</p>
                  </div>
                  <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColors[a.status] || "bg-secondary text-muted-foreground"}`}>{a.status}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <span>{getBarberName(a.barber_id)}</span>
                  <span>{a.appointment_time.substring(0, 5)}</span>
                </div>
                {a.service_type && (
                  <p className="text-xs text-primary">{a.service_type} {(a.total_amount ?? 0) > 0 ? `• R$ ${Number(a.total_amount).toFixed(2)}` : ""}</p>
                )}
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  {a.status === "pendente" && (
                    <button onClick={() => updateStatus(a.id, "confirmado")} className="flex items-center gap-1 text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"><Check className="w-3 h-3" /> Confirmar</button>
                  )}
                  {a.status !== "cancelado" && (
                    <button onClick={() => updateStatus(a.id, "cancelado")} className="flex items-center gap-1 text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"><X className="w-3 h-3" /> Cancelar</button>
                  )}
                  <button onClick={() => {
                    if (editingAppointment === a.id) { setEditingAppointment(null); return; }
                    setEditingAppointment(a.id);
                    setEditServiceType(a.service_type || "corte");
                    setEditProducts(a.products_sold || "");
                    setEditAmount(String(a.total_amount || ""));
                    setEditObs(a.observation || "");
                    setEditPayment(a.payment_method || "");
                  }} className="flex items-center gap-1 text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"><Edit2 className="w-3 h-3" /> Editar</button>
                  {isOwner && (
                    <button onClick={() => deleteAppointment(a.id)} className="flex items-center gap-1 text-[10px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3 h-3" /> Excluir</button>
                  )}
                </div>
                {editingAppointment === a.id && (
                  <div className="space-y-2 sm:space-y-3 pt-2 border-t border-border animate-fade-in">
                    <input type="text" placeholder="Tipo de serviço" value={editServiceType} onChange={(e) => setEditServiceType(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
                    <input type="text" placeholder="Produtos vendidos" value={editProducts} onChange={(e) => setEditProducts(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
                    <input type="number" placeholder="Valor total (R$)" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
                    <input type="text" placeholder="Observação" value={editObs} onChange={(e) => setEditObs(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
                    <select value={editPayment} onChange={(e) => setEditPayment(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border">
                      <option value="">Pagamento (opcional)</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">Pix</option>
                      <option value="cartao">Cartão</option>
                    </select>
                    <button onClick={() => saveAppointmentEdit(a.id)} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Salvar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* BARBERS TAB - owner only */}
        {activeTab === "barbers" && isOwner && (
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-4 space-y-3">
              <p className="font-display font-semibold text-foreground">Foto da Fachada</p>
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFacadeUpload(f); }} className="text-sm text-muted-foreground" />
            </div>
            {barbers.map((b) => (
              <div key={b.id} className="glass-card rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
                    {b.photo_url ? <img src={b.photo_url} alt={b.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-secondary flex items-center justify-center"><User className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-foreground text-sm">{b.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{b.phone}</p>
                  </div>
                  <button onClick={() => {
                    setEditingBarber(editingBarber === b.id ? null : b.id);
                    setBarberName(b.name); setBarberPhone(b.phone);
                    setBarberSpecialty((b as any).specialty || ""); setBarberPrice(String((b as any).default_price || ""));
                    setBarberActive((b as any).is_active !== false);
                  }} className="p-2 rounded-lg hover:bg-secondary transition-colors"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                {editingBarber === b.id && (
                  <div className="space-y-3 animate-fade-in">
                    <input type="text" placeholder="Nome" value={barberName} onChange={(e) => setBarberName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none" />
                    <input type="tel" placeholder="WhatsApp" value={barberPhone} onChange={(e) => setBarberPhone(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none" />
                    <input type="text" placeholder="Especialidade" value={barberSpecialty} onChange={(e) => setBarberSpecialty(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none" />
                    <input type="number" placeholder="Valor padrão (R$)" value={barberPrice} onChange={(e) => setBarberPrice(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none" />
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" checked={barberActive} onChange={(e) => setBarberActive(e.target.checked)} className="accent-primary" /> Ativo
                    </label>
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">Alterar Foto</label>
                      <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(b.id, f); }} className="text-sm text-muted-foreground" />
                    </div>
                    <button onClick={() => updateBarber(b.id)} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all">Salvar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* FINANCIAL TAB */}
        {activeTab === "financial" && (
          <FinancialTab
            appointments={isOwner ? appointments : visibleAppointments}
            barbers={isOwner ? barbers : barbers.filter((b) => b.id === myBarberId)}
            expenses={expenses}
            setExpenses={setExpenses}
            isOwner={isOwner}
          />
        )}

        {/* SERVICES TAB - owner only */}
        {activeTab === "services" && isOwner && <ServicesManager />}

        {/* CLIENTS TAB - owner only */}
        {activeTab === "clients" && isOwner && (
          <div className="space-y-3">
            <p className="font-display font-semibold text-foreground text-base sm:text-lg">Histórico de Clientes</p>
            {(() => {
              const clientMap = new Map<string, { name: string; phone: string; cuts: typeof appointments; lastCut: string | null }>();
              appointments.filter((a) => a.status === "confirmado").forEach((a) => {
                const key = a.client_phone;
                if (!clientMap.has(key)) clientMap.set(key, { name: a.client_name, phone: a.client_phone, cuts: [], lastCut: null });
                const c = clientMap.get(key)!;
                c.cuts.push(a);
                if (!c.lastCut || a.appointment_date > c.lastCut) c.lastCut = a.appointment_date;
              });

              return (
                <>
                  {Array.from(clientMap.values()).sort((a, b) => (b.lastCut || "").localeCompare(a.lastCut || "")).map((c) => {
                    const daysSinceCut = c.lastCut ? Math.floor((Date.now() - new Date(c.lastCut + "T00:00:00").getTime()) / 86400000) : 999;
                    const statusColor = daysSinceCut > 30 ? "text-red-400" : daysSinceCut > 15 ? "text-yellow-400" : "text-green-400";
                    const thisMonthCuts = c.cuts.filter((a) => a.appointment_date.startsWith(thisMonth)).length;
                    const thisYearCuts = c.cuts.filter((a) => a.appointment_date.startsWith(thisYear)).length;
                    const lastBarber = c.cuts.length > 0 ? getBarberName(c.cuts[c.cuts.length - 1].barber_id) : "—";
                    const waMsg = encodeURIComponent("Fala meu parceiro! Já tem mais de 15 dias desde seu último corte 😎 Bora ficar na régua novamente?");
                    const waLink = `https://wa.me/${c.phone.replace(/\D/g, "")}?text=${waMsg}`;

                    return (
                      <div key={c.phone} className="glass-card rounded-xl p-3 sm:p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground text-sm truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.phone}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-bold ${statusColor}`}>{daysSinceCut}d</span>
                            <a href={waLink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30">
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-1 sm:gap-2 text-[10px] sm:text-xs text-center">
                          <div><p className="text-muted-foreground">Mês</p><p className="font-bold text-foreground">{thisMonthCuts}</p></div>
                          <div><p className="text-muted-foreground">Ano</p><p className="font-bold text-foreground">{thisYearCuts}</p></div>
                          <div><p className="text-muted-foreground">Total</p><p className="font-bold text-foreground">{c.cuts.length}</p></div>
                          <div><p className="text-muted-foreground">Barbeiro</p><p className="font-bold text-foreground truncate">{lastBarber}</p></div>
                        </div>
                        {c.lastCut && <p className="text-[10px] sm:text-xs text-muted-foreground">Último: {format(new Date(c.lastCut + "T00:00:00"), "dd/MM/yyyy")}</p>}
                      </div>
                    );
                  })}
                  {clientMap.size === 0 && <p className="text-center text-muted-foreground py-8">Nenhum cliente com atendimento</p>}
                </>
              );
            })()}
          </div>
        )}

        {/* WORKING HOURS TAB - owner only */}
        {activeTab === "hours" && isOwner && <WorkingHoursManager barbers={barbers} />}

        {/* GALLERY TAB - owner only */}
        {activeTab === "gallery" && isOwner && (
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-4 space-y-3">
              <p className="font-display font-semibold text-foreground">Upload de Imagens</p>
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGalleryUpload(f); }} className="text-sm text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {galleryImages.map((img) => (
                <div key={img.id} className="relative rounded-xl overflow-hidden border border-border group">
                  <img src={img.image_url} alt={img.title} className="w-full aspect-square object-cover" />
                  <button onClick={() => deleteGalleryImage(img.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACCESS TAB - owner only */}
        {activeTab === "access" && isOwner && (
          <div className="space-y-5">
            <div className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <p className="font-display font-semibold text-foreground text-sm">Criar Conta de Barbeiro</p>
              </div>
              <select value={selectedBarberId} onChange={(e) => setSelectedBarberId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border">
                <option value="">Selecione o barbeiro</option>
                {barbers.filter((b) => !barberUsers.some((u) => u.barber_id === b.id)).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <input type="email" placeholder="Email do barbeiro" value={newBarberEmail} onChange={(e) => setNewBarberEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
              <input type="password" placeholder="Senha" value={newBarberPw} onChange={(e) => setNewBarberPw(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={handleCreateBarberUser} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                <Plus className="w-4 h-4 inline mr-1" />Criar Conta
              </button>
            </div>

            {/* Existing barber accounts */}
            <div className="space-y-2">
              <p className="font-display font-semibold text-foreground text-sm">Contas Ativas</p>
              {barberUsers.filter((u) => u.role === "barber").map((u) => {
                const barber = barbers.find((b) => b.id === u.barber_id);
                return (
                  <div key={u.user_id} className="glass-card rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{barber?.name || "Barbeiro"}</p>
                      <p className="text-xs text-muted-foreground">Papel: Barbeiro</p>
                    </div>
                    <button onClick={() => handleDeleteBarberUser(u.user_id)} className="p-2 rounded-lg hover:bg-secondary text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {barberUsers.filter((u) => u.role === "barber").length === 0 && (
                <p className="text-center text-muted-foreground text-xs py-4">Nenhuma conta de barbeiro criada</p>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="glass-card rounded-xl p-4 space-y-3">
              <p className="font-display font-semibold text-foreground">Alterar Email</p>
              <input type="email" placeholder="Novo email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={handleChangeEmail} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Alterar Email</button>
            </div>
            <div className="glass-card rounded-xl p-4 space-y-3">
              <p className="font-display font-semibold text-foreground">Alterar Senha</p>
              <input type="password" placeholder="Senha atual" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
              <input type="password" placeholder="Nova senha (mínimo 6 caracteres)" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
              <input type="password" placeholder="Confirmar nova senha" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={handleChangePassword} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Alterar Senha</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
