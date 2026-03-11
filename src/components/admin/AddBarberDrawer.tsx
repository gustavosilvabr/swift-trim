import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, User, Phone, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter,
} from "@/components/ui/drawer";

interface Props {
  barbers: { id: string; name: string }[];
  onCreated: () => void;
}

const AddBarberDrawer = ({ barbers, onCreated }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    try {
      // 1. Create barber profile
      const { data: barber, error: barberError } = await supabase
        .from("barbers")
        .insert({ name: name.trim(), phone: phone.trim() })
        .select()
        .single();
      if (barberError) throw barberError;

      // 2. Clone time_slots from an existing active barber
      const existingBarber = barbers.find((b) => b.id !== barber.id);
      if (existingBarber) {
        const { data: existingSlots } = await supabase
          .from("time_slots")
          .select("day_of_week, slot_time, is_active")
          .eq("barber_id", existingBarber.id);
        if (existingSlots && existingSlots.length > 0) {
          const newSlots = existingSlots.map((s) => ({
            barber_id: barber.id,
            day_of_week: s.day_of_week,
            slot_time: s.slot_time,
            is_active: s.is_active,
          }));
          for (let i = 0; i < newSlots.length; i += 500) {
            await supabase.from("time_slots").insert(newSlots.slice(i, i + 500));
          }
        }
      }

      // 3. Create auth user + link
      const { data: fnData, error: fnError } = await supabase.functions.invoke("manage-barber-user", {
        body: { action: "create", email: email.trim(), password, barber_id: barber.id },
      });
      if (fnError) throw fnError;
      if (fnData?.error) throw new Error(fnData.error);

      toast.success(`${name.trim()} adicionado com sucesso!`);
      setName(""); setPhone(""); setEmail(""); setPassword("");
      setOpen(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar barbeiro");
    }
    setLoading(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className="w-full py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-bold shadow-md flex items-center justify-center gap-2 hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> Adicionar Barbeiro
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-background border-border">
        <DrawerHeader>
          <DrawerTitle className="font-display text-foreground">Novo Barbeiro</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 space-y-4 pb-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3 h-3" /> Nome
            </label>
            <input type="text" placeholder="Nome do barbeiro" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> WhatsApp
            </label>
            <input type="tel" placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Email de acesso
            </label>
            <input type="email" placeholder="barbeiro@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Senha
            </label>
            <input type="text" placeholder="Senha de acesso" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary text-foreground text-sm border border-border outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <DrawerFooter>
          <button onClick={handleCreate} disabled={loading}
            className="w-full py-3 rounded-xl gold-gradient text-primary-foreground text-sm font-bold shadow-md disabled:opacity-50">
            {loading ? "Criando..." : "Criar Barbeiro"}
          </button>
          <DrawerClose asChild>
            <button className="w-full py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-medium">Cancelar</button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default AddBarberDrawer;
