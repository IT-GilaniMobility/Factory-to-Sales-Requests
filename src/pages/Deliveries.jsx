import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FiTruck, FiPackage, FiClock, FiCheck, FiX, FiPlus, FiEdit2, FiBarChart2 } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Deliveries = () => {
  const { userEmail } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, in_transit, delivered, cancelled
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState({ pending: 0, in_transit: 0, delivered: 0, cancelled: 0 });
  const [deliveryChartData, setDeliveryChartData] = useState([]);
  const [formData, setFormData] = useState({
    request_id: '',
    request_type: 'wheelchair',
    delivery_date: '',
    delivery_status: 'pending',
    notes: '',
    recipient_name: '',
    recipient_contact: '',
    delivery_address: ''
  });

  const loadDeliveries = useCallback(async () => {
    if (!supabase) {
      console.warn('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('delivery_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);

      // Calculate monthly stats
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const thisMonthDeliveries = (data || []).filter(d => new Date(d.created_at) >= monthAgo);

      const stats = {
        pending: thisMonthDeliveries.filter(d => d.delivery_status === 'pending').length,
        in_transit: thisMonthDeliveries.filter(d => d.delivery_status === 'in_transit').length,
        delivered: thisMonthDeliveries.filter(d => d.delivery_status === 'delivered').length,
        cancelled: thisMonthDeliveries.filter(d => d.delivery_status === 'cancelled').length
      };
      setMonthlyStats(stats);

      // Generate daily chart data
      const dayMap = {};
      for (let i = 0; i < 30; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        dayMap[dateStr] = 0;
      }
      thisMonthDeliveries.forEach(d => {
        const date = new Date(d.created_at);
        const dateStr = date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        if (dateStr in dayMap) dayMap[dateStr]++;
      });
      const chartData = Object.entries(dayMap).map(([date, count]) => ({ date, count })).reverse();
      setDeliveryChartData(chartData);
    } catch (err) {
      console.error('Error loading deliveries:', err);
      alert('Failed to load deliveries: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const handleAddDelivery = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('delivery_notes')
        .insert([{
          ...formData,
          created_by: userEmail
        }]);

      if (error) throw error;

      alert('Delivery note added successfully!');
      setShowAddModal(false);
      resetForm();
      loadDeliveries();
    } catch (err) {
      console.error('Error adding delivery:', err);
      alert('Failed to add delivery: ' + err.message);
    }
  };

  const handleUpdateDelivery = async (e) => {
    e.preventDefault();
    if (!supabase || !selectedDelivery) return;

    try {
      const { error } = await supabase
        .from('delivery_notes')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDelivery.id);

      if (error) throw error;

      alert('Delivery note updated successfully!');
      setShowEditModal(false);
      setSelectedDelivery(null);
      resetForm();
      loadDeliveries();
    } catch (err) {
      console.error('Error updating delivery:', err);
      alert('Failed to update delivery: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      request_id: '',
      request_type: 'wheelchair',
      delivery_date: '',
      delivery_status: 'pending',
      notes: '',
      recipient_name: '',
      recipient_contact: '',
      delivery_address: ''
    });
  };

  const openEditModal = (delivery) => {
    setSelectedDelivery(delivery);
    setFormData({
      request_id: delivery.request_id,
      request_type: delivery.request_type,
      delivery_date: delivery.delivery_date ? new Date(delivery.delivery_date).toISOString().slice(0, 16) : '',
      delivery_status: delivery.delivery_status,
      notes: delivery.notes || '',
      recipient_name: delivery.recipient_name || '',
      recipient_contact: delivery.recipient_contact || '',
      delivery_address: delivery.delivery_address || ''
    });
    setShowEditModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="text-yellow-500" />;
      case 'in_transit': return <FiTruck className="text-blue-500" />;
      case 'delivered': return <FiCheck className="text-green-500" />;
      case 'cancelled': return <FiX className="text-red-500" />;
      default: return <FiPackage className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      in_transit: 'bg-blue-100 text-blue-800 border-blue-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const filteredDeliveries = filter === 'all' 
    ? deliveries 
    : deliveries.filter(d => d.delivery_status === filter);

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.delivery_status === 'pending').length,
    in_transit: deliveries.filter(d => d.delivery_status === 'in_transit').length,
    delivered: deliveries.filter(d => d.delivery_status === 'delivered').length,
    cancelled: deliveries.filter(d => d.delivery_status === 'cancelled').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiTruck className="w-12 h-12 text-blue-600 animate-bounce mx-auto mb-4" />
          <p className="text-gray-600">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/requests"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
            >
              <span className="text-lg">←</span>
              <span className="text-sm font-semibold">Back to Requests</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FiTruck className="text-blue-600" />
                Delivery Management
              </h1>
              <p className="text-gray-600 mt-2">Track and manage all deliveries</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <FiPlus />
            Add Delivery
          </button>
        </div>

        {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FiPackage className="text-3xl text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <FiClock className="text-3xl text-yellow-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-blue-600">{stats.in_transit}</p>
              </div>
              <FiTruck className="text-3xl text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <FiCheck className="text-3xl text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <FiX className="text-3xl text-red-400" />
            </div>
          </div>
        </div>

        {/* Monthly Stats Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiBarChart2 className="text-blue-600" /> Monthly Delivery Stats
            </h2>
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {showStats ? 'Hide Charts' : 'Show Charts'}
            </button>
          </div>

          {showStats && (
            <div className="space-y-6">
              {/* Stats List */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">{monthlyStats.pending}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm font-medium text-blue-600">In Transit</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{monthlyStats.in_transit}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <p className="text-sm font-medium text-green-600">Delivered</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{monthlyStats.delivered}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                  <p className="text-sm font-medium text-red-600">Cancelled</p>
                  <p className="text-3xl font-bold text-red-900 mt-1">{monthlyStats.cancelled}</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Daily Deliveries Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={deliveryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Delivery Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pending', value: monthlyStats.pending },
                          { name: 'In Transit', value: monthlyStats.in_transit },
                          { name: 'Delivered', value: monthlyStats.delivered },
                          { name: 'Cancelled', value: monthlyStats.cancelled }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#eab308" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'in_transit', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === status
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Request ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDeliveries.length === 0 ? (
                  <tr>
                             <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <FiPackage className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No deliveries found</p>
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(delivery.delivery_status)}`}>
                          {getStatusIcon(delivery.delivery_status)}
                          {delivery.delivery_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {delivery.request_id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                        {delivery.request_type.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div>{delivery.recipient_name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{delivery.recipient_contact || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {delivery.delivery_date 
                          ? new Date(delivery.delivery_date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Not scheduled'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => openEditModal(delivery)}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <FiEdit2 />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Delivery Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add Delivery Note</h2>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddDelivery} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Request ID</label>
                  <input
                    type="text"
                    value={formData.request_id}
                    onChange={(e) => setFormData({ ...formData, request_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Request Type</label>
                  <select
                    value={formData.request_type}
                    onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="wheelchair">Wheelchair</option>
                    <option value="g24">G24</option>
                    <option value="diving_solution">Diving Solution</option>
                    <option value="turney_seat">Turney Seat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Status</label>
                  <select
                    value={formData.delivery_status}
                    onChange={(e) => setFormData({ ...formData, delivery_status: e.target.value })}
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
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Name</label>
                  <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Contact</label>
                  <input
                    type="text"
                    value={formData.recipient_contact}
                    onChange={(e) => setFormData({ ...formData, recipient_contact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone or email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Address</label>
                <textarea
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  Add Delivery
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Delivery Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Edit Delivery Note</h2>
              <button
                onClick={() => { setShowEditModal(false); setSelectedDelivery(null); resetForm(); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateDelivery} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Request ID</label>
                  <input
                    type="text"
                    value={formData.request_id}
                    onChange={(e) => setFormData({ ...formData, request_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Request Type</label>
                  <select
                    value={formData.request_type}
                    onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled
                  >
                    <option value="wheelchair">Wheelchair</option>
                    <option value="g24">G24</option>
                    <option value="diving_solution">Diving Solution</option>
                    <option value="turney_seat">Turney Seat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Status</label>
                  <select
                    value={formData.delivery_status}
                    onChange={(e) => setFormData({ ...formData, delivery_status: e.target.value })}
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
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Name</label>
                  <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Contact</label>
                  <input
                    type="text"
                    value={formData.recipient_contact}
                    onChange={(e) => setFormData({ ...formData, recipient_contact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone or email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Address</label>
                <textarea
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  Update Delivery
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedDelivery(null); resetForm(); }}
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

export default Deliveries;
