import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, Tag, Package, Users, Plus, Minus } from 'lucide-react';

const TicketManagementModal = ({ event, isOpen, onClose, onSuccess }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTicket, setEditingTicket] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    classification: '',
    quantity: '',
    cost: '',
    includes_item: false,
    item_name: ''
  });

  // Auth config
  const token = localStorage.getItem('authToken');
  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  // Fetch tickets for this event
  const fetchTickets = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/events/${event.id}/tickets`, {
        ...config
      });
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && event) {
      fetchTickets();
    }
  }, [isOpen, event]);

  // Handle editing existing ticket
  const handleEditTicket = (ticket) => {
    setEditingTicket({
      ...ticket,
      cost: ticket.cost.toString() // Convert decimal to string for input
    });
  };

  const handleUpdateTicket = async () => {
    try {
      await fetch(`http://localhost:3001/api/admin/events/${event.id}/tickets/${editingTicket.id}`, {
        method: 'PUT',
        headers: config.headers,
        body: JSON.stringify({
          classification: editingTicket.classification,
          quantity: parseInt(editingTicket.quantity),
          cost: parseFloat(editingTicket.cost),
          includes_item: editingTicket.includes_item,
          item_name: editingTicket.includes_item ? editingTicket.item_name : null
        })
      });
      
      setEditingTicket(null);
      fetchTickets();
      alert('Ticket updated successfully!');
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Error updating ticket');
    }
  };

  // Handle deleting ticket
  const handleDeleteTicket = async (ticketId, ticketName) => {
    if (window.confirm(`Are you sure you want to delete "${ticketName}"?`)) {
      try {
        await fetch(`http://localhost:3001/api/admin/events/${event.id}/tickets/${ticketId}`, {
          method: 'DELETE',
          headers: config.headers
        });
        fetchTickets();
        alert('Ticket deleted successfully!');
      } catch (error) {
        console.error('Error deleting ticket:', error);
        alert('Error deleting ticket');
      }
    }
  };

  // Handle creating new ticket
  const handleAddTicket = async () => {
    try {
      await fetch(`http://localhost:3001/api/admin/events/${event.id}/tickets`, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify({
          classification: newTicket.classification,
          quantity: parseInt(newTicket.quantity),
          cost: parseFloat(newTicket.cost),
          includes_item: newTicket.includes_item,
          item_name: newTicket.includes_item ? newTicket.item_name : null
        })
      });
      
      setNewTicket({
        classification: '',
        quantity: '',
        cost: '',
        includes_item: false,
        item_name: ''
      });
      fetchTickets();
      alert('Ticket created successfully!');
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Error creating ticket');
    }
  };

  const canDecreaseQuantity = (ticket, newQuantity) => {
    return newQuantity >= ticket.sold_count;
  };

  const canDeleteTicket = (ticket) => {
    return ticket.sold_count === 0;
  };

  if (!isOpen) return null;

return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Manage Tickets - {event?.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Existing Tickets Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2" />
              Current Tickets
            </h3>
            
            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No tickets created yet</div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => {
                  const availableTickets = ticket.quantity - ticket.sold_count;
                  const isEditing = editingTicket?.id === ticket.id;
                  
                  return (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                      {isEditing ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ticket Name *
                              </label>
                              <input
                                type="text"
                                value={editingTicket.classification}
                                onChange={(e) => setEditingTicket({...editingTicket, classification: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price ($) *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={editingTicket.cost}
                                onChange={(e) => setEditingTicket({...editingTicket, cost: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total Quantity *
                              </label>
                              <input
                                type="number"
                                value={editingTicket.quantity}
                                onChange={(e) => setEditingTicket({...editingTicket, quantity: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                              {!canDecreaseQuantity(ticket, parseInt(editingTicket.quantity)) && (
                                <p className="text-red-600 text-sm mt-1">
                                  Cannot go below {ticket.sold_count} (tickets sold)
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 pt-6">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={editingTicket.includes_item}
                                  onChange={(e) => setEditingTicket({...editingTicket, includes_item: e.target.checked})}
                                  disabled={ticket.includes_item}
                                  className="mr-2"
                                />
                                Includes Item
                              </label>
                            </div>
                          </div>
                          
                          {editingTicket.includes_item && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Item Name
                              </label>
                              <input
                                type="text"
                                value={editingTicket.item_name || ''}
                                onChange={(e) => setEditingTicket({...editingTicket, item_name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., T-shirt, Mug, etc."
                              />
                            </div>
                          )}
                          
                          <div className="flex space-x-3">
                            <button
                              onClick={handleUpdateTicket}
                              disabled={!canDecreaseQuantity(ticket, parseInt(editingTicket.quantity))}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                            >
                              Update Ticket
                            </button>
                            <button
                              onClick={() => setEditingTicket(null)}
                              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-2">
                              <h4 className="text-lg font-medium text-gray-900">{ticket.classification}</h4>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                ${ticket.cost}
                              </span>
                              {ticket.includes_item && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium flex items-center">
                                  <Package className="w-3 h-3 mr-1" />
                                  {ticket.item_name || 'Item Included'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                Total: {ticket.quantity}
                              </span>
                              <span className="flex items-center">
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                                Sold: {ticket.sold_count}
                              </span>
                              <span className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                                Available: {availableTickets}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditTicket(ticket)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit ticket"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(ticket.id, ticket.classification)}
                              disabled={!canDeleteTicket(ticket)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                              title={canDeleteTicket(ticket) ? "Delete ticket" : `Cannot delete - ${ticket.sold_count} tickets sold`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Ticket Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Create New Ticket
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  if (!showAddForm) {
                    // Reset form when opening
                    setNewTicket({
                      classification: '',
                      quantity: '',
                      cost: '',
                      includes_item: false,
                      item_name: ''
                    });
                  }
                }}
                className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {showAddForm ? (
                  <>
                    <Minus className="w-4 h-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Ticket
                  </>
                )}
              </button>
            </div>

            {showAddForm && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ticket Name *
                    </label>
                    <input
                      type="text"
                      value={newTicket.classification}
                      onChange={(e) => setNewTicket({...newTicket, classification: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., General Admission, VIP, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTicket.cost}
                      onChange={(e) => setNewTicket({...newTicket, cost: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Quantity *
                    </label>
                    <input
                      type="number"
                      value={newTicket.quantity}
                      onChange={(e) => setNewTicket({...newTicket, quantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>
                  <div className="flex items-center space-x-4 pt-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newTicket.includes_item}
                        onChange={(e) => setNewTicket({...newTicket, includes_item: e.target.checked})}
                        className="mr-2"
                      />
                      Includes Item
                    </label>
                  </div>
                </div>

                {newTicket.includes_item && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={newTicket.item_name}
                      onChange={(e) => setNewTicket({...newTicket, item_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., T-shirt, Mug, etc."
                    />
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={handleAddTicket}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Ticket
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketManagementModal;