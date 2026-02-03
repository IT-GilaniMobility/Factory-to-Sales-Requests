import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FiTruck, FiPackage, FiClock, FiCheck, FiX, FiSearch, FiFilter, FiBarChart2, FiDownload, FiEye } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { exportDeliveryNoteXlsx } from '../utils/exportDeliveryNoteXlsx';

const Deliveries = () => {
  const { userEmail } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(false);

  const loadDeliveries = useCallback(async () => {
    if (!supabase) {
      console.warn('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let query = supabase
        .from('delivery_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('delivery_status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDeliveries(data || []);
    } catch (err) {
      console.error('Error loading deliveries:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  // Filter deliveries by search query
  const filteredDeliveries = deliveries.filter(d => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (d.recipient_name || '').toLowerCase().includes(query) ||
      (d.request_id || '').toLowerCase().includes(query) ||
      (d.notes || '').toLowerCase().includes(query) ||
      (d.delivery_address || '').toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const stats = {
    pending: deliveries.filter(d => d.delivery_status === 'pending').length,
    in_transit: deliveries.filter(d => d.delivery_status === 'in_transit').length,
    delivered: deliveries.filter(d => d.delivery_status === 'delivered').length,
    cancelled: deliveries.filter(d => d.delivery_status === 'cancelled').length,
    total: deliveries.length
  };

  const pieData = [
    { name: 'Pending', value: stats.pending, color: '#f59e0b' },
    { name: 'In Transit', value: stats.in_transit, color: '#3b82f6' },
    { name: 'Delivered', value: stats.delivered, color: '#10b981' },
    { name: 'Cancelled', value: stats.cancelled, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="text-yellow-600" />;
      case 'in_transit':
        return <FiTruck className="text-blue-600" />;
      case 'delivered':
        return <FiCheck className="text-green-600" />;
      case 'cancelled':
        return <FiX className="text-red-600" />;
      default:
        return <FiPackage className="text-gray-600" />;
    }
  };

  const handleExportDelivery = (delivery) => {
    const note = {
      date: delivery.delivery_date || delivery.created_at,
      vin: 'N/A',
      customerName: delivery.recipient_name || '',
      phone: delivery.recipient_contact || '',
      email: userEmail || 'sales@gilanimobility.ae',
      invoiceNo: delivery.request_id || '',
      financialCleared: delivery.delivery_status === 'delivered',
      by: delivery.created_by || userEmail || '',
      items: [{
        description: delivery.notes || 'Delivery',
        quantity: 1,
        notes: delivery.delivery_status || ''
      }]
    };
    exportDeliveryNoteXlsx(note);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FiTruck className="text-3xl text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delivery Management</h1>
              <p className="text-sm text-gray-500">Track and manage all delivery notes</p>
            </div>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
              showStats ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FiBarChart2 />
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Delivery Statistics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FiClock className="text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FiTruck className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">In Transit</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{stats.in_transit}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FiCheck className="text-green-600" />
                    <span className="text-sm font-medium text-green-800">Delivered</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{stats.delivered}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FiX className="text-red-600" />
                    <span className="text-sm font-medium text-red-800">Cancelled</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">{stats.cancelled}</p>
                </div>
              </div>

              {/* Pie Chart */}
              {pieData.length > 0 && (
                <div className="flex justify-center items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search deliveries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status ({stats.total})</option>
                <option value="pending">Pending ({stats.pending})</option>
                <option value="in_transit">In Transit ({stats.in_transit})</option>
                <option value="delivered">Delivered ({stats.delivered})</option>
                <option value="cancelled">Cancelled ({stats.cancelled})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Deliveries List */}
        {filteredDeliveries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FiPackage className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Deliveries Found</h3>
            <p className="text-gray-500">
              {searchQuery
                ? 'Try adjusting your search query.'
                : 'Delivery notes will appear here when added to job cards.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Request ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Recipient</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Delivery Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(delivery.delivery_status)}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(delivery.delivery_status)}`}>
                            {(delivery.delivery_status || 'pending').replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/request/${delivery.request_id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {delivery.request_id || '—'}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{delivery.recipient_name || '—'}</p>
                          {delivery.recipient_contact && (
                            <p className="text-sm text-gray-500">{delivery.recipient_contact}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {delivery.delivery_date
                          ? new Date(delivery.delivery_date).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                        {delivery.notes || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/request/${delivery.request_id}`}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Request"
                          >
                            <FiEye />
                          </Link>
                          <button
                            onClick={() => handleExportDelivery(delivery)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Export to Excel"
                          >
                            <FiDownload />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Footer */}
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {filteredDeliveries.length} of {stats.total} delivery notes
        </div>
      </div>
    </div>
  );
};

export default Deliveries;
