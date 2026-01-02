import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const RequestJobs = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  useEffect(() => {
    const loadFromLocal = () => {
      const stored = localStorage.getItem('wheelchair_lifter_requests_v1');
      if (stored) {
        try {
          setRequests(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse requests', e);
        }
      }
    };

    const loadFromSupabase = async () => {
      if (!supabase) {
        loadFromLocal();
        return;
      }

      const { data, error } = await supabase
        .from('requests')
        .select('request_code, status, created_at, payload');

      if (error) {
        console.error('Supabase fetch failed, using local cache', error);
        loadFromLocal();
        return;
      }

      if (data && data.length > 0) {
        const mapped = data.map(row => {
          const payload = row.payload || {};
          return {
            ...payload,
            id: row.request_code,
            request_code: row.request_code,
            status: row.status || payload.status || 'Requested to factory',
            createdAt: row.created_at || payload.createdAt,
            job: payload.job || { requestType: 'Wheelchair Lifter Installation' },
            customer: payload.customer || { name: '', mobile: '', quoteRef: '' },
          };
        });
        setRequests(mapped);
        localStorage.setItem('wheelchair_lifter_requests_v1', JSON.stringify(mapped));
      } else {
        loadFromLocal();
      }
    };

    loadFromSupabase();
  }, []);

  const handleStatusChange = async (id, newStatus, e) => {
    e.stopPropagation();
    const updated = requests.map(req => 
      (req.id === id || req.request_code === id) ? { ...req, status: newStatus } : req
    );
    setRequests(updated);
    localStorage.setItem('wheelchair_lifter_requests_v1', JSON.stringify(updated));

    if (supabase) {
      const { error } = await supabase
        .from('requests')
        .update({ status: newStatus })
        .eq('request_code', id);

      if (error) {
        console.error('Failed to update status in Supabase', error);
      }
    }
  };

  const filteredRequests = requests
    .filter(req => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (req.id || '').toLowerCase().includes(searchLower) ||
        (req.customer?.name || '').toLowerCase().includes(searchLower) ||
        (req.customer?.mobile || '').includes(searchTerm) ||
        (req.customer?.quoteRef || '').toLowerCase().includes(searchLower);
      
      const matchesFilter = filterStatus === 'All' || req.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Requested to factory': return { bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800', icon: '📋' };
      case 'In review': return { bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800', icon: '🔍' };
      case 'Approved': return { bg: 'bg-green-50', badge: 'bg-green-100 text-green-800', icon: '✓' };
      case 'Completed': return { bg: 'bg-gray-50', badge: 'bg-gray-200 text-gray-700', icon: '✓✓' };
      default: return { bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-700', icon: '◎' };
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const stats = {
    total: requests.length,
    requested: requests.filter(r => r.status === 'Requested to factory').length,
    inReview: requests.filter(r => r.status === 'In review').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    completed: requests.filter(r => r.status === 'Completed').length,
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 text-white transition-all duration-300 flex flex-col border-r border-gray-700`}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className={`font-bold text-lg transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Factory</h2>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white">
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2">
          <div className={`text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-4 ${sidebarOpen ? '' : 'hidden'}`}>
            Dashboard
          </div>
          <div className="space-y-2">
            {[
              { label: 'All Requests', count: stats.total, icon: '📊', key: 'All' },
              { label: 'Requested', count: stats.requested, icon: '📋', key: 'Requested to factory' },
              { label: 'In Review', count: stats.inReview, icon: '🔍', key: 'In review' },
              { label: 'Approved', count: stats.approved, icon: '✓', key: 'Approved' },
              { label: 'Completed', count: stats.completed, icon: '✓✓', key: 'Completed' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilterStatus(item.key)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between ${
                  filterStatus === item.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="flex items-center gap-2 flex-1 min-w-0">
                  <span>{item.icon}</span>
                  {sidebarOpen && <span className="truncate text-sm">{item.label}</span>}
                </span>
                {sidebarOpen && <span className="text-xs bg-gray-700 px-2 py-0.5 rounded ml-2 flex-shrink-0">{item.count}</span>}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => setShowNewRequestModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center gap-2"
          >
            <span>+</span>
            {sidebarOpen && <span>New Request</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">WHEELCHAIR LIFTER FACTORY</p>
              <h1 className="text-3xl font-bold text-gray-900">Request Management Dashboard</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSortOrder('newest')} className={`px-3 py-2 rounded-md text-sm transition ${sortOrder === 'newest' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                Newest
              </button>
              <button onClick={() => setSortOrder('oldest')} className={`px-3 py-2 rounded-md text-sm transition ${sortOrder === 'oldest' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                Oldest
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white border-b border-gray-200 p-6">
          <input
            type="text"
            placeholder="Search by Request ID, Customer Name, Mobile, or Quote..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Requests Grid */}
        <div className="flex-1 overflow-auto p-6">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-lg font-medium mb-2">No requests found</p>
              <button
                onClick={() => setShowNewRequestModal(true)}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                Create your first request
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map(req => {
                const colors = getStatusColor(req.status);
                return (
                  <div
                    key={req.id}
                    onClick={() => navigate(`/requests/${req.id}`)}
                    className={`${colors.bg} border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group`}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-mono text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded w-fit">
                            {req.id}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(req.createdAt)}</p>
                        </div>
                        <div onClick={e => e.stopPropagation()}>
                          <select
                            value={req.status}
                            onChange={(e) => handleStatusChange(req.id, e.target.value, e)}
                            className={`text-xs font-bold px-3 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${colors.badge}`}
                          >
                            <option value="Requested to factory">Requested</option>
                            <option value="In review">In Review</option>
                            <option value="Approved">Approved</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      <div className="mb-4 pb-4 border-b border-gray-300">
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                          {req.customer?.name || '—'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{req.customer?.mobile || '—'}</p>
                        <p className="text-xs text-gray-500 mt-1">Quote: {req.customer?.quoteRef || '—'}</p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Vehicle:</span>
                          <span className="font-medium text-gray-900">{req.job?.vehicle?.make} {req.job?.vehicle?.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Request Type:</span>
                          <span className="font-medium text-gray-900">{req.job?.requestType || '—'}</span>
                        </div>
                      </div>

                      <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md transition-colors text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Create New Request</h2>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Click below to open the full form in a new page.</p>
              <button
                onClick={() => {
                  setShowNewRequestModal(false);
                  window.location.href = '/customer?new=1';
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Go to Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestJobs;
