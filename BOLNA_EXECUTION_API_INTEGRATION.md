# Call History - Bolna Execution API Integration

## Problem Statement

Previously:
- Bolna API returns `execution_id` in the initial response, NOT `call_id`
- We were trying to extract `call_id` directly, which resulted in `null`
- Phone number ID was not being properly stored
- Recording URL was `null` because we didn't fetch full execution details

## Solution

Implemented a two-step Bolna API interaction:

1. **Initial Call** → `POST /call` → Returns `execution_id`
2. **Fetch Details** → `GET /executions/{execution_id}` → Returns full call data including `call_id`, `recording_url`

## Architecture Changes

### New File: `src/utils/bolnaApi.js`

**BolnaApiService** - Centralized Bolna API interactions

```typescript
class BolnaApiService {
  // Fetch execution details from Bolna
  fetchExecutionDetails(executionId, bearerToken)
  
  // Make initial call to Bolna
  makeCallToBolna(payload, bearerToken)
  
  // Extract call details from execution response
  extractCallDetailsFromExecution(executionData)
}
```

### Updated: `src/models/CallHistory.js`

Added new fields:
```javascript
{
  executionId: String,        // From initial response
  runId: String,              // From initial response
  executionDetails: Mixed,    // Full execution data
}
```

Added indexes:
```javascript
callHistorySchema.index({ executionId: 1 });
callHistorySchema.index({ runId: 1 });
```

### Updated: `src/clients/repositories/callHistoryRepository.js`

New methods:
```javascript
async getByExecutionId(executionId)
async getByRunId(runId)
```

### Updated: `src/clients/services/callHistoryService.js`

New method:
```javascript
async updateCallWithExecutionDetails(executionId, executionDetails)
```

### Updated: `src/clients/services/callService.js`

**makeCallToBolnaAPI()** - Now performs both steps:

```javascript
Step 1: Call bolnaApiService.makeCallToBolna()
        ├─ Returns: execution_id, run_id, status, initial response
        
Step 2: Call bolnaApiService.fetchExecutionDetails() 
        ├─ Retries up to 3 times with 2s delay
        ├─ Returns: Full execution data with call_id, recording_url, duration, etc.
        
Step 3: Extract details with extractCallDetailsFromExecution()
        ├─ Returns: call_id, execution_id, status, recording_url, duration, phone numbers
        
Step 4: Return combined response to caller
        ├─ execution_id ✓
        ├─ call_id ✓
        ├─ status ✓
        ├─ executionDetails ✓
        ├─ callDetails ✓
```

## Data Flow

### Call Initiation Flow

```
Frontend/Mobile
      ↓
POST /make-call
      ↓
callService.initiateCall()
      ↓
makeCallToBolnaAPI()
    ├─ POST https://api.bolna.ai/call
    │   Response: {execution_id, run_id, status: "queued"}
    │
    ├─ GET https://api.bolna.ai/executions/{execution_id}
    │   (Retry up to 3 times if not ready)
    │   Response: {call_id, status, phone_numbers, duration, recording_url, etc.}
    │
    └─ Return: {execution_id, call_id, status, executionDetails}
      ↓
callHistoryService.saveCallHistory()
      ├─ Store: executionId, callId, status, executionDetails, phoneNumberId
      └─ Database: CallHistory document created
      ↓
Response to Frontend: {execution_id, call_id, status}
```

### Webhook Update Flow (When Bolna Completes Call)

```
Bolna Webhook
      ↓
POST /client-call/call-history/webhook
      ↓
callHistoryController.handleCallWebhook()
      ├─ Look up by callId
      └─ Update: status, duration, recordingUrl, recordingId
      ↓
callHistoryService.updateCallWithWebhookData()
      ↓
Database: CallHistory updated with recording details
```

## Response Examples

### Bolna Initial Response
```json
{
  "status": "queued",
  "message": "done",
  "execution_id": "b2af7ff9-ca6d-45e8-8e14-23c742ea0904",
  "run_id": "b2af7ff9-ca6d-45e8-8e14-23c742ea0904"
}
```

### Bolna Execution Details Response
```json
{
  "call_id": "call_123abc",
  "execution_id": "b2af7ff9-ca6d-45e8-8e14-23c742ea0904",
  "status": "connected",
  "from_phone_number": "+918347506153",
  "recipient_phone_number": "+919876543210",
  "duration": 120,
  "recording_url": "https://recordings.bolna.ai/rec-456.mp3",
  "recording_id": "rec-456",
  "agent_id": "agent_xyz",
  ... // other fields
}
```

