# Call Status & Recording URL - Complete Flow

## How It Works End-to-End

### Phase 1: Call Initiated (T+0)

```
User clicks "Make Call"
    ↓
POST /client-call/initiate
    ↓
Backend: callService.initiateCall()
├─ Step 1: POST https://api.bolna.ai/call
│         → Bolna returns: execution_id, run_id, status: "queued"
│
├─ Step 2: GET https://api.bolna.ai/executions/{execution_id}
│         → Bolna returns: full execution details (still status: "queued")
│
├─ Step 3: Extract call data from execution
│         → callId, phoneNumberId, duration (0), recording_url (null)
│
└─ Step 4: Save to database
          ├─ callId: "d74b0829-dc3f-4a42-8bd3-8a43f7efabe7" ✓
          ├─ executionId: "d74b0829-dc3f-4a42-8bd3-8a43f7efabe7" ✓
          ├─ status: "queued" ✓
          ├─ phoneNumberId: "+918347506153" ✓
          ├─ recordingUrl: null (waiting for webhook)
          └─ executionDetails: { full execution data }

Frontend receives response ✓
```

**Database state at this point:**
```javascript
{
  callId: "d74b0829-dc3f-4a42-8bd3-8a43f7efabe7",
  executionId: "d74b0829-dc3f-4a42-8bd3-8a43f7efabe7",
  status: "queued",
  phoneNumberId: "+918347506153",
  recordingUrl: null,
  callDuration: 0
}
```

---

### Phase 2: Call In Progress (T+1min to T+5min)

```
Bolna is connecting the call and recording it...

Frontend: Call History page
├─ Auto-refresh every 5 seconds (can be toggled)
├─ Shows latest status from database
├─ Duration calculated from timestamps
└─ Recording: Shows "-" (not available yet)

Database: NO CHANGES (waiting for Bolna to complete call)
```

---

### Phase 3: Call Completed (T+5min+)

```
Bolna completes the call...

Bolna → POST /api/client-call/call-history/webhook
        ├─ Contains: execution_id, status: "completed"
        ├─ Contains: telephony_data.recording_url
        └─ Contains: conversation_duration
    ↓
Backend: callHistoryController.handleCallWebhook()
├─ Extract callId or executionId
├─ Look up call in database
├─ Extract recording_url from:
│  ├─ webhookData.telephony_data.recording_url
│  └─ webhookData.recording_url (fallback)
│
└─ Update database:
   callHistoryService.updateCallWithWebhookData()
   ├─ status: "completed"
   ├─ recordingUrl: "https://recordings.bolna.ai/..."
   ├─ callDuration: 300 (seconds)
   └─ webhookData: { full webhook data }
    ↓
Database updated ✓
```

**Database state after webhook:**
```javascript
{
  callId: "d74b0829-dc3f-4a42-8bd3-8a43f7efabe7",
  executionId: "d74b0829-dc3f-4a42-8bd3-8a43f7efabe7",
  status: "completed",        // ← Updated by webhook
  phoneNumberId: "+918347506153",
  recordingUrl: "https://recordings.bolna.ai/call-123abc.mp3",  // ← Updated by webhook
  recordingId: "rec-123",
  callDuration: 300,          // ← Updated by webhook
  webhookData: { full webhook response }
}
```

---

### Phase 4: Frontend Updates (Automatic)

```
Frontend: Auto-refresh (every 5 seconds)
    ↓
useCallHistory hook refetches from API
    ↓
GET /api/client-call/call-history
    ↓
Backend returns latest call data from database
    ↓
Frontend: Call History Table
├─ Status: "completed" (green badge)
├─ Duration: "5m 0s"
├─ Recording: [▶ Play] button appears
└─ Sidebar auto-updates with new recording URL

User can now:
✓ See call is completed
✓ See actual duration
✓ Play the recording
```

---

## Frontend Changes Made

### 1. Auto-Refresh Feature
```typescript
// New: Automatically refetch every 5 seconds
useEffect(() => {
  if (!autoRefresh) return;
  
  const interval = setInterval(() => {
    refetch?.();
  }, 5000); // Every 5 seconds
  
  return () => clearInterval(interval);
}, [autoRefresh, refetch]);
```

