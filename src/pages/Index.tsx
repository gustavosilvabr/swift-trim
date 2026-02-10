import Header from "@/components/Header";
import BookingFlow from "@/components/BookingFlow";
import ReviewsAndMap from "@/components/ReviewsAndMap";
import WhatsAppButton from "@/components/WhatsAppButton";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-10 pb-24">
        <BookingFlow />
        <ReviewsAndMap />
      </main>
      <WhatsAppButton />
    </div>
  );
};

export default Index;
