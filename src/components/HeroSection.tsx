import { useEffect, useRef } from "react";
import { Calendar, Sparkles, Star } from "lucide-react";
import logo from "@/assets/logo-goldblad.png";

const HeroSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; decay: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = () => {
      if (particles.length < 60) {
        particles.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -Math.random() * 0.5 - 0.1,
          size: Math.random() * 2.5 + 0.5,
          alpha: Math.random() * 0.6 + 0.2,
          decay: Math.random() * 0.003 + 0.001,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      spawn();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(43, 74%, 55%, ${p.alpha})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const scrollToBooking = () => {
    document.querySelector("#booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative w-full overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(43_74%_49%/0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(43_74%_49%/0.05),transparent_50%)]" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(hsl(43 74% 49% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(43 74% 49% / 0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Particles canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Floating orbs */}
      <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-primary/5 blur-[100px] animate-pulse" />
      <div className="absolute bottom-20 right-[10%] w-96 h-96 rounded-full bg-primary/3 blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-16 sm:py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Text */}
          <div className="text-center lg:text-left space-y-6 lg:space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Experiência Premium
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.1]">
              <span className="gold-text">Estilo</span>
              <br />
              <span className="text-foreground">&</span>{" "}
              <span className="gold-text">Precisão</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-md mx-auto lg:mx-0 leading-relaxed">
              Agende seu horário online e garanta o melhor corte da região. 
              Tecnologia e tradição em cada detalhe.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-2">
              <div className="text-center">
                <p className="font-display text-2xl lg:text-3xl font-black gold-text">500+</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Clientes</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="font-display text-2xl lg:text-3xl font-black gold-text">5.0</span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Avaliação</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="font-display text-2xl lg:text-3xl font-black gold-text">3+</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Anos</p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button
                onClick={scrollToBooking}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl gold-gradient text-primary-foreground font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_hsl(43_74%_49%/0.3)] flex items-center justify-center gap-3 group"
              >
                <Calendar className="w-5 h-5 transition-transform group-hover:rotate-12" />
                Agendar Agora
              </button>
              <button
                onClick={() => document.querySelector("#vip")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-primary/30 text-primary font-semibold text-lg transition-all hover:bg-primary/5 hover:border-primary/50"
              >
                Plano VIP
              </button>
            </div>
          </div>

          {/* Right - Logo showcase with 3D effect */}
          <div className="relative flex items-center justify-center animate-scale-in">
            {/* Glow rings */}
            <div className="absolute w-[300px] h-[300px] lg:w-[450px] lg:h-[450px] rounded-full border border-primary/10 animate-pulse" />
            <div className="absolute w-[250px] h-[250px] lg:w-[380px] lg:h-[380px] rounded-full border border-primary/15 animate-pulse" style={{ animationDelay: "0.5s" }} />
            <div className="absolute w-[200px] h-[200px] lg:w-[310px] lg:h-[310px] rounded-full border border-primary/20 animate-pulse" style={{ animationDelay: "1s" }} />

            {/* Central glow */}
            <div className="absolute w-48 h-48 lg:w-72 lg:h-72 rounded-full bg-primary/10 blur-[80px]" />

            {/* Logo */}
            <div className="relative" style={{ perspective: "1000px" }}>
              <img
                src={logo}
                alt="Goldblad Barbearia"
                className="w-48 h-48 sm:w-56 sm:h-56 lg:w-80 lg:h-80 object-contain drop-shadow-[0_0_60px_hsl(43_74%_49%/0.3)] hover:drop-shadow-[0_0_80px_hsl(43_74%_49%/0.5)] transition-all duration-700 hover:scale-110"
                style={{
                  animation: "float 6s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-card to-transparent" />
    </section>
  );
};

export default HeroSection;
