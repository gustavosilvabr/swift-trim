import { useState, useEffect } from "react";
import logo from "@/assets/logo-goldblad.png";

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
      <img src={logo} alt="Goldblad" className="h-20 w-auto animate-scale-in drop-shadow-[0_4px_30px_hsl(43_90%_50%/0.4)]" />
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;
