# Call Status Automatic Polling System

## Overview

The system now automatically polls Bolna every **30 seconds** to check the status of all pending calls. This ensures you always have the latest status and recording URL without relying solely on webhooks.

## How It Works

### 1. **Automatic Background Polling**

When the backend server starts, it automatically begins a polling service that:

- **Runs every 30 seconds** (configurable)
- **Fetches all pending calls** (status: initiated, queued, ringing, connected, in-progress)
- **Checks Bolna API** for the latest status of each call
- **Extracts updated data** including:
  - Current status (queued → connected → in-progress → completed)
  - Recording URL (available when call completes)
  - Call duration
  - Phone numbers
  - Any other updated call details
- **Saves updates to database** automatically

### 2. **Call Status Progression**

```
Call Created
    ↓ (status: initiated)
    ↓ (polling checks Bolna)
    ↓ (status: queued)
    ↓ (polling checks Bolna every 30s)
    ↓ (status: ringing)
    ↓
    ↓ (status: connected)
    ↓
    ↓ (status: in-progress)
    ↓
    ↓ (status: completed)
    ↓ (recording_url: populated)
    ✅ DONE - Recording available
```

### 3. **Frontend Auto-Refresh**

The frontend **also auto-refreshes every 5 seconds** to display the latest data from the database:

```
Frontend (every 5 seconds)
    ↓ Fetches latest calls from API
    ↓ Updates table with new status
    ↓ Updates sidebar if user has it open
```

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Bolna AI API                              │
│  (Maintains actual call state)                               │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │ (Every 30s)
┌─────────────────────────────────────────────────────────────┐
│          Call Status Polling Service (Backend)               │
│  ├─ getPendingCalls() - finds all calls still in progress   │
│  ├─ checkAndUpdateCallStatus() - fetches from Bolna         │
│  └─ Updates database with new data                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
                   MongoDB (Call History)
                              ↑
                              │
┌─────────────────────────────────────────────────────────────┐
│          Frontend Auto-Refresh (Every 5 seconds)             │
│  ├─ Fetches call history from API                           │
│  ├─ Updates table with latest status                        │
│  └─ Updates sidebar details in real-time                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    User sees updates
```

## Files Modified/Created

### Backend Files

**New File: `src/clients/services/callStatusPollingService.js`**
- Automatic polling every 30 seconds
- Fetches pending calls from database
- Calls `checkAndUpdateCallStatus()` for each call
- Handles retries and error logging
- Can be started/stopped gracefully

**Modified: `src/app.js`**
- Imports callStatusPollingService
- Starts polling on server startup
- Stops polling on server shutdown

**Modified: `src/clients/repositories/callRepository.js`**
- Added `getPendingCalls()` - gets all non-completed calls
- Added `getCallById()` - fetches call by ID

**Modified: `src/clients/services/callHistoryService.js`**
- Added `updateCallStatus()` - used by polling service to update call

**Modified: `src/clients/controllers/callHistoryController.js`**
- Added `checkCallStatus()` - manual API endpoint to check status

**Modified: `src/clients/routes/callHistoryRoutes.js`**
- Added POST `/call-history/check-status/:callId` endpoint

**Modified: `src/models/CallHistory.js`**
- Added `lastStatusCheck` (Date) - when status was last checked
- Added `lastStatusCheckResponse` (Mixed) - response from last check
- Added `in-progress` to status enum

### Frontend Files

**Modified: `src/components/call-history/CallHistoryTab.tsx`**
- Added Clock icon import
- Added `isCheckingStatus` state
- Added `checkCallStatus()` function to manually check status
- Added "Check Status" button in sidebar
- Shows loading spinner while checking

## How to Use

### Automatic (Default Behavior)

1. **Start the backend server** → polling service starts automatically
2. **Make a call** → Call created in database
3. **Wait 30 seconds** → Backend checks Bolna
4. **Frontend auto-refreshes every 5 seconds** → User sees updates
5. **Call completes** → Recording URL populates in next poll
6. **User sees status change** within 35 seconds max (30s poll + 5s refresh)

### Manual Check

If you don't want to wait for automatic polling:

1. **Click on a call** in the history table
2. **Click "Check Status"** button in the sidebar
3. **Wait for the check to complete**
4. **Sidebar updates immediately** with latest data
5. **Table also refreshes** to show new status

## Configuration

### Polling Interval

Edit `callStatusPollingService.js` to change the polling interval:

```javascript
// Line 29: Change 30000 to desired milliseconds
this.pollingInterval = setInterval(() => {
  this.pollCallStatuses();
}, 30000); // Change this value (in milliseconds)
```

**Current: 30 seconds** (recommended for production)
**Faster: 10000** (10 seconds - more frequent updates, more API calls)
**Slower: 60000** (60 seconds - fewer API calls, slower updates)

### What Gets Updated

When the polling service finds a call with changed status:

```javascript
{
  status: newStatus,              // e.g., "completed"
  callDuration: duration,          // in seconds
  recordingUrl: recordingUrl,      // Bolna recording URL
  recordingId: recordingId,        // Bolna recording ID
  phoneNumberId: phoneNumberId,    // From number
  recipientPhoneNumber: number,    // To number
  executionDetails: executionData, // Full Bolna response
  lastStatusCheck: currentDate,    // When we checked
  lastStatusCheckResponse: {...}   // What we got back
}
```

## Monitoring

### Backend Logs

The polling service logs everything:

```
📞 Polling 5 pending calls for status updates...
✏️ Call {executionId} status: queued → connected
✅ Updated call {executionId} - Status: connected, Recording: ✗
✏️ Call {executionId} status: connected → completed
✅ Updated call {executionId} - Status: completed, Recording: ✓
```

### Check Last Status Check

In MongoDB, each call now has:
- `lastStatusCheck`: timestamp of last check
- `lastStatusCheckResponse`: what the check returned

## Handling Issues

### Recording URL Still Not Showing?

1. **Wait longer** - Recording takes time to process on Bolna
2. **Check manually** - Click "Check Status" button to force a check
3. **Check logs** - Backend logs show if Bolna returned recording_url
4. **Verify Bolna account** - Make sure recordings are enabled

### Status Not Updating?

1. **Check server is running** - Polling service logs "Starting call status polling service..."
2. **Check bearer token** - User must have Bolna API token configured
3. **Increase polling frequency** - Change 30000 to 10000 in pollInterval
4. **Manual check** - Click "Check Status" button

### Too Many API Calls?

The service only calls Bolna for **pending calls** (not completed/failed). If you have many pending calls:
- Increase polling interval from 30s to 60s
- Or filter out old pending calls

## API Endpoints

### Automatic Updates

**No action needed** - happens every 30 seconds in background

### Manual Status Check

```
POST /api/client-call/call-history/check-status/:callId
Headers: Authorization required
Body: {}

