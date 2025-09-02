import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Edit, Ticket, BarChart3, Trash2, MoreHorizontal } from 'lucide-react';
import axios from 'axios';
import EventEditForm from './EventEditForm';
import CreateForm from './CreateForm';
import TicketManagementModal from './TicketManagementModal';

const EventActionsDropdown = ({ event, setSelectedEvent, setShowEventForm,setSelectedEventForTickets, setShowTicketModal , fetchEvents, config, navigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const actions = [
    {
      id: 'view',
      label: 'View Event',
      icon: Eye,
      color: 'text-blue-600 hover:bg-blue-50'
    },
    {
      id: 'edit',
      label: 'Edit Details',
      icon: Edit,
      color: 'text-gray-700 hover:bg-gray-50'
    },
    {
      id: 'tickets',
      label: 'Manage Tickets',
      icon: Ticket,
      color: 'text-green-600 hover:bg-green-50'
    },
    {
      id: 'analytics',
      label: 'View Analytics',
      icon: BarChart3,
      color: 'text-purple-600 hover:bg-purple-50'
    },
    {
      id: 'delete',
      label: 'Delete Event',
      icon: Trash2,
      color: 'text-red-600 hover:bg-red-50',
      separator: true
    }
  ];

  const handleActionClick = async (actionId) => {
    setIsOpen(false);
    
    switch (actionId) {
      case 'view':
        // Navigate to view event page
        navigate(`/events/${event.id}`, { state: { fromAdmin: true } });
        break;
        
      case 'edit':
        try {
          const response = await axios.get(`http://localhost:3001/api/admin/events/${event.id}`, config);
          setSelectedEvent(response.data);
          setShowEventForm(true);
        } catch (error) {
          console.error('Error loading event:', error);
          alert('Error loading event');
        }
        break;
        
      case 'tickets':
        setSelectedEventForTickets(event);
        setShowTicketModal(true);
        // try {
        //   const response = await axios.get(`http://localhost:3001/api/admin/events/${event.id}/tickets`, config);
        //   setSelectedEvent({ ...event, tickets: response.data });
        // } catch (error) {
        //   console.error('Error loading event tickets:', error);
        //   alert('Error loading event');
        // }
        console.log(`Managing tickets for: ${event.name}`);
        break;
        
      case 'analytics':
        // Navigate to analytics page
        console.log(`Viewing analytics for: ${event.name}`);
        // TODO: Implement navigation to analytics page
        break;
        
      case 'delete':
        if (window.confirm(`Are you sure you want to delete "${event.name}"?`)) {
          try {
            await axios.delete(`http://localhost:3001/api/admin/events/${event.id}`, config);
            fetchEvents(); // Refresh the list
            alert('Event deleted successfully');
          } catch (error) {
            console.error('Error deleting event:', error);
            alert('Error deleting event');
          }
        }
        break;
      default:
        console.warn(`Unknown action: ${actionId}`);
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-8 h-8 text-gray-400 bg-white rounded-full hover:text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="More actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            
            return (
              <div key={action.id}>
                {action.separator && index > 0 && (
                  <div className="border-t border-gray-100 my-1" />
                )}
                <button
                  onClick={() => handleActionClick(action.id)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 transition-colors ${action.color}`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{action.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AdminDashboard = ({ user, onLogout }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedEventForTickets, setSelectedEventForTickets] = useState(null);


  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/events');
      const sortedEvents = response.data.sort((a, b) => {
        return new Date(b.start_datetime) - new Date(a.start_datetime);
      });
      setEvents(sortedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const navigate = useNavigate();

  const token = localStorage.getItem('authToken');
  
  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  // Helper function to determine event status
const getEventStatus = (startDateTime, endDateTime) => {
  const now = new Date();
  const start = new Date(startDateTime);
  const end = endDateTime ? new Date(endDateTime) : null;

  // Check if event is happening today
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  const eventStart = new Date(start);
  eventStart.setHours(0, 0, 0, 0); // Start of event day

  // If event starts today, consider it happening
  if (eventStart.getTime() === today.getTime()) {
    return { text: 'Happening', color: 'bg-green-100 text-green-800' };
  }

  // For events not today, use simple logic
  if (now < start) {
    return { text: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
  } else if (end && now >= start && now <= end) {
    return { text: 'Happening', color: 'bg-green-100 text-green-800' };
  } else if (!end && now >= start) {
    // If no end time is specified, assume it's happening for a reasonable duration (e.g., 3 hours)
    const assumedDuration = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    const assumedEnd = new Date(start.getTime() + assumedDuration);
    if (now <= assumedEnd) {
      return { text: 'Happening', color: 'bg-green-100 text-green-800' };
    } else {
      return { text: 'Past', color: 'bg-gray-100 text-gray-800' };
    }
  } else {
    return { text: 'Past', color: 'bg-gray-100 text-gray-800' };
  }
};

  useEffect(() => {
    // Check authentication first
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user || user.role !== 'ADMIN') {
      navigate('/staff/login');
      return;
    }
    
    // Only fetch events if authenticated
    fetchEvents();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-8">
              <div>
                <h1 className="text-2xl font-bold text-brand-blue">Chinmaya Events</h1>
                <p className="text-gray-600">Admin Dashboard</p>
              </div>
              <Link 
                to="/"
                className="text-brand-blue hover:text-brand-blue-light font-medium"
              >
                View Public Site
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-brand-orange text-white px-3 py-1 rounded-full text-sm font-medium">
                {user.role}
              </span>
              <span className="text-gray-600">Welcome, {user.name}</span>
              <button
                onClick={onLogout}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('events')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events'
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Events
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Users
            </button>
          </nav>
        </div>

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Events Management</h2>
                <button
                  onClick={() => {
                    setSelectedEvent(null); // null = create mode
                    setShowEventForm(true);
                  }}
                  className="bg-brand-blue hover:bg-brand-blue-light text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  + Create New Event
                </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-xl text-gray-600">Loading events...</div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-xl text-gray-600 mb-4">No events created yet</div>
                <button
                  onClick={() => {
                    setSelectedEvent(null); // null = create mode
                    setShowEventForm(true);
                  }}
                  className="bg-brand-blue hover:bg-brand-blue-light text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  + Create New Event
                </button>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.map((event) => {
                      const status = getEventStatus(event.start_datetime, event.end_datetime);
                      
                      return (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{event.name}</div>
                              <div className="text-sm text-gray-500">{event.short_descrip}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatDate(event.start_datetime)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {event.location}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <EventActionsDropdown 
                              event={event} 
                              setSelectedEvent={setSelectedEvent}
                              setShowEventForm={setShowEventForm}
                              fetchEvents={fetchEvents}
                              config={config}
                              setSelectedEventForTickets={setSelectedEventForTickets}
                              setShowTicketModal={setShowTicketModal}
                              navigate={navigate}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Analytics Dashboard</h2>
            <p className="text-gray-500">Sales reports, attendance metrics, and revenue analytics coming soon!</p>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">User Management</h2>
            <p className="text-gray-500">Create and manage volunteer accounts coming soon!</p>
          </div>
        )}
      </div>

      {/* Event Modal - Create */}
      {showEventForm && !selectedEvent && (
        <CreateForm
          onClose={() => {
            setShowEventForm(false);
            setSelectedEvent(null);
          }}
          onSuccess={() => {
            setShowEventForm(false);
            setSelectedEvent(null);
            fetchEvents();
          }}
        />
      )}
      {/* Event Modal - Edit */}
      {showEventForm && selectedEvent && (
        <EventEditForm
          event={selectedEvent}
          onClose={() => {
            setShowEventForm(false);
            setSelectedEvent(null);
          }}
          onSuccess={() => {
            setShowEventForm(false);
            setSelectedEvent(null);
            fetchEvents();
          }}
        />
      )}

      {/* Ticket Modal */}
      {showTicketModal && (
        <TicketManagementModal
          event={selectedEventForTickets}
          isOpen={showTicketModal}
          onClose={() => {
            setShowTicketModal(false);
            setSelectedEventForTickets(null);
          }}
          onSuccess={() => {
            // Optional: refresh events list or show success message
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;