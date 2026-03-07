import { useState, useCallback } from "react";
import Header from "@/components/Header";
import BookingFlow from "@/components/BookingFlow";
import SubscriptionPlan from "@/components/SubscriptionPlan";
import ReviewsAndMap from "@/components/ReviewsAndMap";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import GallerySection from "@/components/GallerySection";
import WhatsAppButton from "@/components/WhatsAppButton";
import LoadingScreen from "@/components/LoadingScreen";
import Footer from "@/components/Footer";

const Index = () => {
  const [loaded, setLoaded] = useState(false);
  const onComplete = useCallback(() => setLoaded(true), []);

  return (
    <>
      {!loaded && <LoadingScreen onComplete={onComplete} />}
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="w-full max-w-lg mx-auto px-4 sm:px-5 py-6 sm:py-8 space-y-10 sm:space-y-14 pb-28 flex-1">
          {/* Hero tagline */}
          <section className="text-center space-y-3 animate-fade-in pt-2">
            <h1 className="font-display text-3xl sm:text-4xl font-black gold-text leading-tight">
              Estilo & Precisão
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Agende seu horário online e garanta o melhor corte da região
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <div className="h-px w-12 bg-primary/40" />
              <span className="text-primary text-xs font-semibold tracking-widest uppercase">Premium</span>
              <div className="h-px w-12 bg-primary/40" />
            </div>
          </section>

          {/* Booking */}
          <section>
            <BookingFlow />
          </section>

          {/* Subscription Plan */}
          <SubscriptionPlan />

          {/* Reviews */}
          <ReviewsCarousel />

          {/* Gallery */}
          <GallerySection />

          {/* Map & Reviews */}
          <ReviewsAndMap />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default Index;
