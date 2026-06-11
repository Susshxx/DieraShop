import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const EsewaFailure = () => {
  const nav = useNavigate();

  useEffect(() => {
    toast.error('Payment cancelled or failed');
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl mb-2">Payment Failed</h1>
          <p className="text-muted-foreground mb-6">
            Your payment was not completed. Please try again.
          </p>
          <Button onClick={() => nav('/checkout')} className="w-full">
            Return to Checkout
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EsewaFailure;
