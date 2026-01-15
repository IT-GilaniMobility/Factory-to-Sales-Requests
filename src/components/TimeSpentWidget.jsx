import React, { useState, useEffect } from 'react';
import { FiClock, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { getUserTimeStats, formatDuration } from '../utils/userTracking';

/**
 * TimeSpentWidget - Shows time spent analytics
 * Admin: sees all users; Staff: sees own stats only
 */
const TimeSpentWidget = ({ isAdmin = false, userEmail }) => {
  const [stats, setStats] = useState({ users: [], totalSeconds: 0 });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch time stats
  const fetchStats = async () => {
    setLoading(true);
    try {
      let options = {};

      if (dateRange === 'today') {
        const today = new Date().toISOString().split('T')[0];
        options = { startDate: today, endDate: today };
      } else if (dateRange === 'week') {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        options = { 
          startDate: weekAgo.toISOString().split('T')[0], 
          endDate: today.toISOString().split('T')[0] 
        };
      } else if (dateRange === 'custom' && startDate && endDate) {
        options = { startDate, endDate };
      }

      // If not admin, filter by own email
      if (!isAdmin && userEmail) {
        options.email = userEmail;
      }

      const data = await getUserTimeStats(options);
      setStats(data);
    } catch (error) {
      console.error('Error fetching time stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchStats();
  }, [dateRange, startDate, endDate, isAdmin, userEmail]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <FiClock className="text-blue-600 dark:text-blue-400 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {isAdmin ? 'Team Time Spent' : 'My Time Spent'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total: {formatDuration(stats.totalSeconds)}
            </p>
          </div>
        </div>

        <FiTrendingUp className="text-green-500 text-2xl" />
      </div>

      {/* Date Range Filter */}
      <div className="mb-4">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setDateRange('today')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              dateRange === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateRange('week')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              dateRange === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              dateRange === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Custom Date Range Inputs */}
        {dateRange === 'custom' && (
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Stats Table */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      ) : stats.users.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FiCalendar className="mx-auto text-4xl mb-2 opacity-50" />
          <p className="text-sm">No activity for this period</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  {isAdmin ? 'User' : 'Activity'}
                </th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  Time
                </th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  Sessions
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.users.map((user, index) => (
                <tr
                  key={user.email || index}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <td className="py-3 px-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      {isAdmin && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-mono font-semibold">
                      {formatDuration(user.totalSeconds)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {user.sessionsCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TimeSpentWidget;
