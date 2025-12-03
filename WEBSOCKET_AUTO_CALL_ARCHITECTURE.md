# WebSocket-Driven Auto-Call Architecture

## Overview
Complete WebSocket-based system for real-time lead calling and status updates.

## Flow

### 1. **User Login → WebSocket Connect**
- User logs in with credentials
- Frontend gets JWT token
- WebSocket connects using token (authentication via JWT in socket handshake)
- Server verifies token and joins user to room: `user_{userId}`
- ✅ **Result**: Real-time connection established

### 2. **Leads Loaded → Auto-Call Triggered**
- User navigates to leads page
- Frontend fetches leads from API (`/api/leads`)
- When leads arrive, frontend emits `leads:fetched` event via WebSocket
- Backend receives `leads:fetched` event
- Backend automatically processes pending leads:
  - Filters leads with `call_status = pending` AND `has_been_called = false`
  - Calls each lead ONLY ONCE (via `has_been_called` flag)
  - Uses per-lead locking to prevent concurrent calls to same lead
  - Uses per-user locking to prevent concurrent auto-call runs
- ✅ **Result**: Auto-call triggered without button, leads called automatically

### 3. **Duplicate Prevention**
- Each lead has `has_been_called` flag (initially false/undefined)
- When lead is successfully called:
  - Flag is set to `true` in database (atomic operation)
  - Flag prevents future calls to same lead
  - Works across server restarts and page reloads
- ✅ **Result**: Each lead called exactly once, ever

### 4. **Real-Time Status Updates**
- Backend emits WebSocket events when:
  - Call starts: `call:started`
  - Call status changes: `call:status_updated`
  - Call completes: `call:completed`
- Frontend listeners receive events and update UI instantly
- ✅ **Result**: Status changes immediately (Connected → Completed)

### 5. **User Logout → WebSocket Disconnect**
- User logs out
- WebSocket connection closes
- Socket leaves user room
- ✅ **Result**: Clean disconnect, no lingering connections

## Files Modified

### Backend
- **NEW**: `src/clients/websocket/services/autoCallWebSocketService.js`
  - Listens for `leads:fetched` event
  - Processes pending leads for auto-call
  - Implements dual-level locking (per-user, per-lead)
  - Calls leads via `callService.initiateCall()`
  - Emits WebSocket events for status updates

- **MODIFIED**: `src/clients/websocket/handlers/connectionHandler.js`
  - Registers auto-call listeners when socket connects
  - Calls `autoCallWebSocketService.registerAutoCallListeners()`

### Frontend
- **MODIFIED**: `src/app/(dashboard)/leads/page.tsx`
  - Added `useEffect` to emit `leads:fetched` when leads load
  - Removed auto-call button logic

- **MODIFIED**: `src/components/providers/WebSocketProvider.tsx`
  - Exposes socket instance globally as `window.__socket`
  - Allows components to emit custom WebSocket events

## Key Features

✅ **Fully WebSocket-driven**
- No polling, no cron jobs for user-triggered actions
- Real-time event-driven architecture

✅ **Automatic auto-call**
- Triggers when leads arrive
- No button needed
- Runs in background

✅ **Duplicate prevention**
- `has_been_called` flag is permanent
- Each lead called exactly once
- Works across restarts and page reloads

✅ **Real-time updates**
- Call status changes instantly
- No page refresh needed
- WebSocket listeners update table

✅ **Proper locking**
- Per-user lock: Only one auto-call run at a time
- Per-lead lock: No concurrent calls to same lead
- Prevents race conditions

## Testing

1. **Login to system**
   - WebSocket connects automatically
   - Check browser console: "✅ WebSocket Provider connected"
   - Check backend console: "✅ Socket authenticated"

2. **Navigate to leads page**
   - Frontend loads leads
   - Check browser console: "📡 [Emit] leads:fetched - X leads loaded"
   - Check backend console:
     ```
     📡 [WebSocket Event] leads:fetched received
     🔵 AUTO-CALL STARTED FOR PENDING LEADS
     ✅ Found X pending leads to call
     📱 Calling: [Lead Name]
     🔒 LOCKED lead [ID]
     ✅ Call initiated
     🔓 UNLOCKED lead [ID]
     ```

3. **Monitor real-time updates**
   - Call status changes in real-time
   - Table updates without page refresh
   - Check backend for WebSocket event emissions

4. **Logout**
   - WebSocket disconnects
   - Socket leaves user room
   - Connection closes cleanly

## Architecture Diagram

```
LOGIN
  ↓
[JWT Token]
  ↓
WebSocket Connect (with JWT auth)
  ↓
User joins room: user_{userId}
  ↓
NAVIGATE TO LEADS PAGE
  ↓
Frontend fetches leads
  ↓
Leads arrive (pending status)
  ↓
Frontend emits: leads:fetched
  ↓
Backend receives leads:fetched
  ↓
Filter pending leads (call_status=pending, has_been_called=false)
  ↓
For each pending lead:
  - Lock lead (prevent concurrent calls)
  - Call lead via callService.initiateCall()
  - Mark has_been_called = true (atomic)
  - Unlock lead
  - Emit call:started event
  ↓
Polling detects call completion
  ↓
Emit call:status_updated event
  ↓
Frontend listener receives event
  ↓
Update table instantly (no page refresh)
  ↓
LOGOUT
  ↓
WebSocket disconnect
  ↓
Socket leaves room
```

## Security

- ✅ JWT authentication on WebSocket connection
- ✅ User isolation via rooms (user_{userId})
- ✅ No data leakage between users
- ✅ Token verification on every connection

## Performance

- ✅ No polling (event-driven)
- ✅ Real-time updates via WebSocket
- ✅ Minimal database queries
- ✅ Efficient locking mechanism
- ✅ No race conditions
