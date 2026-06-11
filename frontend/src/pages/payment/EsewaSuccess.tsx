import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import DieraHeader from "@/components/header/DieraHeader";
import Footer from "@/components/footer/Footer";
import { CheckCircle, Loader2 } from "lucide-react";

const EsewaSuccess = () => {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const { clear } = useCart();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const data = searchParams.get('data');
        const orderId = searchParams.get('order_id');
        
        if (!data || !orderId) {
          throw new Error('Invalid payment response');
        }

        // Verify payment with backend
        const response = await api.post('/orders/esewa/verify', {
          data,
          orderId,
        });

        if (response.ok) {
          setSuccess(true);
          clear();
          toast.success('Payment successful!');
          setTimeout(() => nav('/account/orders'), 2000);
        } else {
          throw new Error('Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error('Payment verification failed');
        setTimeout(() => nav('/checkout'), 2000);
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, nav, clear]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DieraHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          {verifying ? (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
              <h1 className="text-2xl mb-2">Verifying Payment</h1>
              <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
            </>
          ) : success ? (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h1 className="text-2xl mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground">Your order has been confirmed. Redirecting to orders...</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl mb-2">Verification Failed</h1>
              <p className="text-muted-foreground">Redirecting to checkout...</p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EsewaSuccess;