### 2. Auto-Update Selected Call
```typescript
// New: If user has sidebar open, automatically update it with new data
useEffect(() => {
  if (selectedCall && calls.length > 0) {
    const updatedCall = calls.find(c => c._id === selectedCall._id);
    if (updatedCall) {
      setSelectedCall(updatedCall);  // Update sidebar automatically
    }
  }
}, [calls, selectedCall]);
```

### 3. Refresh Controls
```typescript
// New buttons added to header:
- "Live" / "Paused" button (toggle auto-refresh)
- "Refresh" button (manual refresh)
```

---

## Backend Changes Made

### 1. Enhanced Webhook Handler
```javascript
// Now handles multiple response formats from Bolna
- Looks for callId in multiple fields
- Looks for executionId as fallback
- Logs webhook receipt for debugging
- Tries updating by callId first, then executionId
```

### 2. Improved Recording URL Extraction
```javascript
// Extracts recording_url from:
- webhookData.telephony_data.recording_url (primary)
- webhookData.recording_url (fallback)

// Extracts duration from:
- webhookData.telephony_data.duration
- webhookData.duration
- webhookData.conversation_duration
```

---

## Summary Table

| Phase | Time | Status | Recording URL | Duration | User Sees |
|-------|------|--------|---------------|----------|-----------|
| **Initiated** | T+0 | queued | null | 0-5s | Call in table, no recording |
| **In Progress** | T+1m | queued | null | calculated | Same, auto-refreshing |
| **Completing** | T+5m | in-progress | null | calculated | Same |
| **Completed** | T+5m+ | completed | ✓ URL | actual | Play button appears |

---

## What Happens When Call Completes

### Backend Flow:
```
1. Bolna completes call
2. Bolna POSTs webhook to our /webhook endpoint
3. Our webhook handler updates the database
4. All recording data is now in database
```

### Frontend Flow:
```
1. Auto-refresh runs (every 5 seconds)
2. Fetches latest call data from API
3. Shows updated status in table
4. Updates sidebar if user has it open
5. Recording play button becomes available
```

---

## Manual Refresh Option

If user doesn't want auto-refresh:
- Click "Paused" button to disable auto-refresh
- Click "Refresh" button to manually fetch latest data
- Click "Live" button to re-enable auto-refresh

---

## Key Points

✅ **Call initiated immediately** - User sees in table right away  
✅ **Status updates from Bolna webhook** - No polling needed  
✅ **Recording URL arrives in webhook** - Not available until call completes  
✅ **Frontend auto-refreshes** - Keeps data in sync every 5 seconds  
✅ **Can be disabled** - Toggle between Live and Paused mode  
✅ **Sidebar updates automatically** - If user has it open  

---

## Testing the Flow

### Step 1: Make a Call
- Go to `/make-call` or click phone icon on `/leads`
- Watch call appear in `/call-history` immediately
- Status should be "queued" or "initiated"
- Recording should show "-"

### Step 2: Wait for Call to Complete
- Leave the browser open
- Auto-refresh enabled (Live mode)
- Watch the page update automatically

### Step 3: Call Completes (Bolna webhook)
- Backend logs show webhook received
- Database updated with status, recording URL, duration
- Frontend auto-refresh picks it up
- Table updates: status → "completed", recording → [▶ Play]

### Step 4: View Recording
- Click row to open sidebar
- Click [▶ Play] button
- Recording should play

---

## If Recording Not Showing

### Check:
1. **Webhook received?** → Backend logs should show webhook
2. **Database updated?** → Check MongoDB for recordingUrl
3. **Frontend refreshed?** → Check network requests for GET /call-history
4. **Recording exists in Bolna?** → Check Bolna dashboard

### Common Issues:
- Webhook URL not set in Bolna → No webhook arrives
- Wrong callId format → Webhook doesn't find record
- Frontend not auto-refreshing → Manually click Refresh
- Recording still processing → Wait a few more seconds

---

**Status**: ✅ Complete implementation ready
