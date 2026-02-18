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
  { enabled: true, openTime: "08:00", closeTime: "14:00" }, // Dom
  { enabled: true, openTime: "09:00", closeTime: "20:00" }, // Seg
  { enabled: true, openTime: "09:00", closeTime: "20:00" }, // Ter
  { enabled: true, openTime: "09:00", closeTime: "20:00" }, // Qua
  { enabled: true, openTime: "09:00", closeTime: "20:00" }, // Qui
  { enabled: true, openTime: "09:00", closeTime: "20:00" }, // Sex
  { enabled: true, openTime: "09:00", closeTime: "20:00" }, // Sáb
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
        try {
          setConfig(JSON.parse(data.value));
        } catch {}
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
      // Save config
      await supabase.from("site_settings").upsert(
        { key: "working_hours", value: JSON.stringify(config) },
        { onConflict: "key" }
      );

      // Regenerate time_slots for all barbers
      await supabase.from("time_slots").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // delete all

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

      // Insert in batches
      for (let i = 0; i < inserts.length; i += 500) {
        await supabase.from("time_slots").insert(inserts.slice(i, i + 500));
      }

      toast.success("Horários atualizados com sucesso!");
    } catch {
      toast.error("Erro ao salvar horários");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-4 space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-primary" />
          <p className="font-display font-semibold text-foreground">Horários de Funcionamento</p>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Configure o horário de abertura e fechamento para cada dia da semana. As alterações serão aplicadas a todos os barbeiros.</p>

        <div className="space-y-3">
          {config.map((day, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2.5">
              <label className="flex items-center gap-2 min-w-[100px]">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) => updateDay(idx, "enabled", e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <span className={`text-sm font-medium ${day.enabled ? "text-foreground" : "text-muted-foreground line-through"}`}>
                  {DAY_NAMES[idx]}
                </span>
              </label>
              {day.enabled && (
                <div className="flex items-center gap-1 ml-auto text-xs">
                  <select
                    value={day.openTime}
                    onChange={(e) => updateDay(idx, "openTime", e.target.value)}
                    className="px-2 py-1.5 rounded-lg bg-background text-foreground border border-border text-xs"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="text-muted-foreground">às</span>
                  <select
                    value={day.closeTime}
                    onChange={(e) => updateDay(idx, "closeTime", e.target.value)}
                    className="px-2 py-1.5 rounded-lg bg-background text-foreground border border-border text-xs"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? "Salvando..." : "Salvar Horários"}
      </button>
    </div>
  );
};

export default WorkingHoursManager;
