import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAppointments, useBarbers, Appointment } from "@/hooks/useSupabase";
import { requestNotificationPermission, showAppointmentNotification, isNotificationSupported } from "@/hooks/usePushNotifications";
import { format, parseISO, startOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LogOut, Check, X, Trash2, Edit2, ArrowLeft,
  User, Phone, DollarSign, Image, Settings, Clock,
  Upload, Plus, MessageCircle, Users, Scissors, ChevronLeft, ChevronRight, Shield,
  BarChart3, CalendarDays, UserX, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import FinancialTab from "@/components/admin/FinancialTab";
import WorkingHoursManager from "@/components/admin/WorkingHoursManager";
import ServicesManager from "@/components/admin/ServicesManager";
import UpcomingAppointments from "@/components/admin/UpcomingAppointments";
import AddBarberDrawer from "@/components/admin/AddBarberDrawer";

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  confirmado: "bg-green-500/20 text-green-400 border border-green-500/30",
  cancelado: "bg-red-500/20 text-red-400 border border-red-500/30",
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

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [newBarberEmail, setNewBarberEmail] = useState("");
  const [newBarberPw, setNewBarberPw] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState("");
  const [barberUsers, setBarberUsers] = useState<{ user_id: string; barber_id: string | null; role: string }[]>([]);

  const [deletingBarber, setDeletingBarber] = useState<string | null>(null);

  const prevAppointmentCount = useRef<number | null>(null);

  // Request notification permission on login
  useEffect(() => {
    if (session && isNotificationSupported()) {
      requestNotificationPermission();
    }
  }, [session]);

  // Listen for new appointments via realtime and show browser notification
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel("admin-push-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appointments" },
        (payload) => {
          const apt = payload.new as any;
          const barberName = barbers.find(b => b.id === apt.barber_id)?.name || "Barbeiro";
          showAppointmentNotification(
            apt.client_name,
            apt.service_type || "Corte",
            `${apt.appointment_date} às ${apt.appointment_time?.slice(0, 5)}`
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, barbers]);

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

  useEffect(() => {
    if (!session) { setUserRole(null); setMyBarberId(null); return; }
    const fetchRole = async () => {
      const { data: roles } = await supabase.from("user_roles").select("role, barber_id").eq("user_id", session.user.id);
      if (roles && roles.length > 0) {
        const r = roles[0];
        setUserRole(r.role as "owner" | "barber");
        setMyBarberId(r.barber_id);
      } else {
        const { data: isOwner } = await supabase.rpc("is_owner");
        if (isOwner) setUserRole("owner");
      }
    };
    fetchRole();
  }, [session]);

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

  const deleteBarber = async (barberId: string) => {
    setDeletingBarber(barberId);
    try {
      // 1. Delete all appointments for this barber
      await supabase.from("appointments").delete().eq("barber_id", barberId);
      // 2. Delete all time_slots
      await supabase.from("time_slots").delete().eq("barber_id", barberId);
      // 3. Delete all blocked_slots
      await supabase.from("blocked_slots").delete().eq("barber_id", barberId);
      // 4. Check if barber has a user account and delete it
      const barber = barbers.find((b) => b.id === barberId);
      if (barber && (barber as any).user_id) {
        try {
          await supabase.functions.invoke("manage-barber-user", {
            body: { action: "delete", user_id: (barber as any).user_id },
          });
        } catch {}
      }
      // 5. Delete user_roles linked to this barber
      await supabase.from("user_roles").delete().eq("barber_id", barberId);
      // 6. Delete the barber
      await supabase.from("barbers").delete().eq("id", barberId);
      toast.success("Barbeiro e todo histórico excluídos com sucesso");
    } catch (err: any) {
      toast.error("Erro ao excluir barbeiro: " + (err.message || ""));
    }
    setDeletingBarber(null);
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
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Voltar ao site
          </button>
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl gold-gradient mx-auto flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-muted-foreground text-sm">Acesse sua conta para gerenciar</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary/80 text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Senha</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary/80 text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm" />
            </div>
            {loginError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-destructive text-sm">{loginError}</p>
              </div>
            )}
            <button type="submit" className="w-full py-3.5 rounded-xl gold-gradient text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 transition-all shadow-lg">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isOwner = userRole === "owner";
  const getBarberName = (id: string) => barbers.find((b) => b.id === id)?.name || "—";

  const visibleAppointments = isOwner
    ? appointments
    : appointments.filter((a) => a.barber_id === myBarberId);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const dateFilteredAppointments = visibleAppointments.filter((a) => a.appointment_date === selectedDateStr);

  const pendentes = visibleAppointments.filter((a) => a.status === "pendente");
  const confirmados = visibleAppointments.filter((a) => a.status === "confirmado");

  const ownerTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "appointments", label: "Agenda", icon: <CalendarDays className="w-4 h-4" /> },
    { id: "barbers", label: "Barbeiros", icon: <User className="w-4 h-4" /> },
    { id: "financial", label: "Financeiro", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "services", label: "Serviços", icon: <Scissors className="w-4 h-4" /> },
    { id: "clients", label: "Clientes", icon: <Users className="w-4 h-4" /> },
    { id: "hours", label: "Horários", icon: <Clock className="w-4 h-4" /> },
    { id: "gallery", label: "Galeria", icon: <Image className="w-4 h-4" /> },
    { id: "access", label: "Acessos", icon: <Shield className="w-4 h-4" /> },
    { id: "settings", label: "Config", icon: <Settings className="w-4 h-4" /> },
  ];

  const barberTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "appointments", label: "Agenda", icon: <CalendarDays className="w-4 h-4" /> },
    { id: "financial", label: "Financeiro", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "settings", label: "Config", icon: <Settings className="w-4 h-4" /> },
  ];

  const tabs = isOwner ? ownerTabs : barberTabs;

  const thisMonth = format(new Date(), "yyyy-MM");
  const thisYear = format(new Date(), "yyyy");

  const goDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  // Only show active barbers in admin lists
  const activeBarbers = barbers.filter((b) => (b as any).is_active !== false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full py-4 px-4 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground leading-tight">
                {isOwner ? "Painel Admin" : "Minha Agenda"}
              </h1>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {isOwner ? "Controle Total" : "Área do Barbeiro"}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2.5 rounded-xl hover:bg-secondary transition-colors group">
            <LogOut className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-16">
        {/* Dashboard Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/20 p-4">
            <div className="relative z-10">
              <p className="text-3xl font-bold text-yellow-400 font-display">{pendentes.length}</p>
              <p className="text-xs text-yellow-400/70 font-medium mt-1 uppercase tracking-wider">Pendentes</p>
            </div>
            <Clock className="absolute -right-2 -bottom-2 w-16 h-16 text-yellow-500/10" />
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 p-4">
            <div className="relative z-10">
              <p className="text-3xl font-bold text-green-400 font-display">{confirmados.length}</p>
              <p className="text-xs text-green-400/70 font-medium mt-1 uppercase tracking-wider">Confirmados</p>
            </div>
            <Check className="absolute -right-2 -bottom-2 w-16 h-16 text-green-500/10" />
          </div>
        </div>

        {/* Upcoming appointments */}
        <UpcomingAppointments appointments={visibleAppointments} barbers={barbers} />

        {/* Per barber stats - owner */}
        {isOwner && activeBarbers.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {activeBarbers.map((b) => {
              const bApps = appointments.filter((a) => a.barber_id === b.id);
              return (
                <div key={b.id} className="rounded-2xl bg-secondary/50 border border-border/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30 flex-shrink-0">
                      {b.photo_url ? (
                        <img src={b.photo_url} alt={b.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="font-display font-semibold text-foreground text-sm truncate">{b.name}</p>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pendentes</span>
                      <span className="text-yellow-400 font-semibold">{bApps.filter((a) => a.status === "pendente").length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confirmados</span>
                      <span className="text-green-400 font-semibold">{bApps.filter((a) => a.status === "confirmado").length}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? "gold-gradient text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* APPOINTMENTS TAB */}
        {activeTab === "appointments" && (
          <div className="space-y-4">
            {/* Date navigator */}
            <div className="rounded-2xl bg-secondary/50 border border-border/50 p-4 flex items-center justify-between">
              <button onClick={() => goDate(-1)} className="p-2 rounded-xl hover:bg-background/50 transition-colors">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="text-center">
                <p className="font-display font-bold text-foreground">
                  {isSameDay(selectedDate, new Date()) ? "Hoje" : format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize font-medium">{format(selectedDate, "EEEE", { locale: ptBR })}</p>
              </div>
              <button onClick={() => goDate(1)} className="p-2 rounded-xl hover:bg-background/50 transition-colors">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Quick date buttons */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {[-2, -1, 0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const d = new Date();
                d.setDate(d.getDate() + offset);
                const isActive = isSameDay(d, selectedDate);
                return (
                  <button key={offset} onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center px-3 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap min-w-[52px] ${
                      isActive
                        ? "gold-gradient text-primary-foreground shadow-md"
                        : "bg-secondary/70 text-muted-foreground hover:bg-secondary"
                    }`}>
                    <span className="text-[10px] capitalize font-medium">{format(d, "EEE", { locale: ptBR })}</span>
                    <span className="font-bold text-sm">{format(d, "dd")}</span>
                  </button>
                );
              })}
            </div>

            {dateFilteredAppointments.length === 0 && (
              <div className="text-center py-12 rounded-2xl bg-secondary/30 border border-border/30">
                <CalendarDays className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhum agendamento para esta data</p>
              </div>
            )}
            {dateFilteredAppointments.map((a) => (
              <div key={a.id} className="rounded-2xl bg-secondary/50 border border-border/50 p-4 space-y-3 hover:border-primary/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground text-sm truncate">{a.client_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 flex-shrink-0" /> {a.client_phone}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${statusColors[a.status] || "bg-secondary text-muted-foreground"}`}>
                    {a.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {getBarberName(a.barber_id)}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.appointment_time.substring(0, 5)}</span>
                </div>
                {a.service_type && (
                  <p className="text-xs text-primary font-medium">
                    {a.service_type} {(a.total_amount ?? 0) > 0 ? `• R$ ${Number(a.total_amount).toFixed(2)}` : ""}
                  </p>
                )}
                <div className="flex gap-2 flex-wrap pt-1">
                  {a.status === "pendente" && (
                    <button onClick={() => updateStatus(a.id, "confirmado")} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors font-medium">
                      <Check className="w-3.5 h-3.5" /> Confirmar
                    </button>
                  )}
                  {a.status !== "cancelado" && (
                    <button onClick={() => updateStatus(a.id, "cancelado")} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors font-medium">
                      <X className="w-3.5 h-3.5" /> Cancelar
                    </button>
                  )}
                  <button onClick={() => {
                    if (editingAppointment === a.id) { setEditingAppointment(null); return; }
                    setEditingAppointment(a.id);
                    setEditServiceType(a.service_type || "corte");
                    setEditProducts(a.products_sold || "");
                    setEditAmount(String(a.total_amount || ""));
                    setEditObs(a.observation || "");
                    setEditPayment(a.payment_method || "");
                  }} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 transition-colors font-medium">
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                  {isOwner && (
                    <button onClick={() => deleteAppointment(a.id)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-destructive transition-colors font-medium">
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </button>
                  )}
                </div>
                {editingAppointment === a.id && (
                  <div className="space-y-3 pt-3 border-t border-border/50 animate-fade-in">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Serviço</label>
                      <input type="text" value={editServiceType} onChange={(e) => setEditServiceType(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-background/50 text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Produtos</label>
                      <input type="text" value={editProducts} onChange={(e) => setEditProducts(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-background/50 text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Valor (R$)</label>
                        <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-background/50 text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Pagamento</label>
                        <select value={editPayment} onChange={(e) => setEditPayment(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-background/50 text-foreground text-sm border border-border">
                          <option value="">Selecione</option>
                          <option value="dinheiro">Dinheiro</option>
                          <option value="pix">Pix</option>
                          <option value="cartao">Cartão</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Observação</label>
                      <input type="text" value={editObs} onChange={(e) => setEditObs(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-background/50 text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <button onClick={() => saveAppointmentEdit(a.id)} className="w-full py-2.5 rounded-xl gold-gradient text-primary-foreground text-sm font-bold shadow-md">
                      Salvar Alterações
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* BARBERS TAB - owner only */}
        {activeTab === "barbers" && isOwner && (
          <div className="space-y-4">
            {/* Add barber drawer */}
            <AddBarberDrawer barbers={barbers} onCreated={() => {
              // Refresh barber users list
              supabase.from("user_roles").select("user_id, barber_id, role").then(({ data }) => {
                if (data) setBarberUsers(data);
              });
            }} />

            <div className="rounded-2xl bg-secondary/50 border border-border/50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                <p className="font-display font-semibold text-foreground">Foto da Fachada</p>
              </div>
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                <Upload className="w-4 h-4" /> Escolher imagem
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFacadeUpload(f); }} className="hidden" />
              </label>
            </div>

            {barbers.map((b) => {
              const isInactive = (b as any).is_active === false;
              const barberUser = barberUsers.find((u) => u.barber_id === b.id);
              return (
                <div key={b.id} className={`rounded-2xl border p-4 space-y-3 transition-all ${
                  isInactive
                    ? "bg-secondary/20 border-border/30 opacity-60"
                    : "bg-secondary/50 border-border/50"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0 ${isInactive ? "border-border/50" : "border-primary/30"}`}>
                      {b.photo_url ? (
                        <img src={b.photo_url} alt={b.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-display font-bold text-foreground text-sm">{b.name}</p>
                        {isInactive && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold uppercase">Inativo</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{b.phone}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => {
                        setEditingBarber(editingBarber === b.id ? null : b.id);
                        setBarberName(b.name); setBarberPhone(b.phone);
                        setBarberActive((b as any).is_active !== false);
                      }} className="p-2 rounded-xl hover:bg-background/50 transition-colors">
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir ${b.name} e todo o histórico? Irreversível!`)) deleteBarber(b.id);
                        }}
                        disabled={deletingBarber === b.id}
                        className="p-2 rounded-xl hover:bg-red-500/10 transition-colors group disabled:opacity-50"
                      >
                        {deletingBarber === b.id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  {editingBarber === b.id && (
                    <div className="space-y-3 pt-3 border-t border-border/50 animate-fade-in">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Nome</label>
                          <input type="text" value={barberName} onChange={(e) => setBarberName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-background/50 text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">WhatsApp</label>
                          <input type="tel" value={barberPhone} onChange={(e) => setBarberPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-background/50 text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                      </div>
                      <label className="flex items-center gap-3 py-1 text-sm text-foreground cursor-pointer">
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${barberActive ? "bg-green-500" : "bg-secondary"}`}
                          onClick={() => setBarberActive(!barberActive)}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${barberActive ? "left-5" : "left-1"}`} />
                        </div>
                        <span className="font-medium text-sm">{barberActive ? "Ativo" : "Inativo"}</span>
                      </label>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Alterar Foto</label>
                        <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                          <Upload className="w-3.5 h-3.5" /> Escolher foto
                          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(b.id, f); }} className="hidden" />
                        </label>
                      </div>
                      <button onClick={() => updateBarber(b.id)} className="w-full py-2.5 rounded-xl gold-gradient text-primary-foreground text-sm font-bold shadow-md hover:opacity-90 transition-all">
                        Salvar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
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
            myBarberId={myBarberId}
          />
        )}

        {/* SERVICES TAB */}
        {activeTab === "services" && isOwner && <ServicesManager />}

        {/* CLIENTS TAB */}
        {activeTab === "clients" && isOwner && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-foreground text-lg">Histórico de Clientes</h3>
            </div>
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
                      <div key={c.phone} className="rounded-2xl bg-secondary/50 border border-border/50 p-4 space-y-3 hover:border-primary/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground text-sm truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{c.phone}</p>
                          </div>
                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            <span className={`text-xs font-bold ${statusColor}`}>{daysSinceCut}d</span>
                            <a href={waLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors">
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs text-center">
                          <div className="rounded-xl bg-background/40 py-2">
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Mês</p>
                            <p className="font-bold text-foreground mt-0.5">{thisMonthCuts}</p>
                          </div>
                          <div className="rounded-xl bg-background/40 py-2">
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Ano</p>
                            <p className="font-bold text-foreground mt-0.5">{thisYearCuts}</p>
                          </div>
                          <div className="rounded-xl bg-background/40 py-2">
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Total</p>
                            <p className="font-bold text-foreground mt-0.5">{c.cuts.length}</p>
                          </div>
                          <div className="rounded-xl bg-background/40 py-2">
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Barb.</p>
                            <p className="font-bold text-foreground mt-0.5 truncate px-1">{lastBarber}</p>
                          </div>
                        </div>
                        {c.lastCut && (
                          <p className="text-xs text-muted-foreground">
                            Último corte: {format(new Date(c.lastCut + "T00:00:00"), "dd/MM/yyyy")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {clientMap.size === 0 && (
                    <div className="text-center py-12 rounded-2xl bg-secondary/30 border border-border/30">
                      <UserX className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">Nenhum cliente com atendimento</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* WORKING HOURS TAB */}
        {activeTab === "hours" && isOwner && <WorkingHoursManager barbers={barbers} />}

        {/* GALLERY TAB */}
        {activeTab === "gallery" && isOwner && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-secondary/50 border border-border/50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                <p className="font-display font-semibold text-foreground">Upload de Imagens</p>
              </div>
              <label className="flex items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                <Upload className="w-5 h-5" /> Clique para enviar uma imagem
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGalleryUpload(f); }} className="hidden" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {galleryImages.map((img) => (
                <div key={img.id} className="relative rounded-2xl overflow-hidden border border-border/50 group">
                  <img src={img.image_url} alt={img.title} className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button onClick={() => deleteGalleryImage(img.id)} className="absolute bottom-3 right-3 p-2 rounded-xl bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACCESS TAB */}
        {activeTab === "access" && isOwner && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-secondary/50 border border-border/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <p className="font-display font-bold text-foreground">Criar Conta de Barbeiro</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Barbeiro</label>
                  <select value={selectedBarberId} onChange={(e) => setSelectedBarberId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background/50 text-foreground text-sm border border-border">
                    <option value="">Selecione o barbeiro</option>
                    {barbers.filter((b) => !barberUsers.some((u) => u.barber_id === b.id)).map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                  <input type="email" placeholder="email@exemplo.com" value={newBarberEmail} onChange={(e) => setNewBarberEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background/50 text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Senha</label>
                  <input type="password" placeholder="••••••••" value={newBarberPw} onChange={(e) => setNewBarberPw(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background/50 text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <button onClick={handleCreateBarberUser} className="w-full py-2.5 rounded-xl gold-gradient text-primary-foreground text-sm font-bold shadow-md">
                  <Plus className="w-4 h-4 inline mr-1.5" />Criar Conta
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-display font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Contas Ativas
              </p>
              {barberUsers.filter((u) => u.role === "barber").map((u) => {
                const barber = barbers.find((b) => b.id === u.barber_id);
                return (
                  <div key={u.user_id} className="rounded-2xl bg-secondary/50 border border-border/50 p-4 flex items-center justify-between hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{barber?.name || "Barbeiro"}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Barbeiro</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteBarberUser(u.user_id)} className="p-2.5 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {barberUsers.filter((u) => u.role === "barber").length === 0 && (
                <div className="text-center py-8 rounded-2xl bg-secondary/30 border border-border/30">
                  <Shield className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs">Nenhuma conta de barbeiro criada</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-secondary/50 border border-border/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <p className="font-display font-bold text-foreground">Alterar Email</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Novo Email</label>
                <input type="email" placeholder="novo@email.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-background/50 text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <button onClick={handleChangeEmail} className="w-full py-2.5 rounded-xl gold-gradient text-primary-foreground text-sm font-bold shadow-md">Alterar Email</button>
            </div>
            <div className="rounded-2xl bg-secondary/50 border border-border/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <p className="font-display font-bold text-foreground">Alterar Senha</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Senha Atual</label>
                  <input type="password" placeholder="••••••••" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-background/50 text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Nova Senha</label>
                  <input type="password" placeholder="Mínimo 6 caracteres" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-background/50 text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Confirmar Senha</label>
                  <input type="password" placeholder="••••••••" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-background/50 text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <button onClick={handleChangePassword} className="w-full py-2.5 rounded-xl gold-gradient text-primary-foreground text-sm font-bold shadow-md">Alterar Senha</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
