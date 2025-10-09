import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { User, Ticket, CreditCard, Check, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import StripePayment from '../public/StripePayment';

const CheckoutFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { eventId } = useParams();
  const location = useLocation();
  
  // State for event and ticket data
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get data from EventDetail.js
  const selectedTickets = location.state?.selectedTickets || {};

  // Fetch event data
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        // Fetch event details
        const eventResponse = await axios.get(`http://localhost:3001/api/events/${eventId}`);
        setEvent(eventResponse.data);
        
        // Fetch ticket types
        const ticketsResponse = await axios.get(`http://localhost:3001/api/tickets/event/${eventId}`);
        setTicketTypes(ticketsResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

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
      nameOnCard: ''
    }
  });

  const [errors, setErrors] = useState({});

  // Initialize ticket holders
  useEffect(() => {
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
  }, [selectedTickets]);

  // Auto-fill names when checkbox is checked
  useEffect(() => {
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

    if (!formData.purchaser.firstName.trim()) newErrors.firstName = 'Required';
    if (!formData.purchaser.lastName.trim()) newErrors.lastName = 'Required';
    if (!formData.purchaser.email.trim()) newErrors.email = 'Required';
    if (!formData.purchaser.phone.trim()) newErrors.phone = 'Required';

    formData.ticketHolders.forEach((holder, index) => {
      if (!holder.firstName.trim()) newErrors[`ticket_${index}_firstName`] = 'Required';
      if (!holder.lastName.trim()) newErrors[`ticket_${index}_lastName`] = 'Required';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.paymentInfo.cardNumber.trim()) newErrors.cardNumber = 'Required';
    if (!formData.paymentInfo.expiryDate.trim()) newErrors.expiryDate = 'Required';
    if (!formData.paymentInfo.cvv.trim()) newErrors.cvv = 'Required';
    if (!formData.paymentInfo.nameOnCard.trim()) newErrors.nameOnCard = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
  };

  const handlePrev = () => setCurrentStep(prev => Math.max(1, prev - 1));

  // Add this function in your CheckoutFlow component, before the return statement

  const createPurchase = async () => {
    try {
      const purchaseData = {
        eventId: eventId,
        purchaserInfo: {
          email: formData.purchaser.email,
          firstName: formData.purchaser.firstName,
          lastName: formData.purchaser.lastName,
          phone: formData.purchaser.phone
        },
        // This sends all ticket holder names (Ram, Sam, Leo, Parth)
        ticketHolders: formData.ticketHolders.map(holder => ({
          type: holder.type,
          firstName: holder.firstName,
          lastName: holder.lastName
        })),
        // This sends the ticket type info for inventory management
        selectedTickets: selectedTickets.map(ticket => ({
          id: ticket.id,
          type: ticket.type,
          quantity: ticket.quantity,
          price: ticket.price
        })),
        totalAmount: finalTotal
      };

      console.log('Sending purchase data:', purchaseData);

      const response = await axios.post('http://localhost:3001/api/purchases', purchaseData);
      
      console.log('Purchase created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating purchase:', error.response?.data || error.message);
      throw error;
    }
  };

  const totalTickets = selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  const totalPrice = selectedTickets.reduce((sum, ticket) => sum + (ticket.quantity * ticket.price), 0);
  const serviceeFee = totalPrice * 0.05;
  const processingFee = 2.99;
  const finalTotal = totalPrice + serviceeFee + processingFee;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading checkout...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 bg-white p-6 lg:p-8">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center space-x-8">
                {[
                  { step: 1, title: 'Information', icon: User },
                  { step: 2, title: 'Payment', icon: CreditCard },
                  { step: 3, title: 'Complete', icon: Check }
                ].map(({ step, title, icon: Icon }) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep === step ? 'bg-blue-600 text-white' :
                      currentStep > step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > step ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`ml-3 text-sm font-medium ${
                      currentStep === step ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Information */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket Information</h1>
                  <p className="text-gray-600">Please provide your details and names for each ticket</p>
                </div>

                {/* Purchaser Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchaser Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={formData.purchaser.firstName}
                        onChange={(e) => handlePurchaserChange('firstName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Enter first name"
                      />
                      {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={formData.purchaser.lastName}
                        onChange={(e) => handlePurchaserChange('lastName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Enter last name"
                      />
                      {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={formData.purchaser.email}
                        onChange={(e) => handlePurchaserChange('email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Enter email"
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        value={formData.purchaser.phone}
                        onChange={(e) => handlePurchaserChange('phone', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Enter phone number"
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Ticket Holders */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Holder Names</h3>
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.useMyNameForAll}
                        onChange={(e) => setFormData(prev => ({ ...prev, useMyNameForAll: e.target.checked }))}
                        className="mr-3 h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Use my name for all tickets</span>
                    </label>
                  </div>
                  <div className="space-y-4">
                    {formData.ticketHolders.map((holder, index) => (
                      <div key={holder.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Ticket #{index + 1} - {holder.type}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input
                              type="text"
                              value={holder.firstName}
                              onChange={(e) => handleTicketHolderChange(index, 'firstName', e.target.value)}
                              disabled={formData.useMyNameForAll}
                              className={`w-full px-3 py-2 border rounded-md ${formData.useMyNameForAll ? 'bg-gray-100' : ''} ${
                                errors[`ticket_${index}_firstName`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Enter first name"
                            />
                            {errors[`ticket_${index}_firstName`] && (
                              <p className="text-red-500 text-sm mt-1">{errors[`ticket_${index}_firstName`]}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input
                              type="text"
                              value={holder.lastName}
                              onChange={(e) => handleTicketHolderChange(index, 'lastName', e.target.value)}
                              disabled={formData.useMyNameForAll}
                              className={`w-full px-3 py-2 border rounded-md ${formData.useMyNameForAll ? 'bg-gray-100' : ''} ${
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
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <StripePayment
                totalAmount={finalTotal}
                purchaserEmail={formData.purchaser.email}
                onSuccess={async () => {
                  try {
                    await createPurchase(); // Save to database AFTER payment succeeds
                    setCurrentStep(3);
                  } catch (error) {
                    alert('Payment succeeded but there was an error saving your tickets. Please contact support.');
                    console.error('Purchase creation failed:', error);
                  }
                }}
                onBack={handlePrev}
              >
              </StripePayment>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Complete!</h1>
                <p className="text-gray-600">Your tickets have been sent to {formData.purchaser.email}</p>
              </div>
            )}

            {/* Navigation */}
            {/* Navigation - Only show for Step 1 and Step 3 */}
            {currentStep !== 2 && (
              <div className="flex justify-between pt-6 border-t border-gray-200 mt-8">
                {currentStep === 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      disabled={true}
                      className="px-6 py-2 border border-gray-200 text-gray-400 cursor-not-allowed rounded-md flex items-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Event
                    </button>
                    
                    <button
                      onClick={handleNext}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Continue to Payment
                    </button>
                  </>
                )}
                
                {currentStep === 3 && (
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mx-auto"
                  >
                    Back to Events
                  </button>
                )}
              </div>
            )}
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
                    <h3 className="font-semibold text-gray-900 text-sm">{event?.name || 'Loading...'}</h3>
                    <p className="text-gray-600 text-sm">
                      {event?.start_datetime ? new Date(event.start_datetime).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : 'Loading...'}
                    </p>
                    <p className="text-gray-600 text-sm">{event?.location || 'Loading...'}</p>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4">
                  {selectedTickets && selectedTickets.length > 0 ? (
                    selectedTickets
                      .filter(ticket => ticket.quantity > 0) // Only show tickets with quantity > 0
                      .map((ticket, index) => (
                        <div key={ticket.id || `${ticket.type}-${index}`} className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {ticket.quantity}x {ticket.type || ticket.name || 'General Admission'}
                            </p>
                            <p className="text-xs text-gray-500">
                              ${(ticket.price || 0).toFixed(2)} each
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            ${((ticket.quantity || 0) * (ticket.price || 0)).toFixed(2)}
                          </p>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No tickets selected</p>
                    </div>
                  )}
                </div>
                {selectedTickets && selectedTickets.length > 0 && (
                  <>
                    <div className="border-t border-gray-200 pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">${(totalPrice || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Service Fee</span>
                        <span className="text-gray-900">${(serviceeFee || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Processing Fee</span>
                        <span className="text-gray-900">${(processingFee || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-lg font-bold text-gray-900">${(finalTotal || 0).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {totalTickets || selectedTickets.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0)} tickets
                      </p>
                    </div>
                  </>
                )}
                </div>

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