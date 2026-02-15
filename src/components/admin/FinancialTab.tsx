import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Edit2, Trash2, Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Appointment } from "@/hooks/useSupabase";

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
}

const FinancialTab = ({ appointments, barbers, expenses, setExpenses }: Props) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [customStart, setCustomStart] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"));

  // Add expense form
  const [newExpCategory, setNewExpCategory] = useState("aluguel");
  const [newExpDesc, setNewExpDesc] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpDate, setNewExpDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Edit expense
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (dateFilter) {
      case "today":
        return { start: format(now, "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") };
      case "week": {
        const ws = startOfWeek(now, { locale: ptBR });
        const we = endOfWeek(now, { locale: ptBR });
        return { start: format(ws, "yyyy-MM-dd"), end: format(we, "yyyy-MM-dd") };
      }
      case "month": {
        const ms = startOfMonth(now);
        const me = endOfMonth(now);
        return { start: format(ms, "yyyy-MM-dd"), end: format(me, "yyyy-MM-dd") };
      }
      case "year":
        return { start: `${now.getFullYear()}-01-01`, end: `${now.getFullYear()}-12-31` };
      case "custom":
        return { start: customStart, end: customEnd };
    }
  }, [dateFilter, customStart, customEnd]);

  const isInRange = (date: string) => date >= dateRange.start && date <= dateRange.end;

  const concluidos = appointments.filter((a) => a.status === "concluido" && isInRange(a.appointment_date));
  const revenue = concluidos.reduce((s, a) => s + (Number((a as any).total_amount) || 0), 0);
  const filteredExpenses = expenses.filter((e) => isInRange(e.expense_date));
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = revenue - totalExpenses;

  const filterLabels: Record<DateFilter, string> = {
    today: "Hoje",
    week: "Semana",
    month: "Mês",
    year: "Ano",
    custom: "Personalizado",
  };

  const addExpense = async () => {
    if (!newExpAmount) return;
    const { data } = await supabase.from("expenses").insert({
      category: newExpCategory,
      description: newExpDesc,
      amount: parseFloat(newExpAmount) || 0,
      expense_date: newExpDate,
    }).select().single();
    if (data) setExpenses((prev) => [data as Expense, ...prev]);
    setNewExpDesc("");
    setNewExpAmount("");
    toast.success("Despesa adicionada");
  };

  const startEditExpense = (e: Expense) => {
    setEditingExpense(e.id);
    setEditCategory(e.category);
    setEditDesc(e.description || "");
    setEditAmount(String(e.amount));
    setEditDate(e.expense_date);
  };

  const saveEditExpense = async (id: string) => {
    await supabase.from("expenses").update({
      category: editCategory,
      description: editDesc,
      amount: parseFloat(editAmount) || 0,
      expense_date: editDate,
    }).eq("id", id);
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, category: editCategory, description: editDesc, amount: parseFloat(editAmount) || 0, expense_date: editDate } : e
      )
    );
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
    <div className="space-y-5">
      {/* Date filter */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <p className="font-display font-semibold text-foreground text-sm">Período</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(filterLabels) as DateFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
        {dateFilter === "custom" && (
          <div className="flex gap-2">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-secondary text-foreground text-xs border border-border" />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-secondary text-foreground text-xs border border-border" />
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Receita</p>
          <p className="text-lg font-bold text-green-400">R$ {revenue.toFixed(2)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Despesas</p>
          <p className="text-lg font-bold text-red-400">R$ {totalExpenses.toFixed(2)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Lucro</p>
          <p className={`text-lg font-bold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>R$ {profit.toFixed(2)}</p>
        </div>
      </div>

      {/* Per barber revenue */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <p className="font-display font-semibold text-foreground text-sm">Faturamento por Barbeiro</p>
        {barbers.map((b) => {
          const rev = concluidos.filter((a) => a.barber_id === b.id).reduce((s, a) => s + (Number((a as any).total_amount) || 0), 0);
          return (
            <div key={b.id} className="flex justify-between items-center text-sm">
              <span className="text-foreground">{b.name}</span>
              <span className="text-green-400 font-semibold">R$ {rev.toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      {/* Add expense */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <p className="font-display font-semibold text-foreground text-sm">Adicionar Despesa</p>
        <div className="space-y-2">
          <select value={newExpCategory} onChange={(e) => setNewExpCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border">
            <option value="aluguel">Aluguel</option>
            <option value="produtos">Produtos</option>
            <option value="agua">Água</option>
            <option value="luz">Luz</option>
            <option value="outros">Outros</option>
          </select>
          <input type="text" placeholder="Descrição" value={newExpDesc} onChange={(e) => setNewExpDesc(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
          <div className="flex gap-2">
            <input type="number" placeholder="Valor (R$)" value={newExpAmount} onChange={(e) => setNewExpAmount(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
            <input type="date" value={newExpDate} onChange={(e) => setNewExpDate(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border" />
          </div>
          <button onClick={addExpense} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"><Plus className="w-4 h-4 inline mr-1" />Adicionar</button>
        </div>
      </div>

      {/* Expense list */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <p className="font-display font-semibold text-foreground text-sm">
          Despesas do Período: <span className="text-red-400">R$ {totalExpenses.toFixed(2)}</span>
        </p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredExpenses.map((e) => (
            <div key={e.id} className="bg-secondary/50 rounded-lg px-3 py-2.5 space-y-2">
              {editingExpense === e.id ? (
                <div className="space-y-2 animate-fade-in">
                  <select value={editCategory} onChange={(ev) => setEditCategory(ev.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-background text-foreground text-xs border border-border">
                    <option value="aluguel">Aluguel</option>
                    <option value="produtos">Produtos</option>
                    <option value="agua">Água</option>
                    <option value="luz">Luz</option>
                    <option value="outros">Outros</option>
                  </select>
                  <input type="text" value={editDesc} onChange={(ev) => setEditDesc(ev.target.value)} placeholder="Descrição" className="w-full px-2 py-1.5 rounded-lg bg-background text-foreground text-xs border border-border outline-none" />
                  <div className="flex gap-2">
                    <input type="number" value={editAmount} onChange={(ev) => setEditAmount(ev.target.value)} className="flex-1 px-2 py-1.5 rounded-lg bg-background text-foreground text-xs border border-border outline-none" />
                    <input type="date" value={editDate} onChange={(ev) => setEditDate(ev.target.value)} className="flex-1 px-2 py-1.5 rounded-lg bg-background text-foreground text-xs border border-border" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEditExpense(e.id)} className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Salvar</button>
                    <button onClick={() => setEditingExpense(null)} className="flex-1 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    <span className="capitalize text-foreground font-medium">{e.category}</span>
                    {e.description && <span className="text-muted-foreground"> - {e.description}</span>}
                    <p className="text-muted-foreground/70">{format(parseISO(e.expense_date), "dd/MM/yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-semibold text-xs">R$ {e.amount.toFixed(2)}</span>
                    <button onClick={() => startEditExpense(e)} className="p-1 rounded hover:bg-secondary transition-colors">
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => deleteExpense(e.id)} className="p-1 rounded hover:bg-secondary transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredExpenses.length === 0 && <p className="text-center text-muted-foreground text-xs py-4">Nenhuma despesa no período</p>}
        </div>
      </div>
    </div>
  );
};

export default FinancialTab;
