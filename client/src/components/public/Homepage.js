import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Homepage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link to="/">
              <h1 className="text-3xl font-bold text-brand-blue">Chinmaya Events</h1>
              <p className="text-gray-600">Discover inspiring events and experiences</p>
            </Link>
            <Link
              to="/staff/login"
              className="bg-brand-blue hover:bg-brand-blue-light text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-brand-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to Chinmaya Events
          </h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Join us for transformative spiritual and cultural experiences
          </p>
          <div className="bg-white bg-opacity-20 rounded-lg p-6 inline-block">
            <p className="text-lg">
              ✨ Meditation Sessions • 📚 Book Launches • 🎭 Cultural Programs
            </p>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Upcoming Events
          </h3>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-xl text-gray-600">Loading events...</div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-xl text-gray-600">No events scheduled at this time.</div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <div key={event.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Event Image */}
                  <div className="h-48 bg-brand-blue flex items-center justify-center">
                    {event.image ? (
                      <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-white text-6xl">🎭</div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{event.name}</h4>
                    <p className="text-gray-600 mb-4 line-clamp-2">{event.short_descrip}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">📅</span>
                        {formatDate(event.start_datetime)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">📍</span>
                        {event.location}
                      </div>
                    </div>

                    <Link
                      to={`/events/${event.id}`}
                      className="block w-full bg-brand-orange hover:bg-brand-orange-light text-white py-3 px-4 rounded-lg font-medium transition-colors text-center"
                    >
                      View Details & Buy Tickets
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-blue text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h4 className="text-2xl font-bold mb-4">Chinmaya Events</h4>
          <p className="text-lg opacity-90">
            Connecting hearts and minds through meaningful experiences
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;