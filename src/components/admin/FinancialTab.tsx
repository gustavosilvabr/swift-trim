import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, eachDayOfInterval, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Edit2, Trash2, Calendar, TrendingUp, TrendingDown, DollarSign, Users, Crown } from "lucide-react";
import { toast } from "sonner";
import { Appointment } from "@/hooks/useSupabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import SubscribersSection from "./SubscribersSection";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter,
} from "@/components/ui/drawer";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
}

type DateFilter = "today" | "week" | "month" | "year" | "custom";

interface Props {
  appointments: Appointment[];
  barbers: { id: string; name: string }[];
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  isOwner?: boolean;
  myBarberId?: string | null;
}

const FinancialTab = ({ appointments, barbers, expenses, setExpenses, isOwner = true, myBarberId }: Props) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [customStart, setCustomStart] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"));

  const [newExpCategory, setNewExpCategory] = useState("aluguel");
  const [newExpDesc, setNewExpDesc] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpDate, setNewExpDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);

  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (dateFilter) {
      case "today": return { start: format(now, "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") };
      case "week": return { start: format(startOfWeek(now, { locale: ptBR }), "yyyy-MM-dd"), end: format(endOfWeek(now, { locale: ptBR }), "yyyy-MM-dd") };
      case "month": return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
      case "year": return { start: format(startOfYear(now), "yyyy-MM-dd"), end: format(endOfYear(now), "yyyy-MM-dd") };
      case "custom": return { start: customStart, end: customEnd };
    }
  }, [dateFilter, customStart, customEnd]);

  const isInRange = (date: string) => date >= dateRange.start && date <= dateRange.end;

  const confirmados = appointments.filter((a) => a.status === "confirmado" && isInRange(a.appointment_date));
  const revenue = confirmados.reduce((s, a) => s + (Number(a.total_amount) || 0), 0);
  const filteredExpenses = expenses.filter((e) => isInRange(e.expense_date));
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = revenue - totalExpenses;

  const chartData = useMemo(() => {
    try {
      const days = eachDayOfInterval({ start: parseISO(dateRange.start), end: parseISO(dateRange.end) });
      const sliced = days.length > 31 ? days.filter((_, i) => i % Math.ceil(days.length / 31) === 0) : days;
      return sliced.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayLabel = format(day, "dd/MM");
        const dayRev = confirmados.filter((a) => a.appointment_date === dayStr).reduce((s, a) => s + (Number(a.total_amount) || 0), 0);
        const dayExp = expenses.filter((e) => e.expense_date === dayStr).reduce((s, e) => s + e.amount, 0);
        return { name: dayLabel, receita: dayRev, despesas: dayExp };
      });
    } catch { return []; }
  }, [dateRange, confirmados, expenses]);

  const barberBreakdown = useMemo(() => {
    return barbers.map((b) => {
      const bApps = confirmados.filter((a) => a.barber_id === b.id);
      const totalRev = bApps.reduce((s, a) => s + (Number(a.total_amount) || 0), 0);
      const cuts = bApps.length;
      return { ...b, totalRev, cuts };
    });
  }, [barbers, confirmados]);

  const filterLabels: Record<DateFilter, string> = { today: "Hoje", week: "Semana", month: "Mês", year: "Ano", custom: "Custom" };

  const addExpense = async () => {
    if (!newExpAmount) return;
    const { data } = await supabase.from("expenses").insert({
      category: newExpCategory, description: newExpDesc, amount: parseFloat(newExpAmount) || 0, expense_date: newExpDate,
    }).select().single();
    if (data) setExpenses((prev) => [data as Expense, ...prev]);
    setNewExpDesc(""); setNewExpAmount("");
    setExpenseDrawerOpen(false);
    toast.success("Despesa adicionada");
  };

  const saveEditExpense = async (id: string) => {
    await supabase.from("expenses").update({ category: editCategory, description: editDesc, amount: parseFloat(editAmount) || 0, expense_date: editDate }).eq("id", id);
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, category: editCategory, description: editDesc, amount: parseFloat(editAmount) || 0, expense_date: editDate } : e));
    setEditingExpense(null);
    toast.success("Despesa atualizada");
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("Excluir esta despesa?")) return;
    await supabase.from("expenses").delete().eq("id", id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    toast.success("Despesa excluída");
  };

  return (
    <div className="space-y-4">
      {/* Date filter */}
      <div className="rounded-2xl bg-secondary/50 border border-border/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <p className="font-display font-semibold text-foreground text-sm">Período</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(filterLabels) as DateFilter[]).map((f) => (
            <button key={f} onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${dateFilter === f ? "gold-gradient text-primary-foreground shadow-md" : "bg-background/50 text-muted-foreground hover:text-foreground"}`}>
              {filterLabels[f]}
            </button>
          ))}
        </div>
        {dateFilter === "custom" && (
          <div className="flex gap-2">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-background/50 text-foreground text-xs border border-border" />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="flex-1 px-3 py-2 rounded-xl bg-background/50 text-foreground text-xs border border-border" />
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-green-500/15 to-green-600/5 border border-green-500/20 p-3 sm:p-4 text-center">
          <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1.5" />
          <p className="text-[10px] text-green-400/70 font-medium uppercase tracking-wider">Receita</p>
          <p className="text-base sm:text-xl font-bold text-green-400 font-display">R$ {revenue.toFixed(0)}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-red-500/15 to-red-600/5 border border-red-500/20 p-3 sm:p-4 text-center">
          <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-1.5" />
          <p className="text-[10px] text-red-400/70 font-medium uppercase tracking-wider">Despesas</p>
          <p className="text-base sm:text-xl font-bold text-red-400 font-display">R$ {totalExpenses.toFixed(0)}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 p-3 sm:p-4 text-center">
          <DollarSign className="w-5 h-5 text-primary mx-auto mb-1.5" />
          <p className="text-[10px] text-primary/70 font-medium uppercase tracking-wider">Lucro</p>
          <p className={`text-base sm:text-xl font-bold font-display ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>R$ {profit.toFixed(0)}</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && chartData.some((d) => d.receita > 0 || d.despesas > 0) && (
        <div className="rounded-2xl bg-secondary/50 border border-border/50 p-4 space-y-3">
          <p className="font-display font-semibold text-foreground text-sm">Receita vs Despesas</p>
          <div className="h-44 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} width={45} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))", fontSize: 12 }} />
                <Bar dataKey="receita" fill="hsl(142 71% 45%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="despesas" fill="hsl(0 72% 51%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per barber breakdown */}
      {isOwner && (
        <div className="rounded-2xl bg-secondary/50 border border-border/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <p className="font-display font-semibold text-foreground text-sm">Por Barbeiro</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {barberBreakdown.map((b) => (
              <div key={b.id} className="rounded-xl bg-background/40 p-3 flex items-center justify-between">
                <div>
                  <span className="text-foreground font-semibold text-sm">{b.name}</span>
                  <p className="text-[10px] text-muted-foreground">{b.cuts} atendimentos</p>
                </div>
                <span className="text-green-400 font-bold text-sm font-display">R$ {b.totalRev.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add expense button + drawer */}
      {isOwner && (
        <Drawer open={expenseDrawerOpen} onOpenChange={setExpenseDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="w-full py-3 rounded-xl bg-red-500/15 text-red-400 border border-red-500/20 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-500/25 transition-colors">
              <Plus className="w-4 h-4" /> Nova Despesa
            </button>
          </DrawerTrigger>
          <DrawerContent className="bg-background border-border">
            <DrawerHeader>
              <DrawerTitle className="font-display text-foreground">Adicionar Despesa</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 space-y-3 pb-2">
              <select value={newExpCategory} onChange={(e) => setNewExpCategory(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border">
                <option value="aluguel">Aluguel</option><option value="produtos">Produtos</option><option value="agua">Água</option><option value="luz">Luz</option><option value="outros">Outros</option>
              </select>
              <input type="text" placeholder="Descrição (opcional)" value={newExpDesc} onChange={(e) => setNewExpDesc(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Valor (R$)" value={newExpAmount} onChange={(e) => setNewExpAmount(e.target.value)} className="px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
                <input type="date" value={newExpDate} onChange={(e) => setNewExpDate(e.target.value)} className="px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border" />
              </div>
            </div>
            <DrawerFooter>
              <button onClick={addExpense} className="w-full py-3 rounded-xl bg-red-500 text-white text-sm font-bold shadow-md">Adicionar Despesa</button>
              <DrawerClose asChild>
                <button className="w-full py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-medium">Cancelar</button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* Expense list */}
      {isOwner && filteredExpenses.length > 0 && (
        <div className="rounded-2xl bg-secondary/50 border border-border/50 p-4 space-y-3">
          <p className="font-display font-semibold text-foreground text-sm">
            Despesas <span className="text-red-400 font-display">R$ {totalExpenses.toFixed(2)}</span>
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredExpenses.map((e) => (
              <div key={e.id} className="rounded-xl bg-background/40 px-3 py-2.5">
                {editingExpense === e.id ? (
                  <div className="space-y-2 animate-fade-in">
                    <select value={editCategory} onChange={(ev) => setEditCategory(ev.target.value)} className="w-full px-2.5 py-1.5 rounded-lg bg-secondary text-foreground text-xs border border-border">
                      <option value="aluguel">Aluguel</option><option value="produtos">Produtos</option><option value="agua">Água</option><option value="luz">Luz</option><option value="outros">Outros</option>
                    </select>
                    <input type="text" value={editDesc} onChange={(ev) => setEditDesc(ev.target.value)} placeholder="Descrição" className="w-full px-2.5 py-1.5 rounded-lg bg-secondary text-foreground text-xs border border-border outline-none" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={editAmount} onChange={(ev) => setEditAmount(ev.target.value)} className="px-2.5 py-1.5 rounded-lg bg-secondary text-foreground text-xs border border-border outline-none" />
                      <input type="date" value={editDate} onChange={(ev) => setEditDate(ev.target.value)} className="px-2.5 py-1.5 rounded-lg bg-secondary text-foreground text-xs border border-border" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEditExpense(e.id)} className="flex-1 py-1.5 rounded-lg gold-gradient text-primary-foreground text-xs font-semibold">Salvar</button>
                      <button onClick={() => setEditingExpense(null)} className="flex-1 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs min-w-0 flex-1">
                      <span className="capitalize text-foreground font-medium">{e.category}</span>
                      {e.description && <span className="text-muted-foreground"> · {e.description}</span>}
                      <p className="text-muted-foreground/60 text-[10px]">{format(parseISO(e.expense_date), "dd/MM/yyyy")}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-red-400 font-semibold text-xs">R$ {e.amount.toFixed(2)}</span>
                      <button onClick={() => { setEditingExpense(e.id); setEditCategory(e.category); setEditDesc(e.description || ""); setEditAmount(String(e.amount)); setEditDate(e.expense_date); }} className="p-1 rounded hover:bg-secondary"><Edit2 className="w-3 h-3 text-muted-foreground" /></button>
                      <button onClick={() => deleteExpense(e.id)} className="p-1 rounded hover:bg-secondary"><Trash2 className="w-3 h-3 text-red-400" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscribers */}
      <div className="rounded-2xl bg-secondary/50 border border-border/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-primary" />
          <p className="font-display font-semibold text-foreground text-sm">Plano Corte Ilimitado</p>
        </div>
        <SubscribersSection barbers={barbers} barberId={isOwner ? undefined : (myBarberId || undefined)} />
      </div>
    </div>
  );
};

export default FinancialTab;
