import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, FileText, Image, X, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';

const EventEditForm = ({ event, onClose, onSuccess }) => {
  // DEBUG: Log props immediately when component renders
  console.log('=== COMPONENT PROPS ===');
  console.log('event prop:', event);
  console.log('event exists:', !!event);
  console.log('typeof event:', typeof event);
  
  // Step 1: Simple state structure
  const [formData, setFormData] = useState({
    // Basic event info
    name: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    imageUrl: '',
    shortDescription: '',
    fullDescription: '',
    // Tickets array
    tickets: [{
      id: 1,
      type: '',
      price: '',
      quantity: '',
      includesItem: false,
      itemName: ''
    }]
  });

  const [loading, setLoading] = useState(false);

  // Step 2: Initialize form data when component mounts
  useEffect(() => {
    console.log('=== useEffect RUNNING ===');
    console.log('event in useEffect:', event);
    
    if (event) {
      // DEBUG: Check what ticket data we're receiving
      console.log('=== EVENT DATA DEBUG ===');
      console.log('Full event object:', event);
      console.log('event.tickets:', event.tickets);
      console.log('typeof event.tickets:', typeof event.tickets);
      console.log('Array.isArray(event.tickets):', Array.isArray(event.tickets));
      
      // Parse the datetime strings properly
      const startDate = new Date(event.start_datetime);
      const endDate = new Date(event.end_datetime);
      
      setFormData({
        name: event.name || '',
        location: event.location || '',
        date: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
        startTime: startDate.toTimeString().slice(0, 5), // HH:MM format
        endTime: endDate.toTimeString().slice(0, 5),
        imageUrl: event.image_url || '',
        shortDescription: event.short_descrip || '',
        fullDescription: event.full_descrip || '',
        // Handle tickets properly
        tickets: event.tickets && event.tickets.length > 0 
          ? event.tickets.map((ticket, index) => {
              console.log(`Processing ticket ${index + 1}:`, ticket);
              return {
                id: ticket.id || index + 1,
                type: ticket.classification || '',
                price: ticket.cost?.toString() || '',
                quantity: ticket.quantity?.toString() || '',
                includesItem: Boolean(ticket.includes_item),
                itemName: ticket.item_name || ''
              };
            })
          : [{
              id: 1,
              type: '',
              price: '',
              quantity: '',
              includesItem: false,
              itemName: ''
            }]
      });
      
      // DEBUG: Check what we set in formData
      console.log('=== FORM DATA AFTER PROCESSING ===');
      console.log('Processed tickets will be:', 
        event.tickets && event.tickets.length > 0 
          ? event.tickets.map((ticket, index) => ({
              id: ticket.id || index + 1,
              type: ticket.classification || '',
              price: ticket.cost?.toString() || '',
              quantity: ticket.quantity?.toString() || '',
              includesItem: Boolean(ticket.includes_item),
              itemName: ticket.item_name || ''
            }))
          : [{ id: 1, type: '', price: '', quantity: '', includesItem: false, itemName: '' }]
      );
    }
  }, [event]);

  // DEBUG: Log formData.tickets whenever it changes
  useEffect(() => {
    console.log('=== CURRENT FORM DATA TICKETS ===');
    console.log('formData.tickets:', formData.tickets);
    console.log('Number of tickets:', formData.tickets.length);
  }, [formData.tickets]);

  // Step 3: Simple input handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTicketChange = (ticketId, field, value) => {
    setFormData(prev => ({
      ...prev,
      tickets: prev.tickets.map(ticket =>
        ticket.id === ticketId 
          ? { ...ticket, [field]: value }
          : ticket
      )
    }));
  };

  // Step 4: Add/remove ticket functions
  const addTicket = () => {
    const newId = Math.max(...formData.tickets.map(t => t.id)) + 1;
    setFormData(prev => ({
      ...prev,
      tickets: [...prev.tickets, {
        id: newId,
        type: '',
        price: '',
        quantity: '',
        includesItem: false,
        itemName: ''
      }]
    }));
  };

  const removeTicket = (ticketId) => {
    if (formData.tickets.length > 1) {
      setFormData(prev => ({
        ...prev,
        tickets: prev.tickets.filter(t => t.id !== ticketId)
      }));
    }
  };

  // Step 5: Form validation
  const validateForm = () => {
    const required = ['name', 'location', 'date', 'startTime', 'endTime', 'shortDescription', 'fullDescription'];
    
    for (let field of required) {
      if (!formData[field]) {
        alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Validate tickets
    for (let ticket of formData.tickets) {
      if (!ticket.type || !ticket.price || !ticket.quantity) {
        alert('Please fill in all ticket information');
        return false;
      }
      if (ticket.includesItem && !ticket.itemName) {
        alert('Please specify the item name for tickets that include items');
        return false;
      }
    }

    return true;
  };

  // Step 6: Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      
      // Format the data for the API
      const eventPayload = {
        name: formData.name,
        location: formData.location,
        start_datetime: `${formData.date}T${formData.startTime}:00`,
        end_datetime: `${formData.date}T${formData.endTime}:00`,
        image_url: formData.imageUrl || null,
        short_descrip: formData.shortDescription,
        full_descrip: formData.fullDescription,
        tickets: formData.tickets.map(ticket => ({
          classification: ticket.type,
          cost: parseFloat(ticket.price),
          quantity: parseInt(ticket.quantity),
          includes_item: ticket.includesItem,
          item_name: ticket.includesItem ? ticket.itemName : null
        }))
      };

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (event?.id) {
        // Update existing event
        await axios.put(`http://localhost:3001/api/admin/events/${event.id}`, eventPayload, config);
        alert('Event updated successfully!');
      } else {
        // Create new event
        await axios.post('http://localhost:3001/api/admin/events', eventPayload, config);
        alert('Event created successfully!');
      }

      if (onSuccess) onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error saving event:', error);
      alert(`Error saving event: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {event ? 'Edit Event' : 'Create New Event'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Event Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter event name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter event location"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Image className="inline w-4 h-4 mr-1" />
                  Event Image URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline w-4 h-4 mr-1" />
                  Short Description *
                </label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  rows={2}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description for event listings"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Description *
                </label>
                <textarea
                  value={formData.fullDescription}
                  onChange={(e) => handleInputChange('fullDescription', e.target.value)}
                  rows={4}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detailed description of the event"
                  required
                />
              </div>
            </div>

            {/* Tickets Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Ticket Types (Count: {formData.tickets.length})
              </h3>
              
              {/* DEBUG: Show raw ticket data */}
              <div className="bg-gray-100 p-2 text-xs">
                <strong>DEBUG - Current tickets:</strong>
                <pre>{JSON.stringify(formData.tickets, null, 2)}</pre>
              </div>
              
              {formData.tickets.map((ticket, index) => (
                <div key={ticket.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Ticket Type {index + 1}</h4>
                    {formData.tickets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicket(ticket.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ticket Type *
                      </label>
                      <input
                        type="text"
                        value={ticket.type}
                        onChange={(e) => handleTicketChange(ticket.id, 'type', e.target.value)}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., General, VIP, Student"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price ($) *
                      </label>
                      <input
                        type="number"
                        value={ticket.price}
                        onChange={(e) => handleTicketChange(ticket.id, 'price', e.target.value)}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={ticket.quantity}
                        onChange={(e) => handleTicketChange(ticket.id, 'quantity', e.target.value)}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="100"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`includes-item-${ticket.id}`}
                        checked={ticket.includesItem}
                        onChange={(e) => handleTicketChange(ticket.id, 'includesItem', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`includes-item-${ticket.id}`} className="ml-2 text-sm text-gray-700">
                        This ticket includes an item
                      </label>
                    </div>

                    {ticket.includesItem && (
                      <div>
                        <input
                          type="text"
                          value={ticket.itemName}
                          onChange={(e) => handleTicketChange(ticket.id, 'itemName', e.target.value)}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Item name (e.g., T-shirt, Meal, Book)"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addTicket}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                Add Another Ticket Type
              </button>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventEditForm;