import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const StoreFacade = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "store_facade_url").maybeSingle();
      if (data?.value) setImageUrl(data.value);
    };
    fetch();
  }, []);

  if (!imageUrl) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-border animate-fade-in shadow-lg">
      <img src={imageUrl} alt="Fachada da Barbearia Goldblad" className="w-full h-auto object-cover" loading="lazy" />
    </div>
  );
};

export default StoreFacade;
