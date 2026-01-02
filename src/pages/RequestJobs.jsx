import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const RequestJobs = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'list'

  useEffect(() => {
    const loadRequests = () => {
      const stored = localStorage.getItem('wheelchair_lifter_requests_v1');
      if (stored) {
        try {
          setRequests(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse requests", e);
        }
      }
    };
    loadRequests();
    
    // Listen for storage events in case of updates in other tabs
    window.addEventListener('storage', loadRequests);
    return () => window.removeEventListener('storage', loadRequests);
  }, []);

  const handleStatusChange = (id, newStatus, e) => {
    e.stopPropagation(); // Prevent card click
    const updated = requests.map(req => 
      req.id === id ? { ...req, status: newStatus } : req
    );
    setRequests(updated);
    localStorage.setItem('wheelchair_lifter_requests_v1', JSON.stringify(updated));
  };

  const filteredRequests = requests
    .filter(req => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        req.id.toLowerCase().includes(searchLower) ||
        req.customer.name.toLowerCase().includes(searchLower) ||
        req.customer.mobile.includes(searchTerm) ||
        req.customer.quoteRef.toLowerCase().includes(searchLower) ||
        (req.job?.requestType || '').toLowerCase().includes(searchLower);
      
      const matchesFilter = filterType === 'All' || req.job.requestType === filterType;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Requested to factory': return 'bg-blue-100 text-blue-800';
      case 'In review': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const totalCount = filteredRequests.length;
  const countByStatus = (status) => filteredRequests.filter(r => r.status === status).length;
  const requestedCount = countByStatus('Requested to factory');
  const inReviewCount = countByStatus('In review');
  const approvedCount = countByStatus('Approved');
  const completedCount = countByStatus('Completed');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header & Toolbar */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-sm text-gray-500">Dashboard</p>
              <h1 className="text-2xl font-bold text-gray-900">Request Jobs</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded-md text-sm border ${viewMode === 'cards' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm border ${viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
              >
                List
              </button>
              <Link to="/customer?new=1" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm">
                + New Request
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{label:'Total', value: totalCount}, {label:'Requested', value: requestedCount}, {label:'In review', value: inReviewCount}, {label:'Approved', value: approvedCount}, {label:'Completed', value: completedCount}].slice(0,4).map(stat => (
              <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search ID, Customer, Mobile, Quote, Request Type"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Types</option>
            <option value="Wheelchair Lifter Installation">Wheelchair Lifter</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Content */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">No requests found.</p>
            <Link to="/customer?new=1" className="text-blue-600 hover:underline font-medium">
              Create your first request
            </Link>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map(req => (
              <div 
                key={req.id}
                onClick={() => navigate(`/requests/${req.id}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {req.id}
                    </span>
                    <div onClick={e => e.stopPropagation()}>
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id, e.target.value, e)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getStatusColor(req.status)}`}
                      >
                        <option value="Requested to factory">Requested</option>
                        <option value="In review">In review</option>
                        <option value="Approved">Approved</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {req.job.requestType}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {formatDate(req.createdAt)}
                  </p>

                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{req.customer.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {req.customer.mobile}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Request</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => (
                    <tr key={req.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{req.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{req.job.requestType}</div>
                        <div className="text-xs text-gray-500">{req.customer.quoteRef}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 font-medium">{req.customer.name}</div>
                        <div className="text-xs text-gray-500">{req.customer.mobile}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={req.status}
                          onChange={(e) => handleStatusChange(req.id, e.target.value, e)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${getStatusColor(req.status)}`}
                        >
                          <option value="Requested to factory">Requested</option>
                          <option value="In review">In review</option>
                          <option value="Approved">Approved</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{formatDate(req.createdAt)}</td>
                      <td className="px-4 py-3 text-xs text-blue-600">
                        <button onClick={() => navigate(`/requests/${req.id}`)} className="hover:underline">Open</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestJobs;
