import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FiChevronLeft, FiChevronRight, FiPlus, FiGrid, FiList, FiSun, FiMoon } from 'react-icons/fi';

const RequestJobs = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

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

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

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
      
      // Date range filter
      let matchesDateRange = true;
      if (dateRangeStart || dateRangeEnd) {
        const reqDate = new Date(req.createdAt);
        if (dateRangeStart) {
          const startDate = new Date(dateRangeStart);
          matchesDateRange = matchesDateRange && reqDate >= startDate;
        }
        if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd);
          endDate.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && reqDate <= endDate;
        }
      }
      
      return matchesSearch && matchesFilter && matchesDateRange;
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
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} transition-all duration-300 flex flex-col ${darkMode ? 'border-r border-gray-700' : 'border-r border-gray-200'}`}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-center">
          {sidebarOpen && <h2 className="font-bold text-lg flex-1">Factory</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'} transition-colors p-2 rounded flex-shrink-0`}>
            {sidebarOpen ? <FiChevronLeft size={22} /> : <FiChevronRight size={22} />}
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2">
          <div className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wider px-2 mb-4 ${sidebarOpen ? '' : 'hidden'}`}>
            Dashboard
          </div>
          <div className="space-y-2">
            {[
              { label: 'All Requests', count: stats.total, key: 'All' },
              { label: 'Requested', count: stats.requested, key: 'Requested to factory' },
              { label: 'In Review', count: stats.inReview, key: 'In review' },
              { label: 'Approved', count: stats.approved, key: 'Approved' },
              { label: 'Completed', count: stats.completed, key: 'Completed' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilterStatus(item.key)}
                className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center justify-between ${
                  filterStatus === item.key
                    ? 'bg-blue-600 text-white'
                    : darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2 flex-1 min-w-0">
                  {sidebarOpen && <span className="truncate text-sm">{item.label}</span>}
                </span>
                {sidebarOpen && <span className={`text-xs px-2 py-0.5 rounded ml-2 flex-shrink-0 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-black'}`}>{item.count}</span>}
              </button>
            ))}
          </div>
        </nav>

        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setShowNewRequestModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center gap-2"
          >
            <FiPlus size={18} />
            {sidebarOpen && <span>New Request</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-50' : 'bg-white'}`}>
        {/* Top Bar with Sort and View Toggle */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm p-6`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>WHEELCHAIR LIFTER FACTORY</p>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Request Management Dashboard</h1>
            </div>
            <div className="flex gap-2 items-center">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded transition-colors ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
              </button>
              <div className={`flex gap-2 border rounded-lg p-1 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  title="Grid View"
                >
                  <FiGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  title="List View"
                >
                  <FiList size={18} />
                </button>
              </div>
              <button onClick={() => setSortOrder('newest')} className={`px-3 py-2 rounded-md text-sm transition ${sortOrder === 'newest' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Newest
              </button>
              <button onClick={() => setSortOrder('oldest')} className={`px-3 py-2 rounded-md text-sm transition ${sortOrder === 'oldest' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Oldest
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-6 space-y-4`}>
          <div>
            <input
              type="text"
              placeholder="Search by Request ID, Customer Name, Mobile, or Quote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
            />
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>From Date</label>
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>To Date</label>
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            {(dateRangeStart || dateRangeEnd) && (
              <button
                onClick={() => {
                  setDateRangeStart('');
                  setDateRangeEnd('');
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-200 hover:bg-gray-300'}`}
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>

        {/* Requests Grid/List */}
        <div className="flex-1 overflow-auto p-6">
          {filteredRequests.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p className="text-lg font-medium mb-2">No requests found</p>
              <button
                onClick={() => setShowNewRequestModal(true)}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                Create your first request
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map(req => {
                const colors = getStatusColor(req.status);
                return (
                  <div
                    key={req.id}
                    onClick={() => navigate(`/requests/${req.id}`)}
                    className={`${colors.bg} ${darkMode ? 'border-gray-600' : 'border-gray-200'} border rounded-lg shadow-sm hover:shadow-lg hover:scale-105 transition-all cursor-pointer overflow-hidden group`}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className={`font-mono text-xs px-2 py-1 rounded w-fit ${darkMode ? 'text-gray-300 bg-gray-600' : 'text-gray-600 bg-gray-200'}`}>
                            {req.id}
                          </div>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(req.createdAt)}</p>
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

                      <div className={`mb-4 pb-4 ${darkMode ? 'border-gray-500' : 'border-gray-300'} border-b`}>
                        <h3 className={`font-bold text-lg group-hover:text-blue-600 transition-colors ${darkMode ? 'text-black' : 'text-gray-900'}`}>
                          {req.customer?.name || '—'}
                        </h3>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-black' : 'text-gray-600'}`}>{req.customer?.mobile || '—'}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-700' : 'text-gray-500'}`}>Quote: {req.customer?.quoteRef || '—'}</p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-black' : 'text-gray-600'}>Vehicle:</span>
                          <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.job?.vehicle?.make} {req.job?.vehicle?.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-black' : 'text-gray-600'}>Request Type:</span>
                          <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.job?.requestType || '—'}</span>
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
          ) : (
            <div className="space-y-3">
              {filteredRequests.map(req => {
                const colors = getStatusColor(req.status);
                return (
                  <div
                    key={req.id}
                    onClick={() => navigate(`/requests/${req.id}`)}
                    className={`${colors.bg} ${darkMode ? 'border-gray-600' : 'border-gray-200'} border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-4 flex items-center justify-between group hover:bg-opacity-70`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`font-mono text-xs px-2 py-1 rounded w-fit flex-shrink-0 ${darkMode ? 'text-white bg-gray-600' : 'text-gray-600 bg-gray-200'}`}>
                          {req.id}
                        </div>
                        <h3 className={`font-bold group-hover:text-blue-600 transition-colors truncate ${darkMode ? 'text-black' : 'text-gray-900'}`}>
                          {req.customer?.name || '—'}
                        </h3>
                        <p className={`text-xs flex-shrink-0 ${darkMode ? 'text-gray-700' : 'text-gray-500'}`}>{formatDate(req.createdAt)}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className={darkMode ? 'text-black' : 'text-gray-600'}>Mobile:</span>
                          <p className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.customer?.mobile || '—'}</p>
                        </div>
                        <div>
                          <span className={darkMode ? 'text-black' : 'text-gray-600'}>Quote:</span>
                          <p className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.customer?.quoteRef || '—'}</p>
                        </div>
                        <div>
                          <span className={darkMode ? 'text-black' : 'text-gray-600'}>Vehicle:</span>
                          <p className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.job?.vehicle?.make} {req.job?.vehicle?.model}</p>
                        </div>
                        <div>
                          <span className={darkMode ? 'text-black' : 'text-gray-600'}>Type:</span>
                          <p className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.job?.requestType || '—'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center ml-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
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
