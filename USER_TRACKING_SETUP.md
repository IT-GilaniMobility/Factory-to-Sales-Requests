# User Tracking System - Setup Guide

## Overview
A professional user tracking system has been integrated into your dashboard, providing:
- **Real-time session tracking** - Who's online, when they logged in
- **Active users widget** - Live display of currently active users (admin-only)
- **Time analytics** - Track hours spent per user with filtering (admin-only)
- **Profile header** - Modern dropdown with user info and logout

## Setup Instructions

### 1. Run Database Schema
Execute the SQL schema in your Supabase SQL Editor:

**File:** `USER_TRACKING_SCHEMA.sql`

```bash
# Navigate to: Supabase Dashboard > SQL Editor
# Copy and paste the contents of USER_TRACKING_SCHEMA.sql
# Click "Run" to execute
```

This creates:
- `user_sessions` table (tracks individual login sessions)
- `user_daily_summary` table (aggregates daily stats)
- Indexes for performance
- Row Level Security (RLS) policies
- PostgreSQL functions for cleanup and aggregation

### 2. Verify Tables Created
After running the schema, verify in your Supabase dashboard:
- Table Editor > Check for `user_sessions` and `user_daily_summary`
- Should see proper columns and indexes

### 3. Test the System
1. **Start the app** (if not already running):
   ```bash
   npm start
   ```

2. **Login** to your dashboard
   - Session automatically starts on component mount
   - Check browser console for: `✅ Session started: sess_[timestamp]_[random]`

3. **Check Profile Header** (Top Right)
   - Should see your avatar with initials
   - Click to open dropdown with "Profile" and "Logout"
   - Email displays on desktop, hidden on mobile

4. **Admin Features** (Factory Admin Only)
   - Scroll to bottom of dashboard
   - **Active Users Widget**: Shows who's currently online
     - Updates every 30 seconds
     - "Live" indicator with pulse animation
     - Shows time since last activity
   - **Time Spent Widget**: Analytics with filtering
     - Today / Last 7 Days / Custom date range
     - Table showing: Name, Email, Total Time, Sessions
     - Time displayed in HH:MM:SS format

### 4. Verify Database Tracking
Check your Supabase database:

```sql
-- View active sessions
SELECT * FROM user_sessions 
WHERE logout_time IS NULL 
ORDER BY last_seen DESC;

-- View today's stats
SELECT * FROM user_daily_summary 
WHERE date = CURRENT_DATE
ORDER BY total_seconds DESC;
```

## Features Breakdown

### Session Management
- **Auto-start**: Session begins when user logs into dashboard
- **Heartbeat**: Updates `last_seen` every 20 seconds
- **Auto-cleanup**: Sessions inactive >5 minutes are automatically closed
- **Tab close handling**: Attempts to end session when user closes browser

### Role-Based Access
**Admin Users** (emails: it@, eng@, eng1@gilanimobility.ae):
- See all users in analytics
- View active users widget
- Access time spent widget with all users

**Regular Staff**:
- See only their own profile
- Profile header with logout
- No access to widgets (admin-only)

### Active User Definition
Users are considered "active" if `last_seen` is within **90 seconds** of current time.

### Data Privacy (RLS)
- Admins can view all session data
- Regular users can only view their own sessions
- PostgreSQL RLS enforces these rules at database level

## How It Works

### Session Lifecycle
```
1. User logs in → startSession() creates record in user_sessions
2. Component mounted → Heartbeat starts (every 20s)
3. User active → last_seen updates via heartbeat()
4. User logs out / closes tab → endSession() calculates duration
5. Background cleanup → Stale sessions (>5min) auto-closed
```

### Daily Aggregation
```sql
-- Run daily to aggregate stats
SELECT update_daily_summary(CURRENT_DATE - 1);
```
This aggregates yesterday's sessions into `user_daily_summary` for efficient analytics.

## Troubleshooting

### Session not starting?
**Check browser console** for errors:
- ✅ = Success messages
- ❌ = Error messages

**Common issues:**
1. Database schema not run → Run `USER_TRACKING_SCHEMA.sql`
2. User object missing → Check AuthContext provides `user` with `full_name` and `role`
3. Supabase connection → Verify `.env` has correct credentials

### Widgets not showing?
1. **Admin check**: Widgets only visible to factory admin emails
2. **Database**: Ensure tables exist and RLS policies are active
3. **Console**: Check for fetch errors

### Heartbeat not updating?
- Check browser console for heartbeat errors
- Verify `last_seen` column exists in `user_sessions`
- Ensure session was successfully started

### Sessions not ending on tab close?
**Expected behavior:** Tab close is handled with:
1. `navigator.sendBeacon` (if supported) - sends async request
2. `useEffect` cleanup - runs on unmount
3. Background cleanup function - closes stale sessions after 5min

