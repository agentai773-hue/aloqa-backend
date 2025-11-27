# Call Status Polling System - Visual Guide

## How The System Works

### Data Flow Diagram

```
USER MAKES A CALL
        ↓
    ┌───────────────────────────┐
    │ Call Created in Database  │
    │ Status: "queued"          │
    │ Recording: null           │
    └───────────────────────────┘
        ↓                  ↑
        │                  │ (Every 5 seconds)
        ↓                  │
    ┌───────────────────────────┐
    │ Frontend Auto-Refresh     │
    │ Displays status to user   │
    │ Shows "Paused" button     │
    └───────────────────────────┘
        ↑
        │ (Every 30 seconds)
        │
    ┌──────────────────────────────────┐
    │ Backend Polling Service          │
    │ 1. Get pending calls             │
    │ 2. Check Bolna API               │
    │ 3. Extract recording URL         │
    │ 4. Update database               │
    └──────────────────────────────────┘
        ↓
    BOLNA API
    (Returns current call status + recording URL)
```

## Frontend UI Components

### Call History Table

```
┌──────────────────────────────────────────────────────────────┐
│ CALL HISTORY                                                 │
│                                          [Live] [Refresh]    │
├──────────────────────────────────────────────────────────────┤
│ Contact   │ Project │ Status    │ Duration │ Date  │ Record │
├───────────────────────────────────────────────────────────────┤
│ John Doe  │ Real    │ ✓ queued  │ 0m 5s    │ ...   │   -    │
│ +91 ..22  │ Estate  │           │          │       │        │
├───────────────────────────────────────────────────────────────┤
│ Jane Sm   │ Real    │ ✓ queued  │ 1m 10s   │ ...   │  ▶ Pl  │
│ +91 ..31  │ Estate  │           │          │       │        │
└──────────────────────────────────────────────────────────────┘
```

**Buttons:**
- 🔵 **Live** (blue) - Auto-refresh enabled, polling every 5s
- ⚫ **Paused** (gray) - Auto-refresh disabled
- 🔄 **Refresh** - Manual refresh, fetch right now

### Call Details Sidebar

```
┌─────────────────────────────────────┐
│ Call Details                    [✕] │
├─────────────────────────────────────┤
│                                     │
│ CONTACT INFORMATION                 │
│ ├─ Name: John Doe                   │
│ └─ Phone: +91 ..22                  │
│                                     │
│ CALL INFORMATION                    │
│ ├─ Project: Real Estate             │
│ ├─ Status: ✓ queued                 │
│ ├─ Duration: 0m 5s                  │
│ ├─ Started: Nov 27, 2:30 PM        │
│ └─ [⏰ Check Status] (blue button)   │
│                                     │
│ RECORDING (appears when done)       │
│ ├─ [Audio Player]                   │
│ └─ [⬇ Download]                     │
│                                     │
│ TECHNICAL DETAILS                   │
│ ├─ Call ID: abc-123                 │
│ └─ Agent ID: agent-456              │
│                                     │
└─────────────────────────────────────┘
```

## Timeline: What Happens When You Make a Call

```
┌────────────────────────────────────────────────────────────┐
│ TIME │ BACKEND              │ FRONTEND            │ DATABASE │
├──────┼──────────────────────┼────────────────────┼──────────┤
│ T+0s │ Call created         │ Table updated      │ Create   │
│      │ Status: "queued"     │ Shows call         │ queued   │
├──────┼──────────────────────┼────────────────────┼──────────┤
│ T+5s │ (waiting...)         │ Auto-refresh       │ No change│
│      │                      │ Shows: queued      │          │
├──────┼──────────────────────┼────────────────────┼──────────┤
│ T+10 │ (waiting...)         │ Auto-refresh       │ No change│
├──────┼──────────────────────┼────────────────────┼──────────┤
│ T+15 │ (waiting...)         │ Auto-refresh       │ No change│
├──────┼──────────────────────┼────────────────────┼──────────┤
│ T+20 │ (waiting...)         │ Auto-refresh       │ No change│
├──────┼──────────────────────┼────────────────────┼──────────┤
│ T+25 │ (waiting...)         │ Auto-refresh       │ No change│
├──────┼──────────────────────┼────────────────────┼──────────┤
│ T+30 │ POLLING! Checks      │ (waiting for next) │ Updated: │
│      │ Bolna API...         │                    │ ringing  │
│      │ Response: "ringing"  │                    │          │
├──────┼──────────────────────┼────────────────────┼──────────┤
│ T+35 │ (waiting...)         │ Auto-refresh!      │ Shown:   │
│      │                      │ Shows: ringing ✓   │ ringing  │
├──────┼──────────────────────┼────────────────────┼──────────┤
│ T+60 │ POLLING! Checks      │ (waiting...)       │ Updated: │
│      │ Bolna API...         │                    │ connected│
│      │ Response: "connected"│                    │          │
├──────┼──────────────────────┼────────────────────┼──────────┤
│ T+65 │ (waiting...)         │ Auto-refresh!      │ Shown:   │
│      │                      │ Shows: connected ✓ │ connected│
├──────┼──────────────────────┼────────────────────┼──────────┤
│ ...  │ ... (call happening) │ ... (user listens) │ ...      │
├──────┼──────────────────────┼────────────────────┼──────────┤
│ T+5m │ POLLING! Checks      │ (waiting...)       │ Updated: │
│      │ Bolna API...         │                    │ completed│
│      │ Response:            │                    │ recording│
│      │ - Status: completed  │                    │ URL added│
│      │ - Recording URL: ... │                    │          │
├──────┼──────────────────────┼────────────────────┼──────────┤
│ T+5:0│ (waiting...)         │ Auto-refresh!      │ Shown:   │
│ 5m   │                      │ Shows: completed ✓ │ completed│
│      │                      │ [▶ Play] appears   │ recording│
│      │                      │ [⬇ Download] ready │ available│
└──────┴──────────────────────┴────────────────────┴──────────┘
```

