# Bolna Execution API - Setup & Testing Guide

## ✅ What Was Fixed

| Issue | Before | After |
|-------|--------|-------|
| **Phone Number ID** | Always `null` | ✅ Properly stored from assignment |
| **Call ID** | Always `null` | ✅ Fetched from execution details |
| **Recording URL** | Always `null` | ✅ Will come from webhook |
| **Execution Tracking** | Not tracked | ✅ executionId, runId stored |
| **Full Call Data** | Partial response | ✅ Complete execution details |

## 🏗️ New Architecture

```
┌─────────────────────────────────────────────────────────┐
│             CALL INITIATION REQUEST                     │
│         (from /leads or /make-call page)                │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│        callService.initiateCall() or                     │
│        callService.initiateCustomCall()                  │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│   callService.makeCallToBolnaAPI()                       │
│   ┌───────────────────────────────────────────────────┐ │
│   │ bolnaApiService.makeCallToBolna()                 │ │
│   │ → POST /call (to Bolna)                           │ │
│   │ ← Returns: execution_id, run_id, status          │ │
│   └────────────────┬────────────────────────────────┘ │
│                    ↓                                    │
│   ┌───────────────────────────────────────────────────┐ │
│   │ bolnaApiService.fetchExecutionDetails()           │ │
│   │ → GET /executions/{execution_id} (to Bolna)       │ │
│   │ (Retries up to 3 times with 2s delays)            │ │
│   │ ← Returns: call_id, recording_url, duration, etc. │ │
│   └────────────────┬────────────────────────────────┘ │
│                    ↓                                    │
│   ┌───────────────────────────────────────────────────┐ │
│   │ bolnaApiService.extractCallDetailsFromExecution() │ │
│   │ → Parse execution response                        │ │
│   │ ← Returns: Normalized call details                │ │
│   └────────────────┬────────────────────────────────┘ │
│                    ↓                                    │
│   Return: {execution_id, call_id, status,              │
│            executionDetails, callDetails}              │
└──────────────────┬──────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────┐
│     callHistoryService.saveCallHistory()                │
│     ├─ Store: execution_id ✓                            │
│     ├─ Store: call_id ✓                                 │
│     ├─ Store: phone_number_id ✓                         │
│     ├─ Store: execution_details ✓                       │
│     ├─ Store: bolna_response                            │
│     └─ Status: created in database                      │
└──────────────────┬──────────────────────────────────────┘
                   ↓
         Response to Frontend ✓
```

## 📁 Files Changed

### 1. **NEW** → `src/utils/bolnaApi.js`
- **BolnaApiService** class
- 3 main methods:
  - `makeCallToBolna(payload, bearerToken)` - Initial call
  - `fetchExecutionDetails(executionId, bearerToken)` - Get full details
  - `extractCallDetailsFromExecution(executionData)` - Parse response

### 2. **UPDATED** → `src/models/CallHistory.js`
- Added fields:
  - `executionId` - From initial response
  - `runId` - From initial response
  - `executionDetails` - Full execution data
- Added indexes for fast lookups

### 3. **UPDATED** → `src/clients/repositories/callHistoryRepository.js`
- Added methods:
  - `getByExecutionId(executionId)`
  - `getByRunId(runId)`

### 4. **UPDATED** → `src/clients/services/callHistoryService.js`
- Added method: `updateCallWithExecutionDetails(executionId, executionDetails)`
- Updated `saveCallHistory()` to accept execution fields

### 5. **UPDATED** → `src/clients/services/callService.js`
- Imports `bolnaApiService` from utils
- Completely redesigned `makeCallToBolnaAPI()`:
  - Step 1: Call Bolna API (get execution_id)
  - Step 2: Fetch execution details (get call_id, recording, etc)
  - Step 3: Extract and normalize data
  - Step 4: Return comprehensive response
- Updated both `initiateCall()` and `initiateCustomCall()`

## 🚀 How to Test

### Step 1: Ensure Backend is Running
```powershell
cd d:\Aloqa\aloqa-backend
npm start
```

### Step 2: Watch Backend Logs
Look for these console outputs when making a call:
```
✓ Bolna Call Initiation Response: { status: "queued", execution_id: "...", run_id: "..." }
✓ Bolna Execution Details (...): { call_id: "...", status: "connected", ... }
```

### Step 3: Make a Test Call

**Option A - Via Leads Page:**
1. Go to Frontend: `http://localhost:3000/leads`
2. Click phone icon on any lead
3. Backend should log execution API calls

**Option B - Via Make Call Page:**
1. Go to `http://localhost:3000/make-call`
2. Fill form and click "Make Call"
3. Watch backend logs

### Step 4: Verify Database

```bash
# Connect to MongoDB and check
db.callhistories.find().sort({createdAt: -1}).limit(1).pretty()
```

