import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Home, Search, QrCode, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';

const CheckInScreen = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEventSelector, setShowEventSelector] = useState(true);
  const [showGroupCheckin, setShowGroupCheckin] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const navigate = useNavigate();
  const { eventId } = useParams();

  const token = localStorage.getItem('authToken');
  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // If eventId in URL, auto-select that event
  useEffect(() => {
    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === parseInt(eventId));
      if (event) {
        setSelectedEvent(event);
        setShowEventSelector(false);
      }
    }
  }, [eventId, events]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/events');
      
      // Filter to show only today's and upcoming events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const relevantEvents = response.data.filter(event => {
        const eventDate = new Date(event.start_datetime);
        eventDate.setHours(0, 0, 0, 0);
        
        // Show events happening today or in the future
        return eventDate >= today;
      });
      
      // Sort by date (soonest first)
      const sortedEvents = relevantEvents.sort((a, b) => {
        return new Date(a.start_datetime) - new Date(b.start_datetime);
      });
      
      setEvents(sortedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setShowEventSelector(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedEvent) return;
    
    setLoading(true);
    try {
      // Search endpoint - scoped to selected event only
      const response = await axios.get(
        `http://localhost:3001/api/checkin/events/${selectedEvent.id}/search?q=${searchQuery}`,
        config
      );
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching:', error);
      alert('Error searching for attendees');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSelect = async (ticket) => {
    setSelectedTicket(ticket);
    setSearchResults([]);
    setSearchQuery('');
    
    // If ticket has an order_id, fetch all tickets in the same order
    if (ticket.order_id) {
      try {
        const response = await axios.get(
          `http://localhost:3001/api/checkin/events/${selectedEvent.id}/order/${ticket.order_id}/tickets`,
          config
        );
        // Store group tickets if there are multiple
        if (response.data.length > 1) {
          setSelectedTicket({
            ...ticket,
            groupTickets: response.data
          });
        }
      } catch (error) {
        console.error('Error fetching group tickets:', error);
      }
    }
  };

  const handleCheckIn = async () => {
    if (!selectedTicket) return;
    
    try {
      const response = await axios.post(
        `http://localhost:3001/api/checkin/events/${selectedEvent.id}/checkin/${selectedTicket.id}`,
        {},
        config
      );
      
      // Update ticket status with the response from backend
      const updatedTicket = {
        ...selectedTicket,
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        check_in_time: new Date().toISOString()
      };
      
      // If this ticket has group tickets, refresh them
      if (selectedTicket.order_id && selectedTicket.groupTickets) {
        try {
          const groupResponse = await axios.get(
            `http://localhost:3001/api/checkin/events/${selectedEvent.id}/order/${selectedTicket.order_id}/tickets`,
            config
          );
          updatedTicket.groupTickets = groupResponse.data;
        } catch (error) {
          console.error('Error refreshing group tickets:', error);
        }
      }
      
      setSelectedTicket(updatedTicket);
      alert('Check-in successful!');
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Error during check-in');
    }
  };

  const handleRedeemItem = async () => {
  if (!selectedTicket) return;
  
  try {
    const response = await axios.post(
      `http://localhost:3001/api/checkin/events/${selectedEvent.id}/checkin/${selectedTicket.id}/redeem`,
      {},
      config
    );
    
    // Update ticket status with the response from backend
    const updatedTicket = {
      ...selectedTicket,
      item_redeemed: true,
      item_collected: true,
      item_collected_at: new Date().toISOString(),
      item_redeem_time: new Date().toISOString()
    };
    
    // If this ticket has group tickets, refresh them
    if (selectedTicket.order_id && selectedTicket.groupTickets) {
      try {
        const groupResponse = await axios.get(
          `http://localhost:3001/api/checkin/events/${selectedEvent.id}/order/${selectedTicket.order_id}/tickets`,
          config
        );
        updatedTicket.groupTickets = groupResponse.data;
      } catch (error) {
        console.error('Error refreshing group tickets:', error);
      }
    }
    
    setSelectedTicket(updatedTicket);
    alert('Item redeemed successfully!');
  } catch (error) {
    console.error('Error redeeming item:', error);
    alert('Error redeeming item');
  }
};

  const handleScanQR = () => {
    // This would open the camera for QR scanning
    // You'll need to integrate a QR scanning library like html5-qrcode
    alert('QR Scanner would open here. Requires camera permissions and QR scanning library.');
    setShowScanner(true);
  };

  const getTicketStatusColor = () => {
    if (!selectedTicket) return 'bg-white';
    
    if (selectedTicket.checked_in) {
      return 'bg-orange-500'; // Already scanned
    }
    if (selectedTicket.event_id !== selectedEvent?.id) {
      return 'bg-yellow-500'; // Wrong event
    }
    if (selectedTicket.cancelled) {
      return 'bg-red-500'; // Cancelled/Invalid
    }
    return 'bg-green-500'; // Valid ticket
  };

  const getStatusMessage = () => {
    if (!selectedTicket) return '';
    
    if (selectedTicket.checked_in) {
      return 'Already Scanned';
    }
    if (selectedTicket.event_id !== selectedEvent?.id) {
      return 'Wrong Event';
    }
    if (selectedTicket.cancelled) {
      return 'Invalid Ticket';
    }
    return 'Valid Ticket';
  };

  const getStatusIcon = () => {
    if (!selectedTicket) return null;
    
    if (selectedTicket.checked_in) {
      return <X className="w-16 h-16 text-white" />;
    }
    if (selectedTicket.event_id !== selectedEvent?.id) {
      return <AlertCircle className="w-16 h-16 text-white" />;
    }
    if (selectedTicket.cancelled) {
      return <X className="w-16 h-16 text-white" />;
    }
    return <CheckCircle className="w-16 h-16 text-white" />;
  };

  // Event Selector Screen
  if (showEventSelector) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Event</h1>
            <p className="text-gray-600 mb-4">Choose which event you're checking in for</p>
          </div>

          {events.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600">No upcoming events today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const eventDate = new Date(event.start_datetime);
                const isToday = eventDate.toDateString() === new Date().toDateString();
                
                return (
                  <button
                    key={event.id}
                    onClick={() => handleEventSelect(event)}
                    className={`w-full bg-white rounded-lg shadow p-4 text-left hover:shadow-md transition-shadow ${
                      isToday ? 'border-2 border-green-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{event.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{event.location}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {eventDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {isToday && (
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Main Check-in Screen (before selecting a ticket)
  if (!selectedTicket) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <button
              onClick={() => setShowEventSelector(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Home className="w-6 h-6" />
            </button>
            <div className="text-center">
              <h2 className="font-semibold text-gray-900">{selectedEvent?.name}</h2>
              <p className="text-xs text-gray-600">{user?.name}</p>
            </div>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {/* QR Scanner Button */}
          <button
            onClick={handleScanQR}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all"
          >
            <QrCode className="w-16 h-16 mx-auto mb-3" />
            <div className="text-xl font-semibold">Scan QR Code</div>
            <div className="text-sm opacity-90 mt-1">Tap to open camera</div>
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Manual Search */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Manual Search</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Name, email, phone, or order #"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => handleTicketSelect(ticket)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="font-semibold text-gray-900">{ticket.attendee_name}</div>
                    <div className="text-sm text-gray-600">{ticket.ticket_type}</div>
                    <div className="text-xs text-gray-500 mt-1">Order #{ticket.order_id}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-2xl mx-auto flex justify-around">
            <button className="flex flex-col items-center text-blue-600">
              <Home className="w-6 h-6" />
              <span className="text-xs mt-1">Home</span>
            </button>
            <button 
              onClick={handleScanQR}
              className="flex flex-col items-center text-gray-600"
            >
              <QrCode className="w-6 h-6" />
              <span className="text-xs mt-1">Scan</span>
            </button>
            <button className="flex flex-col items-center text-gray-600">
              <Search className="w-6 h-6" />
              <span className="text-xs mt-1">Search</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ticket Display Screen (after selecting a ticket)
  const statusColor = getTicketStatusColor();
  const statusMessage = getStatusMessage();
  const StatusIcon = getStatusIcon();

  // Group Check-in Screen
  if (showGroupCheckin && selectedTicket?.groupTickets) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <button
              onClick={() => setShowGroupCheckin(false)}
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              <X className="w-6 h-6 mr-2" />
              <span>Back</span>
            </button>
            <div className="text-center">
              <h2 className="font-semibold text-gray-900">Group Check-in</h2>
              <p className="text-xs text-gray-600">Order #{selectedTicket.order_id}</p>
            </div>
            <div className="w-16"></div>
          </div>
        </div>

        {/* Group Tickets List */}
        <div className="max-w-2xl mx-auto p-4">
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              Select tickets to check in ({selectedTicket.groupTickets.length} total)
            </h3>

            <div className="space-y-3">
              {selectedTicket.groupTickets.map((ticket) => (
                <div 
                  key={ticket.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    ticket.checked_in 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{ticket.assigned_name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {ticket.eventTicket?.classification || 'General Admission'}
                      </div>
                      {ticket.eventTicket?.includes_item && (
                        <div className="flex items-center mt-2 space-x-4">
                          <label className="flex items-center text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={ticket.item_collected || false}
                              onChange={async (e) => {
                                if (e.target.checked && !ticket.item_collected) {
                                  try {
                                    await axios.post(
                                      `http://localhost:3001/api/checkin/events/${selectedEvent.id}/checkin/${ticket.id}/redeem`,
                                      {},
                                      config
                                    );
                                    // Refresh group tickets
                                    const response = await axios.get(
                                      `http://localhost:3001/api/checkin/events/${selectedEvent.id}/order/${selectedTicket.order_id}/tickets`,
                                      config
                                    );
                                    setSelectedTicket({
                                      ...selectedTicket,
                                      groupTickets: response.data
                                    });
                                  } catch (error) {
                                    console.error('Error redeeming item:', error);
                                  }
                                }
                              }}
                              className="mr-2 h-4 w-4"
                            />
                            Item: {ticket.eventTicket.item_name || 'Included'}
                          </label>
                        </div>
                      )}
                    </div>
                    <div>
                      {ticket.checked_in ? (
                        <span className="text-green-600 font-semibold flex items-center">
                          <CheckCircle className="w-5 h-5 mr-1" />
                          Checked In
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await axios.post(
                                `http://localhost:3001/api/checkin/events/${selectedEvent.id}/checkin/${ticket.id}`,
                                {},
                                config
                              );
                              // Refresh group tickets
                              const response = await axios.get(
                                `http://localhost:3001/api/checkin/events/${selectedEvent.id}/order/${selectedTicket.order_id}/tickets`,
                                config
                              );
                              setSelectedTicket({
                                ...selectedTicket,
                                groupTickets: response.data
                              });
                            } catch (error) {
                              console.error('Error checking in:', error);
                            }
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                  {ticket.checked_in && ticket.checked_in_at && (
                    <div className="text-xs text-gray-500 mt-2">
                      Checked in at: {new Date(ticket.checked_in_at).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Check In All Button */}
          <button
            onClick={async () => {
              try {
                const uncheckedTicketIds = selectedTicket.groupTickets
                  .filter(t => !t.checked_in)
                  .map(t => t.id);
                
                if (uncheckedTicketIds.length === 0) {
                  alert('All tickets are already checked in!');
                  return;
                }

                await axios.post(
                  `http://localhost:3001/api/checkin/events/${selectedEvent.id}/group`,
                  { ticketIds: uncheckedTicketIds },
                  config
                );

                // Refresh group tickets
                const response = await axios.get(
                  `http://localhost:3001/api/checkin/events/${selectedEvent.id}/order/${selectedTicket.order_id}/tickets`,
                  config
                );
                setSelectedTicket({
                  ...selectedTicket,
                  groupTickets: response.data
                });

                alert('Group check-in successful!');
              } catch (error) {
                console.error('Error with group check-in:', error);
                alert('Error during group check-in');
              }
            }}
            disabled={selectedTicket.groupTickets.every(t => t.checked_in)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check In All Remaining
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Ticket Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500">Order ID</div>
                <div className="font-semibold text-gray-900">{selectedTicket.order_id || 'N/A'}</div>
              </div>
              
              <div>
                <div className="text-gray-500">Attendee Name</div>
                <div className="font-semibold text-gray-900">{selectedTicket.attendee_name || selectedTicket.assigned_name}</div>
              </div>
              
              <div>
                <div className="text-gray-500">Purchaser Email</div>
                <div className="font-semibold text-gray-900">{selectedTicket.email || selectedTicket.purchaser_email}</div>
              </div>
              
              {(selectedTicket.phone || selectedTicket.purchaser_phone) && (
                <div>
                  <div className="text-gray-500">Purchase Phone #</div>
                  <div className="font-semibold text-gray-900">{selectedTicket.phone || selectedTicket.purchaser_phone}</div>
                </div>
              )}
              
              <div>
                <div className="text-gray-500">Ticket Type</div>
                <div className="font-semibold text-gray-900">{selectedTicket.ticket_type}</div>
              </div>
              
              <div className="border-t pt-3">
                <div className="text-gray-500">Check-in Status</div>
                <div className="font-semibold text-gray-900">
                  {selectedTicket.checked_in ? (
                    <span className="text-green-600">✓ Checked In</span>
                  ) : (
                    <span className="text-gray-600">Not Checked In</span>
                  )}
                </div>
                {selectedTicket.checked_in && (selectedTicket.check_in_time || selectedTicket.checked_in_at) && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(selectedTicket.check_in_time || selectedTicket.checked_in_at).toLocaleString()}
                  </div>
                )}
              </div>
              
              {selectedTicket.has_item && (
                <div>
                  <div className="text-gray-500">Item Status</div>
                  <div className="font-semibold text-gray-900">
                    {selectedTicket.item_redeemed || selectedTicket.item_collected ? (
                      <span className="text-green-600">✓ Collected</span>
                    ) : (
                      <span className="text-gray-600">Not Collected</span>
                    )}
                  </div>
                  {(selectedTicket.item_redeemed || selectedTicket.item_collected) && (selectedTicket.item_collected_at || selectedTicket.item_redeem_time) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(selectedTicket.item_collected_at || selectedTicket.item_redeem_time).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowDetails(false)}
              className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Back Button */}
      <div className="p-4">
        <button
          onClick={() => setSelectedTicket(null)}
          className="flex items-center text-gray-700 hover:text-gray-900"
        >
          <X className="w-6 h-6 mr-2" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Ticket Card */}
      <div className="max-w-md mx-auto px-4">
        <div className={`${statusColor} rounded-t-3xl rounded-b-3xl shadow-2xl overflow-hidden`}>
          {/* Ticket Header */}
          <div className="pt-8 pb-6 px-6 relative">
            <div className="absolute top-4 left-6 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-medium">
              Ticket
            </div>
            <div className="absolute top-4 right-6 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-medium">
              {selectedTicket.group_size || 1}
            </div>

            {/* Event Name */}
            <h2 className="text-white text-2xl font-bold text-center mt-8 mb-8">
              {selectedEvent?.name}
            </h2>

            {/* Status Icon */}
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                {StatusIcon}
              </div>
            </div>

            {/* Status Message */}
            <div className="text-white text-center text-xl font-semibold mb-6">
              {statusMessage}
            </div>

            {/* Attendee Name */}
            <div className="text-white text-center text-2xl font-bold mb-2">
              {selectedTicket.attendee_name}
            </div>

            {/* Action Links */}
            <div className="flex justify-center space-x-4 text-white/90 text-sm">
              <button 
                onClick={() => setShowDetails(true)}
                className="flex items-center hover:text-white"
              >
                <Info className="w-4 h-4 mr-1" />
                View Details
              </button>
            </div>
          </div>

          {/* Dotted Divider */}
          <div className="border-t-2 border-dashed border-white/30 mx-6"></div>

          {/* Action Buttons */}
          <div className="p-6 space-y-3">
            <button
              onClick={handleRedeemItem}
              disabled={selectedTicket.item_redeemed || !selectedTicket.has_item}
              className="w-full bg-white/90 hover:bg-white text-gray-800 py-4 px-6 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedTicket.item_redeemed ? 'ITEMS REDEEMED' : 'REDEEM ITEMS'}
            </button>

            <button
              onClick={handleCheckIn}
              disabled={selectedTicket.checked_in}
              className="w-full bg-white/90 hover:bg-white text-gray-800 py-4 px-6 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedTicket.checked_in ? `CHECKED IN` : 'CHECK-IN'}
            </button>

            {selectedTicket.groupTickets && selectedTicket.groupTickets.length > 1 && (
              <button 
                onClick={() => setShowGroupCheckin(true)}
                className="w-full text-white py-3 px-6 rounded-xl font-medium underline hover:text-white/80 transition-all"
              >
                Group Check-in ({selectedTicket.groupTickets.length} tickets)
              </button>
            )}
          </div>
        </div>

        {/* Check-in Time Display */}
        {selectedTicket.checked_in && (selectedTicket.check_in_time || selectedTicket.checked_in_at) && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Checked in at: {new Date(selectedTicket.check_in_time || selectedTicket.checked_in_at).toLocaleTimeString()}
          </div>
        )}

        {/* Item Redeem Time Display */}
        {(selectedTicket.item_redeemed || selectedTicket.item_collected) && (selectedTicket.item_redeem_time || selectedTicket.item_collected_at) && (
          <div className="text-center text-sm text-gray-600">
            Item redeemed at: {new Date(selectedTicket.item_redeem_time || selectedTicket.item_collected_at).toLocaleTimeString()}
          </div>
        )}

      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex justify-around">
          <button 
            onClick={() => setSelectedTicket(null)}
            className="flex flex-col items-center text-blue-600"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button 
            onClick={handleScanQR}
            className="flex flex-col items-center text-gray-600"
          >
            <QrCode className="w-6 h-6" />
            <span className="text-xs mt-1">Scan</span>
          </button>
          <button className="flex flex-col items-center text-gray-600">
            <Search className="w-6 h-6" />
            <span className="text-xs mt-1">Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInScreen;