/**
 * User Session Tracking Utilities
 * Tracks user login/logout times, active users, and time spent analytics
 */

import { supabase } from '../lib/supabaseClient';

// Generate unique session ID
export const generateSessionId = () => {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Format seconds to HH:MM:SS
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Start a new user session
 * @param {Object} meta - Session metadata {email, name, role, page, userAgent}
 * @returns {Promise<string>} sessionId
 */
export const startSession = async (meta) => {
  try {
    const sessionId = generateSessionId();
    const { email, name, role, page, userAgent } = meta;

    const { error } = await supabase
      .from('user_sessions')
      .insert([{
        session_id: sessionId,
        email,
        name,
        role,
        login_time: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        page: page || window.location.pathname,
        user_agent: userAgent || navigator.userAgent
      }]);

    if (error) {
      console.error('❌ Error starting session:', error);
      throw error;
    }

    console.log('✅ Session started:', sessionId);
    return sessionId;
  } catch (error) {
    console.error('Error in startSession:', error);
    throw error;
  }
};

/**
 * Update last_seen timestamp (heartbeat)
 * @param {string} sessionId
 */
export const heartbeat = async (sessionId) => {
  if (!sessionId) return;

  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ last_seen: new Date().toISOString() })
      .eq('session_id', sessionId);

    if (error) {
      console.error('❌ Heartbeat error:', error);
    }
  } catch (error) {
    console.error('Error in heartbeat:', error);
  }
};

/**
 * End user session
 * @param {string} sessionId
 */
export const endSession = async (sessionId) => {
  if (!sessionId) return;

  try {
    const now = new Date().toISOString();

    // Get session to calculate duration
    const { data: session, error: fetchError } = await supabase
      .from('user_sessions')
      .select('login_time')
      .eq('session_id', sessionId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching session:', fetchError);
      return;
    }

    const durationSeconds = Math.floor(
      (new Date(now) - new Date(session.login_time)) / 1000
    );

    const { error } = await supabase
      .from('user_sessions')
      .update({
        logout_time: now,
        duration_seconds: durationSeconds
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('❌ Error ending session:', error);
    } else {
      console.log('✅ Session ended:', sessionId, `(${formatDuration(durationSeconds)})`);
    }
  } catch (error) {
    console.error('Error in endSession:', error);
  }
};

/**
 * Get currently active users (last_seen within 90 seconds)
 * @returns {Promise<Array>} List of active users
 */
export const getActiveUsers = async () => {
  try {
    // First cleanup stale sessions
    await supabase.rpc('cleanup_stale_sessions');

    const ninetySecondsAgo = new Date(Date.now() - 90000).toISOString();

    const { data, error } = await supabase
      .from('user_sessions')
      .select('email, name, role, last_seen, session_id')
      .is('logout_time', null)
      .gte('last_seen', ninetySecondsAgo)
      .order('last_seen', { ascending: false });

    if (error) {
      console.error('❌ Error fetching active users:', error);
      return [];
    }

    // Calculate seconds ago for each user
    const now = Date.now();
    return data.map(user => ({
      ...user,
      secondsAgo: Math.floor((now - new Date(user.last_seen).getTime()) / 1000)
    }));
  } catch (error) {
    console.error('Error in getActiveUsers:', error);
    return [];
  }
};

/**
 * Get user time statistics
 * @param {Object} options - {startDate, endDate, email}
 * @returns {Promise<Object>} Time stats
 */
export const getUserTimeStats = async (options = {}) => {
  try {
    const { startDate, endDate, email } = options;

    // Cleanup stale sessions first
    await supabase.rpc('cleanup_stale_sessions');

    let query = supabase
      .from('user_sessions')
      .select('email, name, role, login_time, duration_seconds')
      .not('duration_seconds', 'is', null);

    // Apply filters
    if (startDate) {
      query = query.gte('login_time', new Date(startDate).toISOString());
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte('login_time', endOfDay.toISOString());
    }
    if (email) {
      query = query.eq('email', email);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching time stats:', error);
      return { users: [], total: 0 };
    }

    // Aggregate by user
    const userStats = {};
    let totalSeconds = 0;

    data.forEach(session => {
      if (!userStats[session.email]) {
        userStats[session.email] = {
          email: session.email,
          name: session.name || session.email,
          role: session.role,
          totalSeconds: 0,
          sessionsCount: 0
        };
      }
      userStats[session.email].totalSeconds += session.duration_seconds;
      userStats[session.email].sessionsCount += 1;
      totalSeconds += session.duration_seconds;
    });

    return {
      users: Object.values(userStats).sort((a, b) => b.totalSeconds - a.totalSeconds),
      totalSeconds
    };
  } catch (error) {
    console.error('Error in getUserTimeStats:', error);
    return { users: [], total: 0 };
  }
};

/**
 * Get today's stats for current user
 * @param {string} email
 * @returns {Promise<Object>}
 */
export const getTodayStats = async (email) => {
  const today = new Date().toISOString().split('T')[0];
  return getUserTimeStats({ startDate: today, endDate: today, email });
};
