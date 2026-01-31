import React, { useState, useEffect, useRef } from 'react';
import { FiClock } from 'react-icons/fi';
import { getUserTimeStats, formatDuration } from '../utils/userTracking';

const TimeSpentHover = ({ isAdmin, userEmail }) => {
  const [stats, setStats] = useState({ users: [], totalSeconds: 0 });
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const result = await getUserTimeStats({
          startDate: today,
          endDate: today,
          email: isAdmin ? undefined : userEmail
        });
        setStats(result);
      } catch (error) {
        console.error('❌ Failed to fetch time stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [isAdmin, userEmail]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const totalHours = (stats.totalSeconds / 3600).toFixed(1);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onMouseEnter={() => setShowDropdown(true)}
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center gap-2"
        title="Team Time Spent Today"
      >
        <FiClock size={20} />
        <span className="text-sm font-semibold hidden sm:inline">
          {totalHours}h
        </span>
      </button>

      {showDropdown && (
        <div
          onMouseLeave={() => setShowDropdown(false)}
          className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-600 to-teal-600 p-3 text-white">
            <div className="flex items-center gap-2">
              <FiClock size={18} />
              <h3 className="font-semibold">Time Spent Today</h3>
              <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {formatDuration(stats.totalSeconds)} total
              </span>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : stats.users.length === 0 ? (
              <div className="p-6 text-center">
                <FiClock className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No time tracked today yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                          User
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Time
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                          Sessions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {stats.users.map((user, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-3 py-2">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatDuration(user.totalSeconds)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {user.sessionsCount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-2 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isAdmin ? 'All team members' : 'Your stats'} • Updates every minute
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSpentHover;