**Look for:**
```javascript
{
  _id: ObjectId("..."),
  executionId: "b2af7ff9-ca6d-45e8-8e14-23c742ea0904", ✓
  callId: "call_123abc", ✓ (should not be null)
  phoneNumberId: ObjectId("..."), ✓ (should not be null)
  executionDetails: { ... }, ✓
  status: "queued" or "connected",
  ...
}
```

### Step 5: Check Call History Page

1. Go to Frontend: `http://localhost:3000/call-history`
2. Should see new call in table
3. Click row to open sidebar
4. Technical details should show non-null values

### Step 6: Wait for Recording (Optional)

If you wait ~5-10 minutes for the call to complete:
1. Bolna webhook triggers
2. Backend receives POST to `/webhook`
3. CallHistory updated with:
   - `status: "completed"`
   - `recordingUrl: "https://..."`
   - `recordingId: "rec-xxx"`
   - `callDuration: 300`
4. Frontend shows play button for recording

## 🔍 Debugging

### Console Logs to Look For

```javascript
// Initial call
"Bolna Call Initiation Response: {
  status: 'queued',
  execution_id: 'b2af7ff9-ca6d-45e8-8e14-23c742ea0904',
  run_id: '...',
  message: 'done'
}"

// Execution fetch attempt
"Execution fetch attempt 1/3 for b2af7ff9-ca6d-45e8-8e14-23c742ea0904"

// Execution details
"Bolna Execution Details (b2af7ff9-...): {
  call_id: 'call_123abc',
  execution_id: '...',
  status: 'connected',
  from_phone_number: '+918347506153',
  recipient_phone_number: '+919876543210',
  duration: 0,
  ...
}"
```

### If Phone Number ID is Still Null

1. Check `getAssignmentForCall()` in callRepository
2. Verify `assignment.phoneId` is being set correctly
3. Check if phoneId is ObjectId vs string

### If Execution Details Not Fetching

1. Check Bolna API bearer token is valid
2. Check network connectivity to `api.bolna.ai`
3. Execution details might take a few seconds to be ready
4. Logs will show "Execution fetch attempt X/3"

### If Call ID Still Null After 3 Retries

1. Check Bolna API response format
2. Try increasing `maxAttempts` or `delay` in `makeCallToBolnaAPI()`
3. Check `extractCallDetailsFromExecution()` parsing logic

## 📊 Expected Data Flow

```
User Action
    ↓
[Frontend] Make Call Form
    ↓
POST /client-call/initiate
    ↓
[Backend] callService.initiateCall()
    ↓
[Bolna] POST /call → execution_id ✓
    ↓
[Bolna] GET /executions/{id} → call_id ✓
    ↓
[Database] CallHistory created with:
    ├─ executionId ✓
    ├─ callId ✓
    ├─ phoneNumberId ✓
    ├─ executionDetails ✓
    └─ Status: initiated/queued
    ↓
[Frontend] Toast: "Call initiated successfully"
    ↓
User navigates to Call History
    ↓
[Database] Query CallHistory
    ↓
[Frontend] Display table with:
    ├─ Contact name
    ├─ Project
    ├─ Duration (from timestamps)
    ├─ Status
    └─ Recording: "-" (waiting for webhook)
    ↓
[Bolna] Call completes, webhook POSTs data
    ↓
[Database] CallHistory updated with:
    ├─ Status: completed
    ├─ RecordingUrl: https://...
    ├─ Duration: 300
    └─ WebhookData: { ... }
    ↓
[Frontend] Refresh shows:
    ├─ Recording: [▶ Play]
    ├─ Duration: 5m 0s
    └─ Status: completed ✓
```

## ⚠️ Known Limitations

1. **Execution Details Fetch** - May not be ready immediately (retry logic handles this)
2. **Recording URL** - Only populated after webhook arrives
3. **Duration** - Calculated from timestamps until webhook updates it
4. **Retry Delay** - 2 second delays between execution fetch retries (total ~4s max)

## ✨ Benefits

- ✅ Complete call data stored immediately
- ✅ Proper phone number tracking
- ✅ Multiple lookup methods (by execution_id, call_id, run_id)
- ✅ Full execution response for debugging
- ✅ Robust retry logic for execution fetch
- ✅ Clean separation of concerns with BolnaApiService

## 📝 Next Steps After Testing

1. ✅ Verify phone number ID is no longer null
2. ✅ Verify call ID is properly populated
3. ✅ Check call history page shows proper data
4. ✅ Wait for webhook to verify recording URL population
5. ✅ Test with multiple calls to ensure consistency
6. ✅ Deploy to production

---

**Ready to test!** 🚀

Run backend and make a test call - all data should now be properly captured.
