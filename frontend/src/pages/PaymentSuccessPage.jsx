import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [paymentData, setPaymentData] = useState(null);
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId) {
        setStatus('error');
        return;
      }

      try {
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await axios.get(`${API}/payment/verify/${orderId}`);
        setPaymentData(response.data);
        
        if (response.data.status === 'PAID') {
          setStatus('success');
        } else if (response.data.status === 'FAILED') {
          setStatus('failed');
        } else {
          setStatus('pending');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [orderId]);

  return (
    <div className="min-h-screen flex items-center justify-center py-24">
      <div className="max-w-md w-full mx-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-red-500 animate-spin mx-auto mb-6" />
              <h1 className="font-heading text-3xl text-white mb-2">VERIFYING PAYMENT</h1>
              <p className="text-zinc-500">Please wait while we confirm your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h1 className="font-heading text-3xl text-white mb-2">PAYMENT SUCCESSFUL!</h1>
              <p className="text-zinc-500 mb-6">
                Your membership payment has been processed successfully.
              </p>
              {paymentData && (
                <div className="bg-zinc-800 rounded-sm p-4 mb-6 text-left">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-500">Order ID</span>
                    <span className="text-white font-mono">{paymentData.order_id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Amount</span>
                    <span className="text-white">₹{paymentData.amount?.toLocaleString()}</span>
                  </div>
                </div>
              )}
              <Link to="/">
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white rounded-sm uppercase tracking-wider">
                  Back to Home
                </Button>
              </Link>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="font-heading text-3xl text-white mb-2">PAYMENT FAILED</h1>
              <p className="text-zinc-500 mb-6">
                Unfortunately, your payment could not be processed. Please try again.
              </p>
              <Link to="/plans">
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white rounded-sm uppercase tracking-wider">
                  Try Again
                </Button>
              </Link>
            </>
          )}

          {status === 'pending' && (
            <>
              <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
              </div>
              <h1 className="font-heading text-3xl text-white mb-2">PAYMENT PROCESSING</h1>
              <p className="text-zinc-500 mb-6">
                Your payment is being processed. Please check back in a few moments.
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-sm uppercase tracking-wider"
              >
                Refresh Status
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="font-heading text-3xl text-white mb-2">SOMETHING WENT WRONG</h1>
              <p className="text-zinc-500 mb-6">
                We couldn't verify your payment. Please contact support if the amount was deducted.
              </p>
              <Link to="/contact">
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white rounded-sm uppercase tracking-wider">
                  Contact Support
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
