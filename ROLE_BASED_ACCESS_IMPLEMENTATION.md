# Role-Based Access Control - Implementation Summary

## Overview
Implemented a complete role-based authentication system with two roles:
- **Factory Admin**: Full access to all features
- **Sales Person**: Can create and view only their own requests

## Database Changes

### New Table: `app_users`
```sql
- email (unique, not null)
- full_name
- role ('factory_admin' or 'sales')
- is_active (boolean)
- created_at, updated_at
```

### Modified Tables
Added `created_by_email` column to all request tables:
- `requests`
- `g24_requests`
- `diving_solution_requests`
- `turney_seat_requests`

This column tracks who created each request, enabling filtered views for sales people.

## Setup Instructions

### 1. Run SQL Setup
Execute `USERS_ROLES_SETUP.sql` in Supabase SQL Editor to:
- Create `app_users` table
- Add `created_by_email` columns to request tables
- Create indexes for performance
- Insert demo accounts

### 2. Demo Accounts
- **admin@gilanimobility.ae** - Factory Admin (full access)
- **sales@gilanimobility.ae** - Sales Person (create + view own)

### 3. Add New Users
Directly in Supabase `app_users` table:
```sql
INSERT INTO app_users (email, full_name, role, is_active)
VALUES ('user@example.com', 'User Name', 'sales', true);
```

### 4. Change User Role
```sql
UPDATE app_users SET role = 'factory_admin' WHERE email = 'user@example.com';
```

## Features by Role

### Factory Admin Can:
✅ View all requests (dashboard with full list)
✅ Create new requests
✅ Edit/update request status
✅ Access Quality Control inspections
✅ Delete requests
✅ See QC status badges
✅ Use all dashboard filters and views

### Sales Person Can:
✅ Create new requests
✅ View ONLY their own requests
✅ See status updates made by admin
❌ Cannot view other people's requests
❌ Cannot edit requests
❌ Cannot access QC inspections
❌ Cannot delete requests

## How It Works

1. **Login**: User enters email → system checks `app_users` table
2. **Session**: Email stored in localStorage, role loaded from database
3. **Request Creation**: `created_by_email` automatically saved with request
4. **Request Loading**: 
   - Factory admin: Fetches ALL requests
   - Sales person: Filters by `created_by_email = userEmail`
5. **UI Adaptation**: Components check `isFactoryAdmin()` to show/hide features

## Code Changes

### New Files
- `/src/contexts/AuthContext.jsx` - Authentication context provider
- `/src/pages/Login.jsx` - Login page
- `/USERS_ROLES_SETUP.sql` - Database setup script

### Modified Files
- `/src/App.jsx` - Added AuthProvider and protected routes
- `/src/pages/RequestJobs.jsx` - Role-based filtering and UI
- `/src/pages/Customer.jsx` - Saves creator email on submission

## Security Notes

- Simple email-based auth (no passwords) - suitable for internal tools
- Row-Level Security (RLS) enabled on `app_users` table
- Request filtering done at query level (database-side)
- LocalStorage used for session persistence
- For production: Consider adding proper authentication (OAuth, JWT, etc.)

## Testing

1. Start app: `npm start`
2. Login as `admin@gilanimobility.ae` - see all requests
3. Create a request - notice it's saved with your email
4. Logout and login as `sales@gilanimobility.ae`
5. Create a request - only see your own requests
6. Admin can see sales person's requests, but not vice versa

## Future Enhancements

- Password authentication
- Email verification
- Password reset flow
- User management UI for admins
- Activity logs
- Request assignment to specific users
