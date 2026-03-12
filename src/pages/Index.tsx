import { useState, useCallback } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BookingFlow from "@/components/BookingFlow";
import SubscriptionPlan from "@/components/SubscriptionPlan";
import ReviewsAndMap from "@/components/ReviewsAndMap";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import GallerySection from "@/components/GallerySection";
import WhatsAppButton from "@/components/WhatsAppButton";
import LoadingScreen from "@/components/LoadingScreen";
import Footer from "@/components/Footer";
import { Scissors } from "lucide-react";

const Index = () => {
  const [loaded, setLoaded] = useState(false);
  const onComplete = useCallback(() => setLoaded(true), []);

  return (
    <>
      {!loaded && <LoadingScreen onComplete={onComplete} />}
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        {/* Hero */}
        <HeroSection />

        <main className="w-full flex-1">
          {/* Booking Section */}
          <section id="booking" className="py-16 lg:py-24 bg-card">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
                {/* Left - Info */}
                <div className="space-y-6 lg:sticky lg:top-28">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px w-8 bg-primary/40" />
                      <span className="text-primary text-xs font-semibold tracking-widest uppercase">Agendamento</span>
                    </div>
                    <h2 className="font-display text-3xl lg:text-5xl font-bold text-foreground leading-tight">
                      Agende em <span className="gold-text">poucos passos</span>
                    </h2>
                    <p className="text-muted-foreground text-sm lg:text-base max-w-md leading-relaxed">
                      Escolha seu barbeiro favorito, selecione a data e horário, e confirme seu agendamento em segundos.
                    </p>
                  </div>

                  {/* Steps preview - desktop only */}
                  <div className="hidden lg:flex flex-col gap-4 pt-4">
                    {[
                      { step: "01", title: "Escolha o Barbeiro", desc: "Selecione o profissional da sua preferência" },
                      { step: "02", title: "Data & Horário", desc: "Veja a disponibilidade em tempo real" },
                      { step: "03", title: "Serviços", desc: "Escolha corte, barba, sobrancelha e mais" },
                      { step: "04", title: "Confirme", desc: "Preencha seus dados e pronto!" },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <span className="text-primary font-bold text-sm">{item.step}</span>
                        </div>
                        <div>
                          <p className="text-foreground font-semibold text-sm">{item.title}</p>
                          <p className="text-muted-foreground text-xs">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right - Booking flow */}
                <div className="glass-card rounded-2xl lg:rounded-3xl p-5 sm:p-6 lg:p-8 glow-gold">
                  <BookingFlow />
                </div>
              </div>
            </div>
          </section>

          {/* VIP Section */}
          <section id="vip" className="py-16 lg:py-24 bg-background">
            <div className="max-w-3xl mx-auto px-4 lg:px-8">
              <SubscriptionPlan />
            </div>
          </section>

          {/* Reviews Section */}
          <section id="reviews" className="py-16 lg:py-24 bg-card">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <ReviewsCarousel />
            </div>
          </section>

          {/* Gallery Section */}
          <section id="gallery" className="py-16 lg:py-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
              <GallerySection />
            </div>
          </section>

          {/* Location Section */}
          <section id="location" className="py-16 lg:py-24 bg-card">
            <div className="max-w-5xl mx-auto px-4 lg:px-8">
              <ReviewsAndMap />
            </div>
          </section>
        </main>

        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default Index;
