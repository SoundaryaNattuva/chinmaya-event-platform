import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowLeft } from 'lucide-react';

const stripePromise = loadStripe('pk_test_51SG6P6Pxu4Eg5d4rpggki9CsAUOieAswoSTccRsvYF3YZl1lRYAlF7A85GKYMficXARDfCP4xC1IZqmo8J5ymmjN00vY5pY45c');

// Stripe hooks for payment form
const PaymentForm = ({ onSuccess, onBack, totalAmount, purchaserEmail }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Validate the payment details
      const { error: submitError } = await elements.submit();
      
      if (submitError) {
        setError(submitError.message);
        setProcessing(false);
        return;
      }

      // Simulated Payment for development
      console.log('💳 Payment Details:');
      console.log('Amount:', totalAmount);
      console.log('Email:', purchaserEmail);
      console.log('Status: Payment would be processed here in production');

      // Processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('✅ Payment simulation successful!');
      onSuccess();
    } catch (err) {
      setError('Payment failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePaymentSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Information</h1>
        <p className="text-gray-600">Secure payment processing powered by Stripe</p>
      </div>

      <div>
        <PaymentElement />
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>🚧 Development Mode:</strong> No real charges will be made. Use test card <code className="bg-amber-100 px-2 py-1 rounded">4242 4242 4242 4242</code> with any future expiry and any 3-digit CVC.
        </p>
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          disabled={processing}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </button>
        
        <button
          type="submit"
          disabled={!stripe || processing}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing...' : `Simulate Payment $${totalAmount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

// Main component that wraps PaymentForm with Stripe Elements
const StripePayment = ({ totalAmount, purchaserEmail, onSuccess, onBack }) => {
  const [stripeLoaded, setStripeLoaded] = useState(false);

  useEffect(() => {
    const loadStripeInstance = async () => {
      const stripe = await stripePromise;
      if (stripe) {
        setStripeLoaded(true);
      }
    };
    loadStripeInstance();
  }, []);

  if (!stripeLoaded) {
    return (
      <div className="text-center py-8">
        <div className="text-xl text-gray-600">Loading payment form...</div>
      </div>
    );
  }

  // Stripe Elements appearance customization
  const options = {
    mode: 'payment',
    amount: Math.round(totalAmount * 100), // Convert to cents
    currency: 'usd',
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      }
    },
    paymentMethodCreation: 'manual',
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        onSuccess={onSuccess}
        onBack={onBack}
        totalAmount={totalAmount}
        purchaserEmail={purchaserEmail}
      />
    </Elements>
  );
};

export default StripePayment;