import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { FiActivity, FiClock, FiUser, FiFileText, FiLogOut, FiMenu, FiBarChart2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Logs = () => {
  const { userEmail, logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, thisWeek: 0, thisMonth: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ added: 0, completed: 0, rejected: 0 });
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const allLogs = [];
      const allRequests = [];

      if (supabase) {
        // Fetch from all request tables
        const tables = [
          { name: 'requests', type: 'Wheelchair Lifter Installation' },
          { name: 'g24_requests', type: 'The Ultimate G24' },
          { name: 'diving_solution_requests', type: 'Diving Solution Installation' },
          { name: 'turney_seat_requests', type: 'Turney Seat Installation' }
        ];

        for (const table of tables) {
          const { data, error } = await supabase
            .from(table.name)
            .select('request_code, created_at, created_by_email, status, payload')
            .order('created_at', { ascending: false });

          if (!error && data) {
            const mapped = data.map(row => ({
              requestCode: row.request_code,
              createdAt: row.created_at,
              createdBy: row.created_by_email || 'Unknown',
              salespersonName: row.payload?.salespersonName || 'N/A',
              type: table.type,
              customerName: row.payload?.customer?.name || 'N/A',
              status: row.status || 'Requested to factory'
            }));
            allLogs.push(...mapped);
            allRequests.push(...mapped);
          }
        }
      }

      // Sort by date descending
      allLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      const stats = {
        total: allLogs.length,
        today: allLogs.filter(log => new Date(log.createdAt) >= today).length,
        thisWeek: allLogs.filter(log => new Date(log.createdAt) >= weekAgo).length,
        thisMonth: allLogs.filter(log => new Date(log.createdAt) >= monthAgo).length
      };

      // Calculate monthly stats
      const thisMonthLogs = allRequests.filter(log => new Date(log.createdAt) >= monthAgo);
      const monthlyStats = {
        added: thisMonthLogs.length,
        completed: thisMonthLogs.filter(log => log.status === 'Completed').length,
        rejected: thisMonthLogs.filter(log => log.status === 'In review').length
      };

      // Generate daily chart data for the month
      const dayMap = {};
      for (let i = 0; i < 30; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        dayMap[dateStr] = 0;
      }
      thisMonthLogs.forEach(log => {
        const date = new Date(log.createdAt);
        const dateStr = date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        if (dateStr in dayMap) dayMap[dateStr]++;
      });
      const chartData = Object.entries(dayMap).map(([date, count]) => ({ date, count })).reverse();

      setLogs(allLogs);
      setStats(stats);
      setMonthlyStats(monthlyStats);
      setMonthlyChartData(chartData);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLogs = () => {
    const now = new Date();
    switch (filterPeriod) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return logs.filter(log => new Date(log.createdAt) >= today);
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return logs.filter(log => new Date(log.createdAt) >= weekAgo);
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return logs.filter(log => new Date(log.createdAt) >= monthAgo);
      default:
        return logs;
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold text-gray-900">Work Request</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-md">
            <FiMenu size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Primary Navigation */}
          <div className="space-y-2">
            <Link
              to="/requests"
              className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-all flex items-center gap-2"
            >
              <FiFileText size={18} />
              {sidebarOpen && <span className="text-sm">Requests</span>}
            </Link>
            <Link
              to="/logs"
              className="w-full text-left px-3 py-2 rounded-md bg-blue-600 text-white transition-all flex items-center gap-2"
            >
              <FiActivity size={18} />
              {sidebarOpen && <span className="text-sm">Activity Logs</span>}
            </Link>
          </div>

          {/* Dashboard Stats */}
          {sidebarOpen && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-2 mb-3">Dashboard</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium transition-all flex items-center justify-between">
                  <span>All Requests</span>
                  <span className="bg-blue-800 px-2 py-0.5 rounded text-xs">{stats.total}</span>
                </button>
                <button className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 text-sm transition-all flex items-center justify-between">
                  <span>Requested</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{logs.filter(l => l.status === 'Requested to factory').length}</span>
                </button>
                <button className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 text-sm transition-all flex items-center justify-between">
                  <span>In Review</span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs">{logs.filter(l => l.status === 'In review').length}</span>
                </button>
                <button className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 text-sm transition-all flex items-center justify-between">
                  <span>Approved</span>
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">{logs.filter(l => l.status === 'Approved').length}</span>
                </button>
                <button className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 text-sm transition-all flex items-center justify-between">
                  <span>Completed</span>
                  <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs">{logs.filter(l => l.status === 'Completed').length}</span>
                </button>
              </div>
            </div>
          )}

          {/* Recent Jobs */}
          {sidebarOpen && logs.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-2 mb-3">Recent Jobs</h3>
              <div className="space-y-1">
                {logs.slice(0, 5).map((log, idx) => (
                  <Link
                    key={idx}
                    to={`/requests/${log.requestCode}`}
                    className="block px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 text-xs transition-all truncate"
                    title={`${log.customerName} - ${log.requestCode}`}
                  >
                    <div className="font-medium truncate">{log.requestCode}</div>
                    <div className="text-gray-500 text-xs truncate">{log.customerName}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full bg-red-200 hover:bg-red-300 text-red-900 font-semibold py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center gap-2"
          >
            <FiLogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
          {sidebarOpen && (
            <p className="text-xs mt-3 text-center text-gray-600">{userEmail}</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Logs</h1>
              <p className="text-gray-600">Track all request creation activity</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <p className="text-xs text-blue-600 font-medium uppercase">Logged in as</p>
              <p className="text-sm font-mono text-blue-900">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiFileText className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.today}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FiClock className="text-green-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Week</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats.thisWeek}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FiActivity className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{stats.thisMonth}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FiUser className="text-orange-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Stats Section */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FiBarChart2 className="text-blue-600" /> Monthly Stats
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm font-medium text-blue-600">Orders Added</p>
                      <p className="text-3xl font-bold text-blue-900 mt-1">{monthlyStats.added}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <p className="text-sm font-medium text-green-600">Completed</p>
                      <p className="text-3xl font-bold text-green-900 mt-1">{monthlyStats.completed}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <p className="text-sm font-medium text-orange-600">In Review</p>
                      <p className="text-3xl font-bold text-orange-900 mt-1">{monthlyStats.rejected}</p>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bar Chart */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Daily Orders Trend</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} fontSize={12} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Pie Chart */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Status Distribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Added', value: monthlyStats.added },
                              { name: 'Completed', value: monthlyStats.completed },
                              { name: 'In Review', value: monthlyStats.rejected }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#3b82f6" />
                            <Cell fill="#10b981" />
                            <Cell fill="#f97316" />
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

            <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Filter:</span>
                {['all', 'today', 'week', 'month'].map(period => (
                  <button
                    key={period}
                    onClick={() => setFilterPeriod(period)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      filterPeriod === period
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period === 'all' ? 'All Time' : period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <p className="text-gray-600">Loading logs...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-12 text-center">
                  <FiActivity className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-600">No activity logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesperson</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              to={`/requests/${log.requestCode}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {log.requestCode}
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">{log.type}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{log.customerName}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiUser className="mr-2 text-gray-400" size={16} />
                              <span className="text-sm text-gray-900">{log.salespersonName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600 font-mono">{log.createdBy}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiClock className="mr-2 text-gray-400" size={16} />
                              <span className="text-sm text-gray-900">{formatDate(log.createdAt)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
