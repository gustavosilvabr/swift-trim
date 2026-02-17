import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Save } from "lucide-react";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface DayConfig {
  enabled: boolean;
  openTime: string;
  closeTime: string;
}

const DEFAULT_CONFIG: DayConfig[] = [
  { enabled: true, openTime: "08:00", closeTime: "14:00" },
  { enabled: true, openTime: "09:00", closeTime: "20:00" },
  { enabled: true, openTime: "09:00", closeTime: "20:00" },
  { enabled: true, openTime: "09:00", closeTime: "20:00" },
  { enabled: true, openTime: "09:00", closeTime: "20:00" },
  { enabled: true, openTime: "09:00", closeTime: "20:00" },
  { enabled: true, openTime: "09:00", closeTime: "20:00" },
];

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 23; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

interface Props {
  barbers: { id: string; name: string }[];
}

const WorkingHoursManager = ({ barbers }: Props) => {
  const [config, setConfig] = useState<DayConfig[]>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("key", "working_hours").maybeSingle();
      if (data?.value) {
        try { setConfig(JSON.parse(data.value)); } catch {}
      }
    };
    load();
  }, []);

  const updateDay = (idx: number, field: keyof DayConfig, value: string | boolean) => {
    setConfig((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)));
  };

  const generateSlots = (openTime: string, closeTime: string): string[] => {
    const slots: string[] = [];
    const [oh, om] = openTime.split(":").map(Number);
    const [ch, cm] = closeTime.split(":").map(Number);
    let current = oh * 60 + om;
    const end = ch * 60 + cm;
    while (current <= end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
      current += 30;
    }
    return slots;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from("site_settings").upsert({ key: "working_hours", value: JSON.stringify(config) }, { onConflict: "key" });
      await supabase.from("time_slots").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const inserts: { barber_id: string; day_of_week: number; slot_time: string; is_active: boolean }[] = [];
      for (const barber of barbers) {
        for (let dow = 0; dow < 7; dow++) {
          const day = config[dow];
          if (!day.enabled) continue;
          const slots = generateSlots(day.openTime, day.closeTime);
          for (const slot of slots) {
            inserts.push({ barber_id: barber.id, day_of_week: dow, slot_time: slot, is_active: true });
          }
        }
      }

      for (let i = 0; i < inserts.length; i += 500) {
        await supabase.from("time_slots").insert(inserts.slice(i, i + 500));
      }

      toast.success("Horários atualizados!");
    } catch {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="pro-card rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-primary" />
          <p className="font-display font-bold text-foreground text-xs uppercase tracking-wider">Horários de Funcionamento</p>
        </div>
        <p className="text-[10px] text-muted-foreground">Aplicado a todos os barbeiros</p>

        <div className="space-y-2">
          {config.map((day, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-secondary/40 rounded-lg px-3 py-2.5">
              <label className="flex items-center gap-2 min-w-[90px]">
                <input type="checkbox" checked={day.enabled} onChange={(e) => updateDay(idx, "enabled", e.target.checked)} className="accent-primary w-3.5 h-3.5" />
                <span className={`text-xs font-medium ${day.enabled ? "text-foreground" : "text-muted-foreground line-through"}`}>
                  {DAY_NAMES[idx].substring(0, 3)}
                </span>
              </label>
              {day.enabled && (
                <div className="flex items-center gap-1 ml-auto text-[10px]">
                  <select value={day.openTime} onChange={(e) => updateDay(idx, "openTime", e.target.value)} className="px-1.5 py-1 rounded-lg bg-background text-foreground border border-border text-[10px]">
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-muted-foreground">—</span>
                  <select value={day.closeTime} onChange={(e) => updateDay(idx, "closeTime", e.target.value)} className="px-1.5 py-1 rounded-lg bg-background text-foreground border border-border text-[10px]">
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 rounded-xl gold-gradient text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg">
        <Save className="w-4 h-4" />
        {saving ? "Salvando..." : "Salvar Horários"}
      </button>
    </div>
  );
};

export default WorkingHoursManager;