## User Actions Available

### 1. Normal Operation (Default)
```
User starts call
        ↓
System automatically:
- Polls every 30 seconds
- Frontend refreshes every 5 seconds
- Displays updates automatically
        ↓
User sees recording within 5-10 minutes
```

### 2. Want to Check Manually?
```
User clicks on a call
        ↓
Sidebar opens (right side)
        ↓
User clicks [⏰ Check Status] button
        ↓
System immediately:
- Calls Bolna API
- Extracts latest data
- Updates sidebar
- Refreshes table
        ↓
User sees result instantly
```

### 3. Want to Disable Auto-Refresh?
```
User clicks [Paused] button
        ↓
Auto-refresh stops (no polling every 5s)
        ↓
User clicks [Refresh] to manually get updates
        ↓
User clicks [Live] to re-enable auto-refresh
```

## Backend Service States

### Running State
```
┌─────────────────────────────────────┐
│ Call Status Polling Service         │
│ Status: RUNNING                     │
├─────────────────────────────────────┤
│ Every 30 seconds:                   │
│ 1. getPendingCalls() from MongoDB   │
│ 2. For each call:                   │
│    - Get user bearer token         │
│    - Call Bolna API                │
│    - Extract data                  │
│    - Update database               │
│ 3. Log results                      │
└─────────────────────────────────────┘
```

### Logs You'll See
```
🚀 Server is running on port 5000
🔄 Initializing call status polling service...
🔄 Starting call status polling service (every 30 seconds)
📞 Polling 3 pending calls for status updates...
✏️ Call abc123 status: queued → connected
✅ Updated call abc123 - Status: connected, Recording: ✗
✏️ Call def456 status: connected → completed
✅ Updated call def456 - Status: completed, Recording: ✓
```

## Database Updates

Each call now has these fields (updated by polling):

```javascript
{
  _id: "...",
  callId: "d74b0829...",
  executionId: "d74b0829...",
  status: "completed",
  
  // Polling updates these:
  recordingUrl: "https://recordings.bolna.ai/...",
  recordingId: "rec-123",
  callDuration: 300,
  phoneNumberId: "+918347506153",
  
  // Polling tracking:
  lastStatusCheck: 2024-11-27T14:35:20.000Z,
  lastStatusCheckResponse: {
    status: "completed",
    recordingUrl: "https://...",
    duration: 300
  },
  
  // When created:
  createdAt: 2024-11-27T14:25:00.000Z,
  updatedAt: 2024-11-27T14:35:20.000Z
}
```

## Polling Algorithm

```
Every 30 seconds:
  1. Get all calls where status IN [initiated, queued, ringing, connected, in-progress]
     → Find 5 pending calls
  
  2. For each pending call:
     a. Get user's Bolna API token
     b. Call Bolna API: GET /executions/{executionId}
     c. Extract from response:
        - New status
        - Recording URL
        - Call duration
        - Phone numbers
     d. Check if status changed
     e. If changed OR has recording_url:
        - Update database
        - Log the change
     f. Handle errors gracefully
  
  3. Done - wait 30 seconds, repeat
```

## Recording URL Journey

```
Call on Bolna
    ↓ (5-10 minutes)
Recording processed
    ↓ (Next 30-second poll)
Bolna API returns recording_url: "https://..."
    ↓ (Polling service)
Database updated with recording URL
    ↓ (Next 5-second frontend refresh)
Frontend fetches updated call
    ↓
User sees [▶ Play] button
    ↓
User can play or download recording ✅
```

## What Makes This Reliable

✅ **Automatic** - No user action needed
✅ **Fallback** - Works even if webhook fails
✅ **Persistent** - Tracks last check time
✅ **Efficient** - Only checks pending calls
✅ **Configurable** - Easy to adjust interval
✅ **Observable** - Detailed logging
✅ **Graceful** - Handles errors well
✅ **Scalable** - Can handle many calls

## Performance Impact

```
Per 30-second cycle with 5 pending calls:
- 5 HTTP calls to Bolna API (typically < 1 second each)
- 1-5 database updates (< 100ms each)
- Minimal CPU usage (async operations)
- No UI blocking
- Backend continues serving other requests
```

---

**Ready to use!** When you start the backend, polling automatically begins. No configuration needed!