Response:
{
  success: true,
  message: "Call status checked and updated",
  data: {
    _id: "...",
    status: "completed",
    recordingUrl: "https://...",
    callDuration: 300,
    ...
  }
}
```

## Real-World Example

### Scenario: User makes a call

**T+0 seconds:**
- User clicks "Make Call"
- Backend creates call record: status = "queued"
- Frontend shows call immediately

**T+5 seconds:**
- Frontend auto-refreshes
- Shows status = "queued"

**T+30 seconds:**
- Backend polling service checks call
- Bolna returns: status = "connected"
- Backend updates database

**T+35 seconds:**
- Frontend auto-refreshes
- Shows status = "connected"
- Recording URL still null

**T+5 minutes:**
- Call completes on Bolna
- Bolna processing the recording

**T+5:30 minutes:**
- Backend polling checks again
- Bolna returns: status = "completed", recording_url = "https://..."
- Backend saves recording URL

**T+5:35 minutes:**
- Frontend auto-refreshes
- **Shows status = "completed"**
- **Shows [▶ Play] button**
- **User can download/play recording**

## Advantages

✅ **No webhook required** - Works even if webhook fails
✅ **Automatic** - No user action needed
✅ **Real-time** - Updates within 30-35 seconds
✅ **Manual override** - Click "Check Status" to force immediate check
✅ **Graceful** - Only checks pending calls
✅ **Persistent** - Logs last check for debugging
✅ **Configurable** - Easy to adjust polling interval
✅ **Scalable** - Can handle many concurrent calls

## Technical Details

### Why 30 Seconds?

- **Fast enough**: Users see updates within 1 minute
- **Efficient**: 30s = ~2880 calls/day per call = reasonable API load
- **Practical**: Records processing takes time anyway
- **Configurable**: Easy to change if needed

### Why Also 5-Second Frontend Refresh?

- **Frontend aware**: Updates show in UI quickly
- **Database-driven**: No API calls, just database queries
- **User feedback**: User sees progress even if Bolna hasn't responded yet

### Database Impact

- Minimal: Only updates 1-2 records per 30 seconds
- Indexed: Uses existing executionId and callId indexes
- Efficient: Lean queries where possible

## Future Enhancements

Possible improvements:

1. **Event-driven instead of polling** - Use Socket.io for real-time updates
2. **Webhook + polling fallback** - Webhook primary, polling as backup
3. **Configurable per user** - Let users adjust polling interval
4. **Call-specific checks** - Check only high-priority calls more often
5. **Recording progress tracking** - Show "Recording processing..." status

---

**Status**: ✅ Complete and running automatically on server startup
