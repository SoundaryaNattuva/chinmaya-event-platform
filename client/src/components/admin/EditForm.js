import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const EventEditForm = ({ event, onClose, onSuccess }) => {
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tickets, setTickets] = useState([]);
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Form state - stores form data separate from original event
  const [formData, setFormData] = useState({
    name: '',
    start_datetime: '',
    end_datetime: '',
    location: '',
    image: '',
    short_descrip: '',
    description: ''
  });

  // Populate event data into form state when component loads
  useEffect(() => {
    if (event) {
      console.log('Event received:', event);
      console.log('Event tickets:', event.tickets);
      console.log('Tickets array length:', event.tickets?.length);
      setFormData({
        name: event.name || '',
        start_datetime: event.start_datetime || '',
        end_datetime: event.end_datetime || '',
        location: event.location || '',
        image: event.image || '',
        short_descrip: event.short_descrip || '',
        description: event.description || ''
      });

      // Initialize tickets - if event has tickets, use them, otherwise start with empty array
      if (event.eventTickets && event.eventTickets.length > 0) {
        setTickets(event.eventTickets.map((ticket, index) => ({
          id: ticket.id || `temp-${index}`,
          classification: ticket.classification || '',
          cost: ticket.cost || 0,
          quantity: ticket.quantity || 0,
          includes_item: ticket.includes_item || false,
          item_name: ticket.item_name || '',
          sold_count: ticket.sold_count || 0 // Track how many were sold
        })));
      } else {
        setTickets([]);
      }
    }
  }, [event]);

  // updates form state as you type
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  // update form state of ticket as you type
  const handleTicketChange = (ticketId, field, value) => {
    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, [field]: value }
        : ticket
    ));
  };

  const addTicket = () => {
    const newTicket = {
      id: `new-${Date.now()}`,
      classification: '',
      cost: 0,
      quantity: 0,
      includes_item: false,
      item_name: '',
      sold_count: 0
    };
    setTickets(prev => [...prev, newTicket]);
  };

  const removeTicket = (ticketId) => {
    setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
  };

  const canEditTicket = (ticket) => {
    return ticket.sold_count === 0;
  };

  // Load Google Maps API
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleMapsLoaded(true);
      document.head.appendChild(script);
    } else {
      setGoogleMapsLoaded(true);
    }
  }, []);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (googleMapsLoaded && locationInputRef.current && !autocompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        locationInputRef.current,
        {
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: 'us' }
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          setFormData(prev => ({
            ...prev,
            location: place.formatted_address
          }));
        }
      });

      autocompleteRef.current = autocomplete;
    }
  }, [googleMapsLoaded]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const token = localStorage.getItem('authToken');
      
      // Format the data for the API
      const updateData = {
        name: formData.name,
        location: formData.location,
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime,
        image: formData.image || null,
        short_descrip: formData.short_descrip,
        description: formData.description,
        tickets: tickets.map(ticket => ({
          id: ticket.id.toString().startsWith('new-') ? undefined : ticket.id,
          classification: ticket.classification,
          cost: parseFloat(ticket.cost),
          quantity: parseInt(ticket.quantity),
          includes_item: ticket.includes_item,
          item_name: ticket.includes_item ? ticket.item_name : null
        }))
      };

      console.log('Sending update data:', updateData);

      const response = await axios.put(
        `http://localhost:3001/api/admin/events/${event.id}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Update successful:', response.data);
      alert('Event updated successfully!');
      
      // Call success callback to refresh the events list
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
      
    } catch (error) {
      console.error('Error updating event:', error);
      console.error('Error response:', error.response?.data);
      alert(`Error updating event: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4">Event Edit Form</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">Name:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Start DateTime:</label>
              <input
                type="datetime-local"
                value={formData.start_datetime ? formData.start_datetime.slice(0, 16) : ''}
                onChange={(e) => handleInputChange('start_datetime', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">End DateTime:</label>
              <input
                type="datetime-local"
                value={formData.end_datetime ? formData.end_datetime.slice(0, 16) : ''}
                onChange={(e) => handleInputChange('end_datetime', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Location:</label>
              <input
                ref={locationInputRef}
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Start typing a location..."
                className="w-full p-2 border rounded"
              />
              {!googleMapsLoaded && (
                <p className="text-sm text-gray-500 mt-1">Loading location search...</p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-2">Image URL:</label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Short Description:</label>
              <textarea
                value={formData.short_descrip}
                onChange={(e) => handleInputChange('short_descrip', e.target.value)}
                rows={2}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Full Description:</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          {/* Tickets Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Ticket Types</h2>
              <button
                type="button"
                onClick={addTicket}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                + Add Ticket Type
              </button>
            </div>

            {tickets.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500 mb-4">No ticket types created yet</p>
                <button
                  type="button"
                  onClick={addTicket}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Create First Ticket Type
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket, index) => (
                  <div key={ticket.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">
                        Ticket Type {index + 1}
                        {ticket.sold_count > 0 && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {ticket.sold_count} sold
                          </span>
                        )}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeTicket(ticket.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={ticket.sold_count > 0}
                      >
                        {ticket.sold_count > 0 ? 'Cannot Delete (Sold)' : 'Remove'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Classification:</label>
                        <input
                          type="text"
                          value={ticket.classification}
                          onChange={(e) => handleTicketChange(ticket.id, 'classification', e.target.value)}
                          disabled={!canEditTicket(ticket)}
                          className="w-full p-2 border rounded disabled:bg-gray-200"
                          placeholder="e.g., General, VIP"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Cost ($):</label>
                        <input
                          type="number"
                          value={ticket.cost}
                          onChange={(e) => handleTicketChange(ticket.id, 'cost', e.target.value)}
                          disabled={!canEditTicket(ticket)}
                          min="0"
                          step="0.01"
                          className="w-full p-2 border rounded disabled:bg-gray-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Quantity Available:
                          {!canEditTicket(ticket) && <span className="text-xs text-gray-500"> (can only increase)</span>}
                        </label>
                        <input
                          type="number"
                          value={ticket.quantity}
                          onChange={(e) => handleTicketChange(ticket.id, 'quantity', e.target.value)}
                          min={canEditTicket(ticket) ? "0" : ticket.sold_count}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`includes-item-${ticket.id}`}
                          checked={ticket.includes_item}
                          onChange={(e) => handleTicketChange(ticket.id, 'includes_item', e.target.checked)}
                          disabled={!canEditTicket(ticket)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <label htmlFor={`includes-item-${ticket.id}`} className="ml-2 text-sm">
                          This ticket includes an item
                        </label>
                      </div>

                      {ticket.includes_item && (
                        <div>
                          <input
                            type="text"
                            value={ticket.item_name}
                            onChange={(e) => handleTicketChange(ticket.id, 'item_name', e.target.value)}
                            disabled={!canEditTicket(ticket)}
                            className="w-full p-2 border rounded disabled:bg-gray-200"
                            placeholder="Item name (e.g., T-shirt, Meal)"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>  
          <div className="mt-6 space-x-4">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventEditForm;