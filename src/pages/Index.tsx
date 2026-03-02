import { useState, useCallback } from "react";
import Header from "@/components/Header";
import BookingFlow from "@/components/BookingFlow";
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
        <main className="w-full max-w-lg mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-8 sm:space-y-10 pb-24 flex-1">
          <BookingFlow />
          <ReviewsCarousel />
          <GallerySection />
          <ReviewsAndMap />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default Index;