**Note:** Some browsers may block sendBeacon or cleanup. The 5-minute auto-cleanup ensures orphaned sessions are eventually closed.

## Configuration

### Heartbeat Interval
**Default:** 20 seconds
**Location:** `src/pages/RequestJobs.jsx` line ~650
```javascript
heartbeatIntervalRef.current = setInterval(sendHeartbeat, 20000); // 20 seconds
```

### Active User Timeout
**Default:** 90 seconds
**Location:** `src/utils/userTracking.js` in `getActiveUsers()`
```javascript
.gt('last_seen', new Date(Date.now() - 90000).toISOString())
```

### Auto-Cleanup Timeout
**Default:** 5 minutes
**Location:** `USER_TRACKING_SCHEMA.sql` in `cleanup_stale_sessions()`
```sql
AND last_seen < NOW() - INTERVAL '5 minutes'
```

### Widget Refresh Rate
**Default:** 30 seconds
**Location:** `src/components/ActiveUsersWidget.jsx`
```javascript
const interval = setInterval(fetchActiveUsers, 30000); // 30 seconds
```

## Database Maintenance

### Daily Aggregation (Recommended)
Set up a cron job or Supabase Edge Function to run daily:
```sql
SELECT update_daily_summary(CURRENT_DATE - 1);
```

### Cleanup Old Sessions (Optional)
Keep database lean by archiving old sessions:
```sql
-- Delete sessions older than 90 days
DELETE FROM user_sessions 
WHERE login_time < NOW() - INTERVAL '90 days';

-- Archive instead of delete (better for analytics)
INSERT INTO user_sessions_archive 
SELECT * FROM user_sessions 
WHERE login_time < NOW() - INTERVAL '90 days';

DELETE FROM user_sessions 
WHERE login_time < NOW() - INTERVAL '90 days';
```

## API Reference

### Utility Functions (`src/utils/userTracking.js`)

#### `startSession(params)`
Creates a new session record.
```javascript
const sessionId = await startSession({
  email: 'user@example.com',
  name: 'John Doe',
  role: 'admin',
  page: '/dashboard',
  userAgent: navigator.userAgent
});
```

#### `heartbeat(sessionId)`
Updates last_seen timestamp for active session.
```javascript
await heartbeat(sessionId);
```

#### `endSession(sessionId)`
Closes session and calculates duration.
```javascript
await endSession(sessionId);
```

#### `getActiveUsers()`
Fetches currently active users (last_seen < 90s ago).
```javascript
const activeUsers = await getActiveUsers();
// Returns: [{ email, name, role, lastSeen, secondsAgo }, ...]
```

#### `getUserTimeStats({ startDate, endDate, email })`
Gets time analytics with optional filtering.
```javascript
const stats = await getUserTimeStats({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  email: 'user@example.com' // optional
});
// Returns: { users: [...], totalSeconds: 12345 }
```

#### `getTodayStats(email)`
Shorthand for today's stats only.
```javascript
const today = await getTodayStats('user@example.com');
```

## UI Components

### ProfileHeader
**Location:** Top-right of dashboard
**Features:**
- Avatar with gradient + initials
- Full name + email (responsive)
- Dropdown menu: Profile, Logout
- Click-outside to close

### ActiveUsersWidget
**Admin-only**
**Location:** Bottom of dashboard (left column)
**Features:**
- Auto-refresh every 30s
- Live pulse indicator
- Shows: Avatar, Name, Email, Time ago
- Empty state when no users active

### TimeSpentWidget
**Admin-only (shows all) / Staff (own stats)**
**Location:** Bottom of dashboard (right column)
**Features:**
- Date range filters: Today / Last 7 Days / Custom
- Table: Name, Email, Time (HH:MM:SS), Sessions
- Total time in header
- Loading skeleton

## Security Notes

1. **RLS Enabled**: Row Level Security enforces admin vs user access
2. **Auth Required**: All tracking functions require authenticated user
3. **Email Verification**: Admin status checked via email domain
4. **SQL Injection Protected**: Parameterized queries throughout
5. **Client-side validation**: All inputs sanitized

## Next Steps (Optional Enhancements)

1. **Email Notifications**: Alert admin when new user logs in
2. **Idle Detection**: Pause tracking when user is idle (no mouse/keyboard)
3. **Page-level tracking**: Track which pages users visit most
4. **Export Analytics**: CSV export for time reports
5. **Session history**: View past sessions with timeline
6. **Real-time dashboard**: Use Supabase Realtime for live updates

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify database schema was run successfully
3. Ensure RLS policies are enabled
4. Check Supabase logs for database errors

---

**Implementation Complete! 🎉**
- ✅ Database schema ready
- ✅ Utility functions implemented
- ✅ UI components integrated
- ✅ Session tracking active
- ✅ Admin analytics available
