import React, { useState, useEffect } from 'react';
import { FiUsers, FiClock } from 'react-icons/fi';
import { getActiveUsers } from '../utils/userTracking';

/**
 * ActiveUsersWidget - Shows currently active users in real-time
 * Only visible to admins
 */
const ActiveUsersWidget = () => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch active users
  const fetchActive = async () => {
    try {
      const users = await getActiveUsers();
      setActiveUsers(users);
    } catch (error) {
      console.error('Error fetching active users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchActive();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchActive, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get initials
  const getInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Format time ago
  const formatTimeAgo = (seconds) => {
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <FiUsers className="text-green-600 dark:text-green-400 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Active Users
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activeUsers.length} online now
            </p>
          </div>
        </div>
        
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
        </div>
      </div>

      {/* Active Users List */}
      {activeUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FiUsers className="mx-auto text-4xl mb-2 opacity-50" />
          <p className="text-sm">No active users</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activeUsers.map((user, index) => (
            <div
              key={user.session_id || index}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {getInitials(user.name, user.email)}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>

              {/* Activity Indicator */}
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                <FiClock className="text-green-500" />
                <span>{formatTimeAgo(user.secondsAgo)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh notice */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
        Auto-refreshes every 30s
      </p>
    </div>
  );
};

export default ActiveUsersWidget;
