import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock, MapPin, FileText, Image, ArrowRight, ArrowLeft, Plus, Trash2, X } from 'lucide-react';
import axios from 'axios';
const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;


const CreateForm = ({ event, title, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1 - Event Details
  const [eventData, setEventData] = useState({
    name: '',
    location: '',
    latitude: null,
    longitude: null,
    date: '',
    startTime: '',
    endTime: '',
    imageUrl: '',
    shortDescription: '',
    fullDescription: ''
  });

  // Step 2 - Ticket Details
  const [ticketData, setTicketData] = useState({
    tickets: [
      {
        id: 1,
        type: '',
        price: '',
        quantity: '',
        includesItem: false,
        itemName: ''
      }
    ]
  });

  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const addressInputRef = useRef(null);
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const markerRef = useRef(null);

  // Reset form when modal opens/closes or populate with edit data
  useEffect(() => {
    if (event) {
      // Edit mode - populate form with existing event data
      const startDate = new Date(event.start_datetime);
      const endDate = new Date(event.end_datetime);
      
      setEventData({
        name: event.name || '',
        location: event.location || '',
        latitude: event.latitude || null,
        longitude: event.longitude || null,
        date: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        imageUrl: event.image_url || '',
        shortDescription: event.short_descrip || '',
        fullDescription: event.full_descrip || ''
      });
      
      // Populate ticket data if available
      if (event.tickets && event.tickets.length > 0) {
        setTicketData({
          tickets: event.tickets.map((ticket, index) => ({
            id: ticket.id || index + 1,
            type: ticket.type || '',
            price: ticket.price || '',
            quantity: ticket.quantity || '',
            includesItem: ticket.includesItem || false,
            itemName: ticket.itemName || ''
          }))
        });
      }
    } else {
      // Create mode - reset form
      setCurrentStep(1);
      setEventData({
        name: '',
        location: '',
        latitude: null,
        longitude: null,
        date: '',
        startTime: '',
        endTime: '',
        imageUrl: '',
        shortDescription: '',
        fullDescription: ''
      });
      setTicketData({
        tickets: [
          {
            id: 1,
            type: '',
            price: '',
            quantity: '',
            includesItem: false,
            itemName: ''
          }
        ]
      });
      setSelectedPlace(null);
    }
  }, [event]);

  // Load Google Maps API
  useEffect(() => {
    
    if (!API_KEY) {
      console.log('Google Maps API key not found. Add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file');
      setMapLoaded(false);
      return;
    }

    // Prevent multiple script loading
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('Google Maps already loaded');
      setMapLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('Google Maps script already exists, waiting for load...');
      // Listen for the existing script to load
      existingScript.addEventListener('load', () => setMapLoaded(true));
      return;
    }

    console.log('Loading Google Maps API...');
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script'; // Add ID to prevent duplicates
    
    script.onload = () => {
      console.log('Google Maps loaded successfully');
      setMapLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Google Maps API:', error);
      setMapLoaded(false);
    };
    
    document.head.appendChild(script);
  }, []);

  const updateMap = useCallback((lat, lng, title) => {
    const map = window.eventMap;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: title,
      animation: window.google.maps.Animation.DROP
    });

    map.setCenter({ lat, lng });
    map.setZoom(15);
    
    markerRef.current = marker;
  }, []);

  const initializeAutocomplete = useCallback(() => {
    if (!addressInputRef.current) return;
    
    // Clear any existing autocomplete
    if (autocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }
    
    const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ['establishment', 'geocode'],
    componentRestrictions: { country: 'us' }
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        alert('Please select a valid address from the dropdown.');
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setEventData(prev => ({
        ...prev,
        location: place.formatted_address,
        latitude: lat,
        longitude: lng
      }));

      setSelectedPlace(place);
      updateMap(lat, lng, place.name || place.formatted_address);
    });

    autocompleteRef.current = autocomplete;
  }, [updateMap]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current) return;
    
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 13,
    });

    // If we have event coordinates, center the map there
    if (eventData.latitude && eventData.longitude) {
      map.setCenter({ lat: eventData.latitude, lng: eventData.longitude });
      updateMap(eventData.latitude, eventData.longitude, eventData.location);
    }

    map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setEventData(prev => ({
            ...prev,
            location: results[0].formatted_address,
            latitude: lat,
            longitude: lng
          }));
          
          if (addressInputRef.current) {
            addressInputRef.current.value = results[0].formatted_address;
          }
        }
      });
      
      updateMap(lat, lng, 'Selected Location');
    });

    window.eventMap = map;
  }, [eventData.latitude, eventData.longitude, eventData.location, updateMap]);

  // Initialize autocomplete and map when Google Maps loads and modal is open
  useEffect(() => {
    if (mapLoaded && addressInputRef.current && currentStep === 1) {
      setTimeout(() => {
        initializeAutocomplete();
        initializeMap();
      }, 300);
    }
  }, [mapLoaded, currentStep, initializeAutocomplete, initializeMap]);

  // Separate effect to set initial value for edit mode
  useEffect(() => {
    if (addressInputRef.current && eventData.location && event) {
      addressInputRef.current.value = eventData.location;
    }
  }, [eventData.location, event]);

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTicketChange = (ticketId, field, value) => {
    setTicketData(prev => ({
      tickets: prev.tickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, [field]: value }
          : ticket
      )
    }));
  };

  const addTicketType = () => {
    const newId = Math.max(...ticketData.tickets.map(t => t.id)) + 1;
    setTicketData(prev => ({
      tickets: [
        ...prev.tickets,
        {
          id: newId,
          type: '',
          price: '',
          quantity: '',
          includesItem: false,
          itemName: ''
        }
      ]
    }));
  };

  const removeTicketType = (ticketId) => {
    if (ticketData.tickets.length > 1) {
      setTicketData(prev => ({
        tickets: prev.tickets.filter(ticket => ticket.id !== ticketId)
      }));
    }
  };

  const validateStep1 = () => {
    const required = ['name', 'location', 'date', 'startTime', 'endTime', 'shortDescription', 'fullDescription'];
    const missing = required.filter(field => !eventData[field]);
    
    if (missing.length > 0) {
      alert(`Please fill in all required fields: ${missing.join(', ')}`);
      return false;
    }
    
    // Only require coordinates if Google Maps is loaded
    if (mapLoaded && (!eventData.latitude || !eventData.longitude)) {
      alert('Please select a valid location from the dropdown or click on the map.');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const eventPayload = {
        name: eventData.name,
        location: eventData.location,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        start_datetime: `${eventData.date}T${eventData.startTime}`,
        end_datetime: `${eventData.date}T${eventData.endTime}`,
        image_url: eventData.imageUrl,
        short_descrip: eventData.shortDescription,
        full_descrip: eventData.fullDescription,
        tickets: ticketData.tickets
      };

      if (event) {
        // Edit mode - update existing event
        await axios.put(`http://localhost:3001/api/events/${event.id}`, eventPayload);
        alert('Event updated successfully!');
      } else {
        // Create mode - add new event
        await axios.post('http://localhost:3001/api/events', eventPayload);
        alert('Event created successfully!');
      }

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = useCallback(() => {
    if (window.confirm('Are you sure you want to close? All unsaved changes will be lost.')) {
      onClose();
    }
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleModalClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleModalClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleModalClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {title} - Step {currentStep}
              </h2>
              <p className="text-gray-600">
                {currentStep === 1 ? 'Event Details' : 'Ticket Configuration'}
              </p>
            </div>
            <button
              onClick={handleModalClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {currentStep === 1 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Form Fields */}
                <div className="space-y-6">
                  {/* Event Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={eventData.name}
                      onChange={handleEventChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter event name"
                      required
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Location *
                    </label>
                    <input
                      ref={addressInputRef}
                      type="text"
                      name="location"
                      value={eventData.location}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEventData(prev => ({ ...prev, location: value }));
                        // Clear coordinates when manually typing (if no maps)
                        if (!mapLoaded && !value) {
                          setEventData(prev => ({ ...prev, latitude: null, longitude: null }));
                          setSelectedPlace(null);
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={mapLoaded ? "Start typing an address..." : "Enter full address (e.g., 123 Main St, City, State, ZIP)"}
                      required
                    />
                    {!mapLoaded && (
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Add REACT_APP_GOOGLE_MAPS_API_KEY to .env file for autocomplete and map features
                      </p>
                    )}
                    {mapLoaded && eventData.latitude && eventData.longitude && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Location coordinates: {Number(eventData.latitude).toFixed(4)}, {Number(eventData.longitude).toFixed(4)}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={eventData.date}
                      onChange={handleEventChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Start & End Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="inline w-4 h-4 mr-1" />
                        Start Time *
                      </label>
                      <input
                        type="time"
                        name="startTime"
                        value={eventData.startTime}
                        onChange={handleEventChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        name="endTime"
                        value={eventData.endTime}
                        onChange={handleEventChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Event Image URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Image className="inline w-4 h-4 mr-1" />
                      Event Image URL (optional)
                    </label>
                    <input
                      type="url"
                      name="imageUrl"
                      value={eventData.imageUrl}
                      onChange={handleEventChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="inline w-4 h-4 mr-1" />
                      Short Description *
                    </label>
                    <textarea
                      name="shortDescription"
                      value={eventData.shortDescription}
                      onChange={handleEventChange}
                      rows={2}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description for event listings"
                      required
                    />
                  </div>

                  {/* Full Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="inline w-4 h-4 mr-1" />
                      Full Description *
                    </label>
                    <textarea
                      name="fullDescription"
                      value={eventData.fullDescription}
                      onChange={handleEventChange}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Detailed description of the event"
                      required
                    />
                  </div>
                </div>

                {/* Right Column - Map or Placeholder */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Location Preview
                    </label>
                    {mapLoaded ? (
                      <div>
                        <div 
                          ref={mapRef}
                          className="w-full h-96 bg-gray-200 rounded-lg border border-gray-300"
                          style={{ minHeight: '400px' }}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          💡 Use the search box or click on the map to set location
                        </p>
                      </div>
                    ) : (
                      <div className="w-full h-96 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <h3 className="text-lg font-medium mb-2">Map Preview</h3>
                          <p className="text-sm">Add REACT_APP_GOOGLE_MAPS_API_KEY</p>
                          <p className="text-sm">to your .env file to enable maps</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedPlace && mapLoaded && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-medium text-blue-900 mb-2">Selected Location</h3>
                      <p className="text-sm text-blue-700">{selectedPlace.name}</p>
                      <p className="text-xs text-blue-600 mt-1">{selectedPlace.formatted_address}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {ticketData.tickets.map((ticket, index) => (
                  <div key={ticket.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Ticket Type {index + 1}
                      </h3>
                      {ticketData.tickets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicketType(ticket.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Ticket Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ticket Type *
                        </label>
                        <input
                          type="text"
                          value={ticket.type}
                          onChange={(e) => handleTicketChange(ticket.id, 'type', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., General, VIP, Student"
                          required
                        />
                      </div>

                      {/* Price */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price ($) *
                        </label>
                        <input
                          type="number"
                          value={ticket.price}
                          onChange={(e) => handleTicketChange(ticket.id, 'price', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity Available *
                        </label>
                        <input
                          type="number"
                          value={ticket.quantity}
                          onChange={(e) => handleTicketChange(ticket.id, 'quantity', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="100"
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    {/* Includes Item */}
                    <div className="space-y-4">
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Item Name *
                          </label>
                          <input
                            type="text"
                            value={ticket.itemName}
                            onChange={(e) => handleTicketChange(ticket.id, 'itemName', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., T-shirt, Meal, Book"
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add Ticket Type Button */}
                <button
                  type="button"
                  onClick={addTicketType}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors w-full justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Ticket Type
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            {currentStep === 1 ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Next: Ticket Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Event Details
                </button>
                
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default CreateForm;