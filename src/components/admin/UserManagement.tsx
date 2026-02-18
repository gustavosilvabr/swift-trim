import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, User, Mail, Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface BarberUser {
  barber_id: string;
  barber_name: string;
  user_id: string | null;
  email: string | null;
  role: string | null;
}

const UserManagement = () => {
  const [users, setUsers] = useState<BarberUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const fetchUsers = async () => {
    const { data, error } = await supabase.functions.invoke("manage-barber-user", {
      body: { action: "list_barber_users" },
    });
    if (data?.users) setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const createUser = async (barberId: string) => {
    if (!newEmail.trim() || !newPassword.trim()) {
      toast.error("Preencha email e senha");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    const { data, error } = await supabase.functions.invoke("manage-barber-user", {
      body: { action: "create", email: newEmail.trim(), password: newPassword, barber_id: barberId },
    });

    if (error || data?.error) {
      toast.error(data?.error || "Erro ao criar usuário");
      return;
    }

    toast.success("Barbeiro criado com acesso ao sistema!");
    setCreating(null);
    setNewEmail("");
    setNewPassword("");
    fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Remover acesso deste barbeiro?")) return;

    const { data, error } = await supabase.functions.invoke("manage-barber-user", {
      body: { action: "delete", user_id: userId },
    });

    if (error || data?.error) {
      toast.error(data?.error || "Erro ao remover");
      return;
    }

    toast.success("Acesso removido");
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-primary" />
        <p className="font-display font-bold text-foreground text-xs uppercase tracking-wider">Gerenciar Acessos</p>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Crie logins para barbeiros acessarem o painel com visão limitada (apenas seus agendamentos e financeiro).
      </p>

      {users.map((u) => (
        <div key={u.barber_id} className="pro-card rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{u.barber_name}</p>
                {u.email ? (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {u.email}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground/50">Sem acesso ao sistema</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {u.role && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  u.role === "owner" 
                    ? "bg-primary/15 text-primary" 
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {u.role}
                </span>
              )}
              {u.user_id && u.role !== "owner" && (
                <button onClick={() => deleteUser(u.user_id!)} className="p-1.5 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {!u.user_id && (
            <>
              {creating === u.barber_id ? (
                <div className="space-y-2 animate-fade-in border-t border-border pt-3">
                  <input
                    type="email"
                    placeholder="Email do barbeiro"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="password"
                    placeholder="Senha (mín. 6 caracteres)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => createUser(u.barber_id)} className="flex-1 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-bold shadow-md hover:opacity-90 transition-all">
                      Criar Acesso
                    </button>
                    <button onClick={() => { setCreating(null); setNewEmail(""); setNewPassword(""); }} className="px-4 py-2.5 rounded-lg bg-secondary text-muted-foreground text-sm font-medium">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(u.barber_id)}
                  className="w-full py-2.5 rounded-lg border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Criar login
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserManagement;
