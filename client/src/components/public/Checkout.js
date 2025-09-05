import React, { useState } from 'react';
import { User, Mail, Phone, Ticket, CreditCard, Check, ArrowLeft } from 'lucide-react';

const CheckoutFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Mock selected tickets data - replace with your actual data
  const [selectedTickets] = useState([
    { type: 'General Admission', quantity: 2, price: 25.00 },
    { type: 'VIP', quantity: 1, price: 75.00 }
  ]);

  const [formData, setFormData] = useState({
    purchaser: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    useMyNameForAll: false,
    ticketHolders: [],
    paymentInfo: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      nameOnCard: '',
      billingAddress: ''
    }
  });

  const [errors, setErrors] = useState({});

  // Initialize ticket holders array based on selected tickets
  React.useEffect(() => {
    const holders = [];
    selectedTickets.forEach(ticket => {
      for (let i = 0; i < ticket.quantity; i++) {
        holders.push({
          id: `${ticket.type}-${i}`,
          type: ticket.type,
          firstName: '',
          lastName: ''
        });
      }
    });
    setFormData(prev => ({ ...prev, ticketHolders: holders }));
  }, []);

  // Update all ticket holder names when "use my name" is toggled
  React.useEffect(() => {
    if (formData.useMyNameForAll && formData.purchaser.firstName && formData.purchaser.lastName) {
      setFormData(prev => ({
        ...prev,
        ticketHolders: prev.ticketHolders.map(holder => ({
          ...holder,
          firstName: prev.purchaser.firstName,
          lastName: prev.purchaser.lastName
        }))
      }));
    } else if (!formData.useMyNameForAll) {
      setFormData(prev => ({
        ...prev,
        ticketHolders: prev.ticketHolders.map(holder => ({
          ...holder,
          firstName: '',
          lastName: ''
        }))
      }));
    }
  }, [formData.useMyNameForAll, formData.purchaser.firstName, formData.purchaser.lastName]);

  const handlePurchaserChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      purchaser: { ...prev.purchaser, [field]: value }
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTicketHolderChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      ticketHolders: prev.ticketHolders.map((holder, i) => 
        i === index ? { ...holder, [field]: value } : holder
      )
    }));
    // Clear error when user starts typing
    const errorKey = `ticket_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const handlePaymentChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      paymentInfo: { ...prev.paymentInfo, [field]: value }
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    // Validate purchaser info
    if (!formData.purchaser.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.purchaser.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.purchaser.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.purchaser.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.purchaser.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    // Validate ticket holders
    formData.ticketHolders.forEach((holder, index) => {
      if (!holder.firstName.trim()) {
        newErrors[`ticket_${index}_firstName`] = 'First name is required';
      }
      if (!holder.lastName.trim()) {
        newErrors[`ticket_${index}_lastName`] = 'Last name is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.paymentInfo.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    }
    if (!formData.paymentInfo.expiryDate.trim()) {
      newErrors.expiryDate = 'Expiry date is required';
    }
    if (!formData.paymentInfo.cvv.trim()) {
      newErrors.cvv = 'CVV is required';
    }
    if (!formData.paymentInfo.nameOnCard.trim()) {
      newErrors.nameOnCard = 'Name on card is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleCompletePurchase = () => {
    console.log('Completing purchase:', formData);
    alert('Purchase completed! (This would integrate with Stripe)');
  };

  const totalTickets = selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  const totalPrice = selectedTickets.reduce((sum, ticket) => sum + (ticket.quantity * ticket.price), 0);
  const serviceeFee = totalPrice * 0.05;
  const processingFee = 2.99;
  const finalTotal = totalPrice + serviceeFee + processingFee;

  const steps = [
    { number: 1, title: 'Information', icon: User },
    { number: 2, title: 'Payment', icon: CreditCard },
    { number: 3, title: 'Confirmation', icon: Check }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Left Column - Content */}
          <div className="lg:col-span-2 bg-white p-6 lg:p-8">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.number;
                  const isCompleted = currentStep > step.number;
                  
                  return (
                    <React.Fragment key={step.number}>
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-green-500 text-white' :
                          isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>
                        <span className={`ml-3 text-sm font-medium ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-4 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            {currentStep === 1 && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket Information</h1>
                <p className="text-gray-600 mb-8">Please provide your details and names for each ticket</p>

                <div className="space-y-8">
                  {/* Purchaser Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Purchaser Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={formData.purchaser.firstName}
                          onChange={(e) => handlePurchaserChange('firstName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.firstName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter first name"
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={formData.purchaser.lastName}
                          onChange={(e) => handlePurchaserChange('lastName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.lastName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter last name"
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={formData.purchaser.email}
                          onChange={(e) => handlePurchaserChange('email', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter email address"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={formData.purchaser.phone}
                          onChange={(e) => handlePurchaserChange('phone', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter phone number"
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ticket Holder Names */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Ticket className="w-5 h-5 mr-2" />
                      Ticket Holder Names
                    </h3>

                    {/* Use My Name Option */}
                    <div className="mb-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.useMyNameForAll}
                          onChange={(e) => setFormData(prev => ({ ...prev, useMyNameForAll: e.target.checked }))}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Use my name for all tickets</span>
                      </label>
                    </div>

                    {/* Individual Ticket Names */}
                    <div className="space-y-4">
                      {formData.ticketHolders.map((holder, index) => (
                        <div key={holder.id} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">
                            Ticket #{index + 1} - {holder.type}
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name *
                              </label>
                              <input
                                type="text"
                                value={holder.firstName}
                                onChange={(e) => handleTicketHolderChange(index, 'firstName', e.target.value)}
                                disabled={formData.useMyNameForAll}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  formData.useMyNameForAll ? 'bg-gray-100 cursor-not-allowed' : ''
                                } ${
                                  errors[`ticket_${index}_firstName`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter first name"
                              />
                              {errors[`ticket_${index}_firstName`] && (
                                <p className="text-red-500 text-sm mt-1">{errors[`ticket_${index}_firstName`]}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name *
                              </label>
                              <input
                                type="text"
                                value={holder.lastName}
                                onChange={(e) => handleTicketHolderChange(index, 'lastName', e.target.value)}
                                disabled={formData.useMyNameForAll}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  formData.useMyNameForAll ? 'bg-gray-100 cursor-not-allowed' : ''
                                } ${
                                  errors[`ticket_${index}_lastName`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter last name"
                              />
                              {errors[`ticket_${index}_lastName`] && (
                                <p className="text-red-500 text-sm mt-1">{errors[`ticket_${index}_lastName`]}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Information</h1>
                <p className="text-gray-600 mb-8">Secure payment processing with Stripe</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      value={formData.paymentInfo.cardNumber}
                      onChange={(e) => handlePaymentChange('cardNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="1234 5678 9012 3456"
                    />
                    {errors.cardNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        value={formData.paymentInfo.expiryDate}
                        onChange={(e) => handlePaymentChange('expiryDate', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="MM/YY"
                      />
                      {errors.expiryDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV *
                      </label>
                      <input
                        type="text"
                        value={formData.paymentInfo.cvv}
                        onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.cvv ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="123"
                      />
                      {errors.cvv && (
                        <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name on Card *
                    </label>
                    <input
                      type="text"
                      value={formData.paymentInfo.nameOnCard}
                      onChange={(e) => handlePaymentChange('nameOnCard', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.nameOnCard ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="John Doe"
                    />
                    {errors.nameOnCard && (
                      <p className="text-red-500 text-sm mt-1">{errors.nameOnCard}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Complete!</h1>
                  <p className="text-gray-600 mb-8">Your tickets have been sent to {formData.purchaser.email}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
                    <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Order ID:</span>
                        <span className="font-mono">TKT-2025-001</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Tickets:</span>
                        <span>{totalTickets}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-bold">${finalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200 mt-8">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className={`px-6 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center ${
                  currentStep === 1 
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStep === 1 ? 'Back to Event' : 'Previous'}
              </button>
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currentStep === 1 ? 'Continue to Payment' : 'Complete Purchase'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Back to Events
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1 bg-gray-50 border-l border-gray-200 p-6 lg:p-8">
            <div className="sticky top-8">
              {/* Event Info */}
              <div className="mb-6">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Ticket className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Summer Music Festival 2025</h3>
                    <p className="text-gray-600 text-sm">Sat, Aug 15 • 6:00 PM</p>
                    <p className="text-gray-600 text-sm">Central Park, New York</p>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                {/* Ticket Items */}
                <div className="space-y-3 mb-4">
                  {selectedTickets.map((ticket, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {ticket.quantity}x {ticket.type}
                        </p>
                        <p className="text-xs text-gray-500">${ticket.price.toFixed(2)} each</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        ${(ticket.quantity * ticket.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Subtotal */}
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service Fee</span>
                    <span className="text-gray-900">${serviceeFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processing Fee</span>
                    <span className="text-gray-900">${processingFee.toFixed(2)}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-6 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-xs text-green-700">Secure SSL encrypted checkout</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFlow;