import React, { useState, useEffect, useRef } from 'react';
import { FiUsers } from 'react-icons/fi';
import { getActiveUsers } from '../utils/userTracking';

const ActiveUsersHover = () => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const fetchActiveUsers = async () => {
    try {
      const users = await getActiveUsers();
      setActiveUsers(users || []);
    } catch (error) {
      console.error('❌ Failed to fetch active users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveUsers();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActiveUsers, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const getInitials = (name, email) => {
    if (name && name !== email) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  const getGradient = (str) => {
    const gradients = [
      'from-blue-500 to-purple-500',
      'from-green-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-blue-500',
      'from-yellow-500 to-orange-500',
    ];
    const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onMouseEnter={() => setShowDropdown(true)}
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        title="Active Users"
      >
        <FiUsers size={20} />
        {activeUsers.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {activeUsers.length}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          onMouseLeave={() => setShowDropdown(false)}
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 text-white">
            <div className="flex items-center gap-2">
              <FiUsers size={18} />
              <h3 className="font-semibold">Active Users</h3>
              <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {activeUsers.length} online
              </span>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : activeUsers.length === 0 ? (
              <div className="p-6 text-center">
                <FiUsers className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No active users at the moment
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {activeUsers.map((user, idx) => (
                  <div
                    key={idx}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradient(user.email)} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                        {getInitials(user.name, user.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          <span className="text-xs text-green-600 dark:text-green-400">
                            {user.secondsAgo < 30 ? 'Active now' : `${user.secondsAgo}s ago`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-2 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Updates every 30 seconds
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveUsersHover;
