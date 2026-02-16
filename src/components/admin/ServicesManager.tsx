import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2, Package, Scissors } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  is_active: boolean;
  sort_order: number;
}

const ServicesManager = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("servico");
  const [newPrice, setNewPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const fetchServices = async () => {
    const { data } = await supabase.from("services").select("*").order("sort_order");
    if (data) setServices(data as Service[]);
  };

  useEffect(() => {
    fetchServices();
    const ch = supabase.channel("services-admin-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => fetchServices())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const addService = async () => {
    if (!newName.trim() || !newPrice) return;
    await supabase.from("services").insert({
      name: newName.trim(),
      category: newCategory,
      price: parseFloat(newPrice) || 0,
      sort_order: services.length + 1,
    });
    setNewName("");
    setNewPrice("");
    toast.success("Serviço adicionado");
    fetchServices();
  };

  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditCategory(s.category);
    setEditPrice(String(s.price));
  };

  const saveEdit = async (id: string) => {
    await supabase.from("services").update({
      name: editName.trim(),
      category: editCategory,
      price: parseFloat(editPrice) || 0,
    }).eq("id", id);
    setEditingId(null);
    toast.success("Serviço atualizado");
    fetchServices();
  };

  const toggleActive = async (s: Service) => {
    await supabase.from("services").update({ is_active: !s.is_active }).eq("id", s.id);
    toast.success(s.is_active ? "Serviço desativado" : "Serviço ativado");
    fetchServices();
  };

  const deleteService = async (id: string) => {
    if (!confirm("Excluir este serviço?")) return;
    await supabase.from("services").delete().eq("id", id);
    toast.success("Serviço excluído");
    fetchServices();
  };

  return (
    <div className="space-y-5">
      {/* Add new */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <p className="font-display font-semibold text-foreground text-sm">Adicionar Serviço / Produto</p>
        <input type="text" placeholder="Nome" value={newName} onChange={(e) => setNewName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
        <div className="flex gap-2">
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border">
            <option value="servico">Serviço</option>
            <option value="produto">Produto</option>
          </select>
          <input type="number" placeholder="Preço (R$)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <button onClick={addService} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
          <Plus className="w-4 h-4 inline mr-1" />Adicionar
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {services.map((s) => (
          <div key={s.id} className={`glass-card rounded-xl p-4 ${!s.is_active ? "opacity-50" : ""}`}>
            {editingId === s.id ? (
              <div className="space-y-2 animate-fade-in">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none" />
                <div className="flex gap-2">
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border">
                    <option value="servico">Serviço</option>
                    <option value="produto">Produto</option>
                  </select>
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(s.id)} className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Salvar</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {s.category === "servico" ? <Scissors className="w-4 h-4 text-primary" /> : <Package className="w-4 h-4 text-primary" />}
                  <div>
                    <p className="font-medium text-foreground text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{s.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold text-sm">R$ {s.price.toFixed(2)}</span>
                  <button onClick={() => toggleActive(s)} className={`text-xs px-2 py-1 rounded-lg ${s.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {s.is_active ? "Ativo" : "Inativo"}
                  </button>
                  <button onClick={() => startEdit(s)} className="p-1 rounded hover:bg-secondary"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => deleteService(s.id)} className="p-1 rounded hover:bg-secondary"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesManager;
