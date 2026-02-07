import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FiClock, FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const WorkHours = () => {
  const { userEmail } = useAuth();
  const [workHours, setWorkHours] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored ? JSON.parse(stored) : false;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterWorker, setFilterWorker] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [formData, setFormData] = useState({
    worker_name: '',
    task_description: '',
    hours_logged: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    request_code: '',
    status: 'in_progress'
  });
  const [editingId, setEditingId] = useState(null);

  const loadWorkHours = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('work_hours_log')
        .select('*')
        .order('work_date', { ascending: false });

      if (error) {
        console.error('Error loading work hours:', error);
        setWorkHours([]);
      } else {
        setWorkHours(data || []);
      }
    } catch (err) {
      console.error('Error fetching work hours:', err);
      setWorkHours([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    if (!supabase) return;

    try {
      const tables = ['requests', 'g24_requests', 'diving_solution_requests', 'turney_seat_requests'];
      const results = [];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('request_code, payload, status, created_by_email')
          .limit(100);

        if (!error && data) {
          results.push(...data.map(r => ({
            request_code: r.request_code,
            status: r.status,
            customer: r.payload?.customer || {},
            createdBy: r.created_by_email
          })));
        }
      }

      setRequests(results);
    } catch (err) {
      console.error('Error loading requests:', err);
    }
  }, []);

  useEffect(() => {
    loadWorkHours();
    loadRequests();
  }, [loadWorkHours, loadRequests]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleAddWorkHour = async () => {
    if (!formData.worker_name || !formData.task_description || !formData.hours_logged) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        employee_name: formData.worker_name,
        task_description: formData.task_description,
        hours_worked: parseFloat(formData.hours_logged),
        work_date: formData.date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        request_id: formData.request_code || null,
        request_type: 'general', // or determine from request_code
        notes: formData.task_description,
        created_at: new Date().toISOString(),
        created_by: userEmail
      };

      if (editingId) {
        const { error } = await supabase
          .from('work_hours_log')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('work_hours_log')
          .insert([payload]);

        if (error) throw error;
      }

      setFormData({
        worker_name: '',
        task_description: '',
        hours_logged: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        request_code: '',
        status: 'in_progress'
      });

      setShowAddModal(false);
      loadWorkHours();
    } catch (err) {
      console.error('Error saving work hour:', err);
      alert('Failed to save work hour: ' + err.message);
    }
  };

  const handleDeleteWorkHour = async (id) => {
    if (!window.confirm('Are you sure you want to delete this work hour entry?')) return;

    try {
      const { error } = await supabase
        .from('work_hours_log')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadWorkHours();
    } catch (err) {
      console.error('Error deleting work hour:', err);
      alert('Failed to delete work hour');
    }
  };

  const handleEditWorkHour = (entry) => {
    setFormData({
      worker_name: entry.employee_name,
      task_description: entry.task_description,
      hours_logged: entry.hours_worked,
      date: entry.work_date,
      start_time: entry.start_time || '',
      end_time: entry.end_time || '',
      request_code: entry.request_id || '',
      status: 'in_progress'
    });
    setEditingId(entry.id);
    setShowAddModal(true);
  };

  const filteredWorkHours = workHours.filter(entry => {
    const matchesWorker = filterWorker === 'all' || entry.employee_name === filterWorker;
    const matchesStatus = filterStatus === 'all'; // No status filtering since work_hours_log doesn't have status

    let matchesDateRange = true;
    if (dateRangeStart || dateRangeEnd) {
      const entryDate = new Date(entry.work_date);
      if (dateRangeStart) {
        const startDate = new Date(dateRangeStart);
        matchesDateRange = matchesDateRange && entryDate >= startDate;
      }
      if (dateRangeEnd) {
        const endDate = new Date(dateRangeEnd);
        endDate.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && entryDate <= endDate;
      }
    }

    return matchesWorker && matchesStatus && matchesDateRange;
  });

  const uniqueWorkers = [...new Set(workHours.map(w => w.employee_name))];
  const totalHours = filteredWorkHours.reduce((sum, w) => sum + (parseFloat(w.hours_worked) || 0), 0);

  const getLinkedRequest = (requestCode) => {
    return requests.find(r => r.request_code === requestCode);
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} transition-all duration-300 flex flex-col ${darkMode ? 'border-r border-gray-700' : 'border-r border-gray-200'}`}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {sidebarOpen && <h2 className="font-bold text-lg">Work Hours</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'} transition-colors p-2 rounded`}
          >
            {sidebarOpen ? <FiChevronLeft size={22} /> : <FiChevronRight size={22} />}
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2">
          <div className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wider px-2 mb-4 ${sidebarOpen ? '' : 'hidden'}`}>
            Summary
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {totalHours.toFixed(1)}h
            </div>
            {sidebarOpen && <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Hours</p>}
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {filteredWorkHours.length}
            </div>
            {sidebarOpen && <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tasks Logged</p>}
          </div>
          
          {/* Log Hours Button */}
          <div className="pt-4">
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  worker_name: '',
                  task_description: '',
                  hours_logged: '',
                  date: new Date().toISOString().split('T')[0],
                  request_code: '',
                  status: 'in_progress'
                });
                setShowAddModal(true);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center gap-2"
            >
              <FiPlus size={18} />
              {sidebarOpen && <span>Log Hours</span>}
            </button>
          </div>
        </nav>

        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <Link to="/requests" className={`block w-full text-left px-3 py-2 rounded-md transition-all ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`}>
            ← Back to Requests
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Top Bar */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm p-6`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Work Hours Tracking</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Log and manage work hours for tasks and projects</p>
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  worker_name: '',
                  task_description: '',
                  hours_logged: '',
                  date: new Date().toISOString().split('T')[0],
                  request_code: '',
                  status: 'in_progress'
                });
                setShowAddModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center gap-2"
            >
              <FiPlus size={18} />
              Log Hours
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-6 space-y-4`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Worker</label>
              <select
                value={filterWorker}
                onChange={(e) => setFilterWorker(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="all">All Workers</option>
                {uniqueWorkers.map(worker => (
                  <option key={worker} value={worker}>{worker}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="all">All Status</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>From Date</label>
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>To Date</label>
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
          </div>

          {(dateRangeStart || dateRangeEnd || filterWorker !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setFilterWorker('all');
                setFilterStatus('all');
                setDateRangeStart('');
                setDateRangeEnd('');
              }}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${darkMode ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-200 hover:bg-gray-300'}`}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Work Hours List */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className={`flex items-center justify-center h-full ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>Loading work hours...</p>
            </div>
          ) : filteredWorkHours.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <FiClock size={48} className="mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2">No work hours logged yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                Log your first work hour
              </button>
            </div>
          ) : (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Employee Name
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Task Description
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Date Range
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Time
                      </th>
                      <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Hours
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Request
                      </th>
                      <th className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${darkMode ? 'divide-gray-700' : 'divide-gray-200'} divide-y`}>
                    {filteredWorkHours.map(entry => {
                      const linkedRequest = entry.request_id ? getLinkedRequest(entry.request_id) : null;
                      const formatTime = (time) => {
                        if (!time) return '';
                        const [hours, minutes] = time.split(':');
                        const hour = parseInt(hours);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                        return `${displayHour}:${minutes} ${ampm}`;
                      };

                      return (
                        <tr 
                          key={entry.id}
                          className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                        >
                          <td className={`px-4 py-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            <div className="font-medium">{entry.employee_name}</div>
                          </td>
                          <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <div className="max-w-xs">
                              {entry.task_description}
                              {entry.notes && (
                                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'} italic`}>
                                  {entry.notes}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {entry.start_date && entry.end_date ? (
                              entry.start_date === entry.end_date ? (
                                <div>{new Date(entry.start_date).toLocaleDateString('en-GB')}</div>
                              ) : (
                                <div>
                                  {new Date(entry.start_date).toLocaleDateString('en-GB')}
                                  <div className="text-xs">to {new Date(entry.end_date).toLocaleDateString('en-GB')}</div>
                                </div>
                              )
                            ) : (
                              <div>{new Date(entry.work_date).toLocaleDateString('en-GB')}</div>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {entry.start_time && entry.end_time ? (
                              <div className="whitespace-nowrap">
                                {formatTime(entry.start_time)}
                                <div className="text-xs">to {formatTime(entry.end_time)}</div>
                              </div>
                            ) : (
                              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                              {entry.hours_worked}h
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {linkedRequest ? (
                              <div>
                                <div className="font-mono text-xs">{entry.request_id}</div>
                                {linkedRequest.customer?.name && (
                                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {linkedRequest.customer.name}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditWorkHour(entry)}
                                className={`p-2 rounded transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                                title="Edit"
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteWorkHour(entry.id)}
                                className={`p-2 rounded transition-colors ${darkMode ? 'text-red-400 hover:text-red-300 hover:bg-gray-600' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                title="Delete"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-2xl max-w-md w-full`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingId ? 'Edit Work Hour' : 'Log New Hours'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                }}
                className={`text-2xl ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Worker Name *
                </label>
                <input
                  type="text"
                  value={formData.worker_name}
                  onChange={(e) => setFormData({ ...formData, worker_name: e.target.value })}
                  placeholder="e.g., John Smith"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Task Description *
                </label>
                <textarea
                  value={formData.task_description}
                  onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
                  placeholder="e.g., Wheelchair lifter installation for customer"
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Hours Logged *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.hours_logged}
                  onChange={(e) => setFormData({ ...formData, hours_logged: e.target.value })}
                  placeholder="e.g., 2.5"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Linked Request (Optional)
                </label>
                <select
                  value={formData.request_code}
                  onChange={(e) => setFormData({ ...formData, request_code: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="">— No Request —</option>
                  {requests.map(req => (
                    <option key={req.request_code} value={req.request_code}>
                      {req.request_code} - {req.customer?.name || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingId(null);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWorkHour}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  {editingId ? 'Update' : 'Log Hours'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkHours;
