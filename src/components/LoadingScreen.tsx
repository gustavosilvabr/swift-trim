import { useState, useEffect } from "react";
import { Scissors } from "lucide-react";

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpacity(0);
      setTimeout(onComplete, 500);
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center gap-6 transition-opacity duration-500"
      style={{ opacity }}
    >
      <Scissors className="w-16 h-16 text-primary animate-spin" style={{ animationDuration: "2s" }} />
      <p className="font-display text-xl gold-text animate-pulse">Carregando…</p>
    </div>
  );
};

export default LoadingScreen;
