import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface GalleryImage {
  id: string;
  image_url: string;
  title: string;
}

const GallerySection = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order");
      if (data) setImages(data);
    };
    fetch();
  }, []);

  if (images.length === 0) return null;

  return (
    <section className="space-y-4 animate-fade-in">
      <h2 className="font-display text-2xl font-bold text-center gold-text">Galeria de Cortes</h2>
      <div className="grid grid-cols-2 gap-3">
        {images.map((img) => (
          <button
            key={img.id}
            onClick={() => setLightbox(img.image_url)}
            className="aspect-square rounded-xl overflow-hidden border border-border hover:ring-2 hover:ring-primary/50 transition-all"
          >
            <img
              src={img.image_url}
              alt={img.title || "Corte"}
              className="w-full h-full object-cover animate-fade-in"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={lightbox} alt="Corte" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
        </div>
      )}
    </section>
  );
};

export default GallerySection;
