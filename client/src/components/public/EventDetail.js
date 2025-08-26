import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Check if user came from admin dashboard
  const isAdminView = location.state?.fromAdmin || false;
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = user && user.role === 'ADMIN';

  // Purchase form state
  const [selectedTickets, setSelectedTickets] = useState({});

useEffect(() => {
  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/events/${eventId}`);
      setEvent(response.data);
    } catch (error) {
      setError('Event not found');
      console.error('Error fetching event:', error);
    }
  };

  const fetchTicketTypes = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/tickets/event/${eventId}`);
      setTicketTypes(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventData = async () => {
    await fetchEventDetails();
    await fetchTicketTypes();
  };

  loadEventData();
}, [eventId]);

  const handleTicketSelect = (ticketTypeId, quantity) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketTypeId]: quantity
    }));
  };

  const calculateTotal = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketTypeId, quantity]) => {
      const ticketType = ticketTypes.find(t => t.id === ticketTypeId);
      return total + (ticketType ? ticketType.cost * quantity : 0);
    }, 0);
  };

  const formatPrice = (cents) => {
    return (cents / 100).toFixed(2);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBackClick = () => {
    if (isAdminView && isAdmin) {
      navigate('/staff/dashboard');
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading event details...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{error || 'Event not found'}</div>
          <button 
            onClick={handleBackClick}
            className="text-brand-blue hover:text-brand-blue-light"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-brand-blue">Chinmaya Events</h1>
              {isAdminView && <p className="text-sm text-gray-600">Admin View</p>}
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin && !isAdminView && (
                <Link
                  to="/staff/dashboard"
                  className="text-brand-blue hover:text-brand-blue-light font-medium"
                >
                  Admin Dashboard
                </Link>
              )}
              {!isAdmin && (
                <Link
                  to="/staff/login"
                  className="bg-brand-blue hover:bg-brand-blue-light text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Staff Login
                </Link>
              )}
              {isAdmin && (
                <span className="bg-brand-orange text-white px-3 py-1 rounded-full text-sm font-medium">
                  {user.role}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <button 
          onClick={handleBackClick}
          className="text-brand-blue hover:text-brand-blue-light mb-6 inline-block"
        >
          ← {isAdminView ? 'Back to Event Management' : 'Back to Events'}
        </button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Event Details */}
          <div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Event Image */}
              <div className="h-64 bg-brand-blue flex items-center justify-center">
                {event.image ? (
                  <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white text-8xl">🎭</div>
                )}
              </div>

              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.name}</h1>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center text-gray-600">
                    <span className="mr-3 text-xl">📅</span>
                    <div>
                      <div className="font-medium">Date & Time</div>
                      <div>{formatDate(event.start_datetime)}</div>
                      <div className="text-sm">Ends: {formatDate(event.end_datetime)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <span className="mr-3 text-xl">📍</span>
                    <div>
                      <div className="font-medium">Location</div>
                      <div>{event.location}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">About This Event</h3>
                  <p className="text-gray-600 leading-relaxed">{event.description}</p>
                </div>

                {/* Admin Actions */}
                {isAdminView && isAdmin && (
                  <div className="border-t pt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Admin Actions</h4>
                    <div className="flex space-x-3">
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Edit Event
                      </button>
                      <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Manage Tickets
                      </button>
                      <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        View Analytics
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Selection - Hide for admin view */}
          {!isAdminView && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Tickets</h2>
              
              {ticketTypes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No tickets available for this event.</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {ticketTypes.map((ticketType) => (
                    <div key={ticketType.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{ticketType.classification}</h3>
                          {ticketType.includes_item && (
                            <p className="text-brand-orange text-sm font-medium mt-1">
                              📦 Includes: {ticketType.item_name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">${formatPrice(ticketType.cost)}</div>
                          <div className="text-sm text-gray-500">{ticketType.available} available</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleTicketSelect(ticketType.id, Math.max(0, (selectedTickets[ticketType.id] || 0) - 1))}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{selectedTickets[ticketType.id] || 0}</span>
                          <button
                            onClick={() => handleTicketSelect(ticketType.id, Math.min(ticketType.available, (selectedTickets[ticketType.id] || 0) + 1))}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Order Summary */}
                  {totalTickets > 0 && (
                    <div className="border-t pt-6">
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center text-lg font-medium">
                          <span>Total: {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}</span>
                          <span>${formatPrice(calculateTotal())}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => alert('Purchase functionality coming soon! We\'ll build this next.')}
                        className="w-full bg-brand-orange hover:bg-brand-orange-light text-white py-3 px-4 rounded-lg font-medium transition-colors"
                      >
                        Continue to Purchase (Coming Soon)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Admin Ticket Overview */}
          {isAdminView && ticketTypes.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Ticket Types</h2>
              <div className="space-y-4">
                {ticketTypes.map((ticketType) => (
                  <div key={ticketType.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{ticketType.classification}</h3>
                        <p className="text-sm text-gray-600">${formatPrice(ticketType.cost)}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">{ticketType.sold} sold</div>
                        <div className="text-sm text-gray-500">{ticketType.available} available</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;