import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FiTruck, FiClock, FiPlus, FiEdit2, FiTrash2, FiUser, FiDownload } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { exportDeliveryNoteXlsx } from '../utils/exportDeliveryNoteXlsx';

const DeliveryWorkSection = ({ requestId, requestType, request }) => {
  const { userEmail } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [workHours, setWorkHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showWorkHoursModal, setShowWorkHoursModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [editingWorkHours, setEditingWorkHours] = useState(null);

  const [deliveryForm, setDeliveryForm] = useState({
    delivery_date: '',
    delivery_status: 'pending',
    notes: '',
    recipient_name: '',
    recipient_contact: '',
    delivery_address: ''
  });

  const [workHoursForm, setWorkHoursForm] = useState({
    employee_name: '',
    hours_worked: '',
    work_date: new Date().toISOString().slice(0, 10),
    task_description: '',
    notes: ''
  });

  const loadData = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load deliveries
      const { data: deliveryData } = await supabase
        .from('delivery_notes')
        .select('*')
        .eq('request_id', requestId)
        .eq('request_type', requestType)
        .order('created_at', { ascending: false });
      
      // Load work hours
      const { data: workData } = await supabase
        .from('work_hours_log')
        .select('*')
        .eq('request_id', requestId)
        .eq('request_type', requestType)
        .order('work_date', { ascending: false });

      setDeliveries(deliveryData || []);
      setWorkHours(workData || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [requestId, requestType]);

  useEffect(() => {
    if (requestId && requestType) {
      loadData();
    }
  }, [requestId, requestType, loadData]);

  const handleAddDelivery = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('delivery_notes')
        .insert([{
          request_id: requestId,
          request_type: requestType,
          ...deliveryForm,
          created_by: userEmail
        }]);

      if (error) throw error;

      alert('Delivery note added successfully!');
      setShowDeliveryModal(false);
      resetDeliveryForm();
      loadData();
    } catch (err) {
      console.error('Error adding delivery:', err);
      alert('Failed to add delivery: ' + err.message);
    }
  };

  const handleUpdateDelivery = async (e) => {
    e.preventDefault();
    if (!supabase || !editingDelivery) return;

    try {
      const { error } = await supabase
        .from('delivery_notes')
        .update({
          ...deliveryForm,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingDelivery.id);

      if (error) throw error;

      alert('Delivery note updated successfully!');
      setShowDeliveryModal(false);
      setEditingDelivery(null);
      resetDeliveryForm();
      loadData();
    } catch (err) {
      console.error('Error updating delivery:', err);
      alert('Failed to update delivery: ' + err.message);
    }
  };

  const handleDeleteDelivery = async (id) => {
    if (!window.confirm('Are you sure you want to delete this delivery note?')) return;
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('delivery_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Delivery note deleted successfully!');
      loadData();
    } catch (err) {
      console.error('Error deleting delivery:', err);
      alert('Failed to delete delivery: ' + err.message);
    }
  };

  const handleAddWorkHours = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('work_hours_log')
        .insert([{
          request_id: requestId,
          request_type: requestType,
          ...workHoursForm,
          created_by: userEmail
        }]);

      if (error) throw error;

      alert('Work hours logged successfully!');
      setShowWorkHoursModal(false);
      resetWorkHoursForm();
      loadData();
    } catch (err) {
      console.error('Error adding work hours:', err);
      alert('Failed to add work hours: ' + err.message);
    }
  };

  const handleUpdateWorkHours = async (e) => {
    e.preventDefault();
    if (!supabase || !editingWorkHours) return;

    try {
      const { error } = await supabase
        .from('work_hours_log')
        .update({
          ...workHoursForm,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingWorkHours.id);

      if (error) throw error;

      alert('Work hours updated successfully!');
      setShowWorkHoursModal(false);
      setEditingWorkHours(null);
      resetWorkHoursForm();
      loadData();
    } catch (err) {
      console.error('Error updating work hours:', err);
      alert('Failed to update work hours: ' + err.message);
    }
  };

  const handleDeleteWorkHours = async (id) => {
    if (!window.confirm('Are you sure you want to delete this work log?')) return;
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('work_hours_log')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Work hours deleted successfully!');
      loadData();
    } catch (err) {
      console.error('Error deleting work hours:', err);
      alert('Failed to delete work hours: ' + err.message);
    }
  };

  const openEditDelivery = (delivery) => {
    setEditingDelivery(delivery);
    setDeliveryForm({
      delivery_date: delivery.delivery_date ? new Date(delivery.delivery_date).toISOString().slice(0, 16) : '',
      delivery_status: delivery.delivery_status,
      notes: delivery.notes || '',
      recipient_name: delivery.recipient_name || '',
      recipient_contact: delivery.recipient_contact || '',
      delivery_address: delivery.delivery_address || ''
    });
    setShowDeliveryModal(true);
  };

  const openEditWorkHours = (work) => {
    setEditingWorkHours(work);
    setWorkHoursForm({
      employee_name: work.employee_name,
      hours_worked: work.hours_worked,
      work_date: work.work_date,
      task_description: work.task_description || '',
      notes: work.notes || ''
    });
    setShowWorkHoursModal(true);
  };

  const resetDeliveryForm = () => {
    setDeliveryForm({
      delivery_date: '',
      delivery_status: 'pending',
      notes: '',
      recipient_name: '',
      recipient_contact: '',
      delivery_address: ''
    });
    setEditingDelivery(null);
  };

  const resetWorkHoursForm = () => {
    setWorkHoursForm({
      employee_name: '',
      hours_worked: '',
      work_date: new Date().toISOString().slice(0, 10),
      task_description: '',
      notes: ''
    });
    setEditingWorkHours(null);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const totalHours = workHours.reduce((sum, work) => sum + parseFloat(work.hours_worked || 0), 0);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 screen-only">
      {/* Delivery Notes Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiTruck className="text-blue-600" />
            Delivery Notes
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => { resetDeliveryForm(); setShowDeliveryModal(true); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition"
            >
              <FiPlus />
              Add Delivery
            </button>
            {deliveries.length > 0 && (
              <button
                onClick={() => {
                  const latestDelivery = deliveries[0];
                  const note = {
                    date: latestDelivery.delivery_date || new Date().toISOString(),
                    vin: request?.job?.vehicle?.vin || 'N/A',
                    vehicle: `${request?.job?.vehicle?.make || ''} ${request?.job?.vehicle?.model || ''} ${request?.job?.vehicle?.year || ''}`.trim() || 'N/A',
                    customerName: request?.customer?.name || latestDelivery.recipient_name || '',
                    phone: request?.customer?.mobile || latestDelivery.recipient_contact || '',
                    email: request?.salespersonName ? `${request.salespersonName}@gilanimobility.ae` : 'sales@gilanimobility.ae',
                    invoiceNo: request?.customer?.quoteRef || requestId || '',
                    financialCleared: latestDelivery.delivery_status === 'delivered',
                    by: latestDelivery.created_by || userEmail || '',
                    items: deliveries.map((d, i) => ({
                      description: d.notes || `Delivery ${i + 1}`,
                      quantity: 1,
                      notes: d.delivery_status || ''
                    }))
                  };
                  exportDeliveryNoteXlsx(note);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition"
                title="Export delivery note to Excel"
              >
                <FiDownload />
                Export Excel
              </button>
            )}
          </div>
        </div>

        {deliveries.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No delivery notes yet</p>
        ) : (
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(delivery.delivery_status)}`}>
                        {delivery.delivery_status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {delivery.recipient_name && (
                        <div>
                          <span className="text-gray-500">Recipient:</span> <span className="font-medium">{delivery.recipient_name}</span>
                        </div>
                      )}
                      {delivery.delivery_date && (
                        <div>
                          <span className="text-gray-500">Date:</span> <span className="font-medium">{new Date(delivery.delivery_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    {delivery.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">"{delivery.notes}"</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditDelivery(delivery)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDeleteDelivery(delivery.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Work Hours Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiClock className="text-green-600" />
              Work Hours Log
            </h3>
            {totalHours > 0 && (
              <p className="text-sm text-gray-600 mt-1">Total: <span className="font-bold text-green-600">{totalHours.toFixed(2)} hours</span></p>
            )}
          </div>
          <button
            onClick={() => { resetWorkHoursForm(); setShowWorkHoursModal(true); }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition"
          >
            <FiPlus />
            Log Hours
          </button>
        </div>

        {workHours.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No work hours logged yet</p>
        ) : (
          <div className="space-y-3">
            {workHours.map((work) => (
              <div key={work.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-gray-400" />
                        <span className="font-semibold text-gray-900">{work.employee_name}</span>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        {work.hours_worked}h
                      </span>
                      <span className="text-sm text-gray-500">{new Date(work.work_date).toLocaleDateString()}</span>
                    </div>
                    {work.task_description && (
                      <p className="text-sm text-gray-700 mb-1"><span className="font-medium">Task:</span> {work.task_description}</p>
                    )}
                    {work.notes && (
                      <p className="text-sm text-gray-600 italic">"{work.notes}"</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditWorkHours(work)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDeleteWorkHours(work.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingDelivery ? 'Edit Delivery Note' : 'Add Delivery Note'}
              </h2>
            </div>
            <form onSubmit={editingDelivery ? handleUpdateDelivery : handleAddDelivery} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Status</label>
                  <select
                    value={deliveryForm.delivery_status}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Date</label>
                  <input
                    type="datetime-local"
                    value={deliveryForm.delivery_date}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Name</label>
                  <input
                    type="text"
                    value={deliveryForm.recipient_name}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, recipient_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Contact</label>
                  <input
                    type="text"
                    value={deliveryForm.recipient_contact}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, recipient_contact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone or email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Address</label>
                <textarea
                  value={deliveryForm.delivery_address}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_address: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={deliveryForm.notes}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional delivery notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  {editingDelivery ? 'Update' : 'Add'} Delivery
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDeliveryModal(false); resetDeliveryForm(); }}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Work Hours Modal */}
      {showWorkHoursModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingWorkHours ? 'Edit Work Hours' : 'Log Work Hours'}
              </h2>
            </div>
            <form onSubmit={editingWorkHours ? handleUpdateWorkHours : handleAddWorkHours} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee Name *</label>
                <input
                  type="text"
                  value={workHoursForm.employee_name}
                  onChange={(e) => setWorkHoursForm({ ...workHoursForm, employee_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hours Worked *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    value={workHoursForm.hours_worked}
                    onChange={(e) => setWorkHoursForm({ ...workHoursForm, hours_worked: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Work Date *</label>
                  <input
                    type="date"
                    value={workHoursForm.work_date}
                    onChange={(e) => setWorkHoursForm({ ...workHoursForm, work_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Task Description</label>
                <textarea
                  value={workHoursForm.task_description}
                  onChange={(e) => setWorkHoursForm({ ...workHoursForm, task_description: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="What did you work on?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
                <textarea
                  value={workHoursForm.notes}
                  onChange={(e) => setWorkHoursForm({ ...workHoursForm, notes: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Any additional comments..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                >
                  {editingWorkHours ? 'Update' : 'Log'} Hours
                </button>
                <button
                  type="button"
                  onClick={() => { setShowWorkHoursModal(false); resetWorkHoursForm(); }}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryWorkSection;