### Our Internal Response (from makeCallToBolnaAPI)
```json
{
  "success": true,
  "executionId": "b2af7ff9-ca6d-45e8-8e14-23c742ea0904",
  "runId": "b2af7ff9-ca6d-45e8-8e14-23c742ea0904",
  "callId": "call_123abc",
  "status": "connected",
  "executionDetails": { ... full details ... },
  "callDetails": {
    "callId": "call_123abc",
    "executionId": "...",
    "status": "connected",
    "recordingUrl": "https://...",
    "recordingId": "rec-456",
    "duration": 120,
    "phoneNumberId": "+918347506153",
    "recipientPhoneNumber": "+919876543210"
  },
  "initialResponse": { ... initial response ... }
}
```

### Database Document (CallHistory)
```json
{
  "_id": "Object ID",
  "userId": "user_id",
  "leadId": "lead_id",
  "assistantId": "assistant_id",
  "phoneNumberId": "phone_number_object_id", ✓ Fixed!
  "callId": "call_123abc",
  "executionId": "b2af7ff9-ca6d-45e8-8e14-23c742ea0904", ✓ New!
  "runId": "b2af7ff9-ca6d-45e8-8e14-23c742ea0904",
  "status": "connected",
  "recipientPhoneNumber": "+919876543210",
  "recordingUrl": "https://recordings.bolna.ai/rec-456.mp3", ✓ Will be populated by webhook
  "recordingId": "rec-456",
  "callDuration": 120,
  "executionDetails": { ... full execution response ... }, ✓ New!
  "bolnaResponse": { ... initial response ... },
  "webhookData": { ... webhook data when arrives ... },
  "createdAt": "2025-11-27T10:05:00Z",
  "updatedAt": "2025-11-27T10:05:00Z"
}
```

## Retry Logic

The execution details endpoint is called with retry logic:

```javascript
// Max 3 attempts with 2-second delays between retries
Attempt 1: Immediate fetch
Attempt 2: Wait 2s, then fetch
Attempt 3: Wait 2s, then fetch

// If all 3 fail, continues with whatever data is available
```

This ensures we get execution details if available, but doesn't block call initiation if the API is slow.

## Testing Steps

1. **Start Backend**
   ```bash
   cd d:\Aloqa\aloqa-backend
   npm start
   ```

2. **Make a Test Call**
   - Go to frontend: `/make-call` or `/leads` (click phone icon)
   - Observe console logs:
     ```
     Bolna Call Initiation Response: { execution_id, run_id, status }
     Bolna Execution Details (execution_id): { call_id, status, ... }
     ```

3. **Check Database**
   ```javascript
   // In MongoDB
   db.callhistories.find({}).pretty()
   
   // Should see:
   {
     executionId: "b2af7ff9...", ✓
     callId: "call_123abc", ✓
     phoneNumberId: ObjectId("..."), ✓
     executionDetails: { ... }, ✓
   }
   ```

4. **Check Call History Page**
   - Navigate to `/call-history`
   - Should see:
     - Duration: Shows elapsed time
     - Recording: Shows "-" until webhook arrives
     - Status: Shows initial status from Bolna

5. **Wait for Webhook**
   - Bolna webhook POSTs to backend when call completes
   - Updates: status, duration, recordingUrl, recordingId
   - Frontend refreshes to show recording playback option

## Benefits

✅ **Complete Call Data** - We get full execution details, not just initial response
✅ **Proper Phone Numbers** - phoneNumberId stored correctly
✅ **Recording URLs** - Will be populated when execution completes
✅ **Execution Tracking** - Can track by execution_id or run_id
✅ **Debugging** - Full execution details stored for troubleshooting
✅ **Flexible** - Handles different Bolna response formats

## Files Modified

1. **New**: `src/utils/bolnaApi.js` - Bolna API service
2. **Updated**: `src/models/CallHistory.js` - Added execution fields
3. **Updated**: `src/clients/repositories/callHistoryRepository.js` - Added lookup methods
4. **Updated**: `src/clients/services/callHistoryService.js` - Added execution update method
5. **Updated**: `src/clients/services/callService.js` - Complete redesign of API interaction

## Rollback Instructions

If needed, revert to previous approach by:
1. Remove `src/utils/bolnaApi.js`
2. Restore `callService.js` to direct axios call (older version)
3. Remove executionId, runId, executionDetails from CallHistory model

---

**Status**: ✅ Implementation Complete
**Testing**: Ready for manual testing
**Production**: Ready after successful testing
