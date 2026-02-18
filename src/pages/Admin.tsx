import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAppointments, useBarbers, Appointment } from "@/hooks/useSupabase";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LogOut, Check, X, Trash2, Edit2, ArrowLeft,
  User, Phone, DollarSign, Image, Settings, Clock,
  Upload, Plus, Eye, MessageCircle, Users, Scissors,
  LayoutDashboard, CalendarDays, Shield
} from "lucide-react";
import { toast } from "sonner";
import FinancialTab from "@/components/admin/FinancialTab";
import WorkingHoursManager from "@/components/admin/WorkingHoursManager";
import ServicesManager from "@/components/admin/ServicesManager";
import UpcomingAppointments from "@/components/admin/UpcomingAppointments";
import UserManagement from "@/components/admin/UserManagement";

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"];

const statusColors: Record<string, string> = {
  pendente: "bg-warning/15 text-warning border border-warning/20",
  confirmado: "bg-[hsl(142,71%,45%)]/15 text-[hsl(142,71%,45%)] border border-[hsl(142,71%,45%)]/20",
  cancelado: "bg-destructive/15 text-destructive border border-destructive/20",
};

type Tab = "appointments" | "barbers" | "financial" | "gallery" | "clients" | "hours" | "services" | "settings" | "users";

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
  const { role, barberId: myBarberId, loading: roleLoading } = useUserRole();

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
    toast.success(`Status → ${status}`);
    refetch();
  };

  const deleteAppointment = async (id: string) => {
    await supabase.from("appointments").delete().eq("id", id);
    toast.success("Excluído");
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
    toast.success("Atualizado");
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
    toast.success("Removida");
  };

  const handleFacadeUpload = async (file: File) => {
    const path = `facade/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar foto"); return; }
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    await supabase.from("site_settings").upsert({ key: "store_facade_url", value: data.publicUrl }, { onConflict: "key" });
    toast.success("Fachada atualizada");
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
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: session?.user?.email || "", password: currentPw });
    if (signInError) { toast.error("Senha atual incorreta"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) { toast.error(error.message); return; }
    toast.success("Senha alterada");
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  const handleForgotPassword = async () => {
    const email = session?.user?.email;
    if (!email) return;
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/admin" });
    toast.success("Email de redefinição enviado");
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
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-xl gold-gradient mx-auto flex items-center justify-center mb-4 shadow-lg">
              <LayoutDashboard className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-muted-foreground text-sm">Acesso restrito</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary outline-none transition-all" />
            <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:ring-2 focus:ring-primary outline-none transition-all" />
            {loginError && <p className="text-destructive text-sm text-center">{loginError}</p>}
            <button type="submit" className="w-full py-3.5 rounded-xl gold-gradient text-primary-foreground font-bold text-base shadow-lg hover:opacity-90 transition-all">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  const isOwner = role === "owner";
  const isBarber = role === "barber";

  // Filter appointments by role
  const filteredAppointments = isBarber && myBarberId
    ? appointments.filter((a) => a.barber_id === myBarberId)
    : appointments;

  const getBarberName = (id: string) => barbers.find((b) => b.id === id)?.name || "—";
  const pendentes = filteredAppointments.filter((a) => a.status === "pendente");
  const confirmados = filteredAppointments.filter((a) => a.status === "confirmado");
  const thisMonth = format(new Date(), "yyyy-MM");
  const thisYear = format(new Date(), "yyyy");

  const allTabs: { id: Tab; label: string; icon: React.ReactNode; ownerOnly?: boolean }[] = [
    { id: "appointments", label: "Agenda", icon: <CalendarDays className="w-4 h-4" /> },
    { id: "financial", label: "Financeiro", icon: <DollarSign className="w-4 h-4" /> },
    { id: "barbers", label: "Barbeiros", icon: <User className="w-4 h-4" />, ownerOnly: true },
    { id: "services", label: "Serviços", icon: <Scissors className="w-4 h-4" />, ownerOnly: true },
    { id: "clients", label: "Clientes", icon: <Users className="w-4 h-4" />, ownerOnly: true },
    { id: "hours", label: "Horários", icon: <Clock className="w-4 h-4" />, ownerOnly: true },
    { id: "gallery", label: "Galeria", icon: <Image className="w-4 h-4" />, ownerOnly: true },
    { id: "users", label: "Acessos", icon: <Shield className="w-4 h-4" />, ownerOnly: true },
    { id: "settings", label: "Config", icon: <Settings className="w-4 h-4" /> },
  ];

  const tabs = allTabs.filter((t) => !t.ownerOnly || isOwner);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center shadow-md">
              <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-display text-base font-bold text-foreground">Dashboard</h1>
            {role && <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${isOwner ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>{role}</span>}
          </div>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5 pb-12">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="stat-card rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-warning">{pendentes.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Pendentes</p>
          </div>
          <div className="stat-card rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-[hsl(142,71%,45%)]">{confirmados.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Confirmados</p>
          </div>
          <div className="stat-card rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-primary">{filteredAppointments.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Total</p>
          </div>
        </div>

        {/* Upcoming */}
        <UpcomingAppointments appointments={filteredAppointments} barbers={barbers} />

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
                activeTab === t.id ? "tab-active" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}

        {/* APPOINTMENTS */}
        {activeTab === "appointments" && (
          <div className="space-y-2">
            {filteredAppointments.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nenhum agendamento</p>}
            {filteredAppointments.map((a) => (
              <div key={a.id} className="pro-card rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{a.client_name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {a.client_phone}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${statusColors[a.status] || "bg-secondary text-muted-foreground"}`}>{a.status}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{getBarberName(a.barber_id)}</span>
                  <span>{format(new Date(a.appointment_date + "T00:00:00"), "dd/MM", { locale: ptBR })}</span>
                  <span>{a.appointment_time.substring(0, 5)}</span>
                </div>
                {(a as any).service_type && (
                  <p className="text-[11px] text-primary font-medium">{(a as any).service_type} {(a as any).total_amount > 0 ? `• R$ ${Number((a as any).total_amount).toFixed(2)}` : ""}</p>
                )}
                <div className="flex gap-1.5 flex-wrap">
                  {isOwner && a.status === "pendente" && (
                    <button onClick={() => updateStatus(a.id, "confirmado")} className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-[hsl(142,71%,45%)]/15 text-[hsl(142,71%,45%)] hover:bg-[hsl(142,71%,45%)]/25 transition-colors font-semibold"><Check className="w-3 h-3" /> Confirmar</button>
                  )}
                  {isOwner && a.status !== "cancelado" && (
                    <button onClick={() => updateStatus(a.id, "cancelado")} className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors font-semibold"><X className="w-3 h-3" /> Cancelar</button>
                  )}
                  {isOwner && (
                    <button onClick={() => {
                      if (editingAppointment === a.id) { setEditingAppointment(null); return; }
                      setEditingAppointment(a.id);
                      setEditServiceType((a as any).service_type || "corte");
                      setEditProducts((a as any).products_sold || "");
                      setEditAmount(String((a as any).total_amount || ""));
                      setEditObs((a as any).observation || "");
                      setEditPayment((a as any).payment_method || "");
                    }} className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors font-semibold"><Edit2 className="w-3 h-3" /> Editar</button>
                  )}
                  {isOwner && (
                    <button onClick={() => deleteAppointment(a.id)} className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-destructive transition-colors font-semibold"><Trash2 className="w-3 h-3" /> Excluir</button>
                  )}
                </div>
                {editingAppointment === a.id && (
                  <div className="space-y-2 pt-3 border-t border-border animate-fade-in">
                    <input type="text" placeholder="Tipo de serviço" value={editServiceType} onChange={(e) => setEditServiceType(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
                    <input type="text" placeholder="Produtos vendidos" value={editProducts} onChange={(e) => setEditProducts(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
                    <input type="number" placeholder="Valor total (R$)" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
                    <input type="text" placeholder="Observação" value={editObs} onChange={(e) => setEditObs(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
                    <select value={editPayment} onChange={(e) => setEditPayment(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border">
                      <option value="">Pagamento</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">Pix</option>
                      <option value="cartao">Cartão</option>
                    </select>
                    <button onClick={() => saveAppointmentEdit(a.id)} className="w-full py-2 rounded-lg gold-gradient text-primary-foreground text-sm font-bold shadow-md">Salvar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* BARBERS */}
        {activeTab === "barbers" && (
          <div className="space-y-3">
            <div className="pro-card rounded-xl p-4 space-y-3">
              <p className="font-display font-bold text-foreground text-xs uppercase tracking-wider">Foto da Fachada</p>
              <label className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Enviar foto</span>
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFacadeUpload(f); }} className="hidden" />
              </label>
            </div>
            {barbers.map((b) => (
              <div key={b.id} className="pro-card rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-border flex-shrink-0">
                    {b.photo_url ? <img src={b.photo_url} alt={b.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-secondary flex items-center justify-center"><User className="w-6 h-6 text-muted-foreground" /></div>}
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-semibold text-foreground text-sm">{b.name}</p>
                    <p className="text-[11px] text-muted-foreground">{b.phone}</p>
                    {(b as any).specialty && <p className="text-[10px] text-primary font-medium">{(b as any).specialty}</p>}
                  </div>
                  <button onClick={() => {
                    setEditingBarber(editingBarber === b.id ? null : b.id);
                    setBarberName(b.name); setBarberPhone(b.phone);
                    setBarberSpecialty((b as any).specialty || ""); setBarberPrice(String((b as any).default_price || ""));
                    setBarberActive((b as any).is_active !== false);
                  }} className="p-2 rounded-lg hover:bg-secondary transition-colors"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                {editingBarber === b.id && (
                  <div className="space-y-2 animate-fade-in pt-3 border-t border-border">
                    <input type="text" placeholder="Nome" value={barberName} onChange={(e) => setBarberName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none" />
                    <input type="tel" placeholder="WhatsApp" value={barberPhone} onChange={(e) => setBarberPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none" />
                    <input type="text" placeholder="Especialidade" value={barberSpecialty} onChange={(e) => setBarberSpecialty(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none" />
                    <input type="number" placeholder="Valor padrão (R$)" value={barberPrice} onChange={(e) => setBarberPrice(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:ring-2 focus:ring-primary outline-none" />
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" checked={barberActive} onChange={(e) => setBarberActive(e.target.checked)} className="accent-primary w-4 h-4" /> Ativo
                    </label>
                    <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Alterar foto</span>
                      <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(b.id, f); }} className="hidden" />
                    </label>
                    <button onClick={() => updateBarber(b.id)} className="w-full py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-bold shadow-md">Salvar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* FINANCIAL */}
        {activeTab === "financial" && (
          <FinancialTab appointments={filteredAppointments} barbers={isBarber && myBarberId ? barbers.filter(b => b.id === myBarberId) : barbers} expenses={isOwner ? expenses : []} setExpenses={setExpenses} hideExpenseManagement={isBarber} />
        )}

        {/* SERVICES */}
        {activeTab === "services" && <ServicesManager />}

        {/* CLIENTS */}
        {activeTab === "clients" && (
          <div className="space-y-2">
            <p className="font-display font-bold text-foreground text-xs uppercase tracking-wider">Histórico de Clientes</p>
            {(() => {
              const clientMap = new Map<string, { name: string; phone: string; cuts: typeof appointments; lastCut: string | null }>();
              appointments.filter((a) => a.status === "confirmado" || a.status === "concluido").forEach((a) => {
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
                    const statusColor = daysSinceCut > 30 ? "text-destructive" : daysSinceCut > 15 ? "text-warning" : "text-[hsl(142,71%,45%)]";
                    const thisMonthCuts = c.cuts.filter((a) => a.appointment_date.startsWith(thisMonth)).length;
                    const thisYearCuts = c.cuts.filter((a) => a.appointment_date.startsWith(thisYear)).length;
                    const lastBarber = c.cuts.length > 0 ? getBarberName(c.cuts[c.cuts.length - 1].barber_id) : "—";
                    const waMsg = encodeURIComponent("Fala meu parceiro! Já tem mais de 15 dias desde seu último corte 😎 Bora ficar na régua novamente?");
                    const waLink = `https://wa.me/${c.phone.replace(/\D/g, "")}?text=${waMsg}`;

                    return (
                      <div key={c.phone} className="pro-card rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground text-sm">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground">{c.phone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${statusColor}`}>{daysSinceCut}d</span>
                            <a href={waLink} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 transition-colors">
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[10px] text-center">
                          <div className="bg-secondary/40 rounded-lg p-1.5"><p className="text-muted-foreground">Mês</p><p className="font-bold text-foreground">{thisMonthCuts}</p></div>
                          <div className="bg-secondary/40 rounded-lg p-1.5"><p className="text-muted-foreground">Ano</p><p className="font-bold text-foreground">{thisYearCuts}</p></div>
                          <div className="bg-secondary/40 rounded-lg p-1.5"><p className="text-muted-foreground">Total</p><p className="font-bold text-foreground">{c.cuts.length}</p></div>
                          <div className="bg-secondary/40 rounded-lg p-1.5"><p className="text-muted-foreground">Barbeiro</p><p className="font-bold text-foreground truncate">{lastBarber}</p></div>
                        </div>
                        {c.lastCut && <p className="text-[10px] text-muted-foreground">Último: {format(new Date(c.lastCut + "T00:00:00"), "dd/MM/yyyy")}</p>}
                      </div>
                    );
                  })}
                  {clientMap.size === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nenhum cliente</p>}
                </>
              );
            })()}
          </div>
        )}

        {/* HOURS */}
        {activeTab === "hours" && <WorkingHoursManager barbers={barbers} />}

        {/* GALLERY */}
        {activeTab === "gallery" && (
          <div className="space-y-3">
            <div className="pro-card rounded-xl p-4 space-y-3">
              <p className="font-display font-bold text-foreground text-xs uppercase tracking-wider">Upload de Imagens</p>
              <label className="flex items-center justify-center gap-2 w-full py-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Selecionar imagem</span>
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGalleryUpload(f); }} className="hidden" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {galleryImages.map((img) => (
                <div key={img.id} className="relative rounded-xl overflow-hidden border border-border group">
                  <img src={img.image_url} alt={img.title} className="w-full aspect-square object-cover" />
                  <button onClick={() => deleteGalleryImage(img.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="pro-card rounded-xl p-4 space-y-3">
              <p className="font-display font-bold text-foreground text-xs uppercase tracking-wider">Alterar Email</p>
              <input type="email" placeholder="Novo email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={handleChangeEmail} className="w-full py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-bold shadow-md">Alterar Email</button>
            </div>
            <div className="pro-card rounded-xl p-4 space-y-3">
              <p className="font-display font-bold text-foreground text-xs uppercase tracking-wider">Alterar Senha</p>
              <input type="password" placeholder="Senha atual" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
              <input type="password" placeholder="Nova senha" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
              <input type="password" placeholder="Confirmar nova senha" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
              <button onClick={handleChangePassword} className="w-full py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-bold shadow-md">Alterar Senha</button>
            </div>
            <button onClick={handleForgotPassword} className="w-full py-2.5 rounded-lg bg-secondary text-muted-foreground text-sm hover:text-foreground transition-colors font-medium">Esqueci minha senha</button>
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && isOwner && <UserManagement />}
      </main>
    </div>
  );
};

export default Admin;
