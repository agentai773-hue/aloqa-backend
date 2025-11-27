# Bolna API - Quick Reference

## Bolna's Two-Step API Process

### Step 1: Initiate Call
**Endpoint**: `POST https://api.bolna.ai/call`

**Request**:
```javascript
{
  agent_id: "agent_xyz",
  recipient_phone_number: "+919876543210",
  from_phone_number: "+918347506153",
  scheduled_at: null,
  user_data: { ... }
}
```

**Response**:
```javascript
{
  status: "queued",
  message: "done",
  execution_id: "b2af7ff9-ca6d-45e8-8e14-23c742ea0904",  // ← USE THIS
  run_id: "b2af7ff9-ca6d-45e8-8e14-23c742ea0904"
}
```

### Step 2: Fetch Execution Details
**Endpoint**: `GET https://api.bolna.ai/executions/{execution_id}`

**Request**: 
```javascript
Headers: {
  Authorization: Bearer {TOKEN}
}
```

**Response**:
```javascript
{
  call_id: "call_123abc",              // ← WE NEED THIS
  execution_id: "b2af7ff9-...",
  status: "connected",
  from_phone_number: "+918347506153",
  recipient_phone_number: "+919876543210",
  duration: 45,
  recording_url: "https://recordings.bolna.ai/rec-456.mp3",  // ← WE NEED THIS
  recording_id: "rec-456",
  agent_id: "agent_xyz",
  ... other fields ...
}
```

## Our Implementation

### BolnaApiService
```javascript
// Location: src/utils/bolnaApi.js

const bolnaApiService = require('../../utils/bolnaApi');

// 1. Make initial call
const response1 = await bolnaApiService.makeCallToBolna(payload, bearerToken);
// Returns: { executionId, runId, status, initialResponse }

// 2. Fetch execution details
const response2 = await bolnaApiService.fetchExecutionDetails(
  response1.executionId, 
  bearerToken
);
// Returns: { success, data: { call_id, recording_url, ... } }

// 3. Extract details
const details = bolnaApiService.extractCallDetailsFromExecution(response2.data);
// Returns: { callId, recordingUrl, duration, phoneNumberId, ... }
```

### Integration in callService
```javascript
// Location: src/clients/services/callService.js

async makeCallToBolnaAPI(payload, bearerToken) {
  // Step 1: Call Bolna
  const initial = await bolnaApiService.makeCallToBolna(payload, bearerToken);
  
  // Step 2: Fetch execution details (with retries)
  let executionDetails = null;
  for (let i = 0; i < 3; i++) {
    if (i > 0) await delay(2000);
    const response = await bolnaApiService.fetchExecutionDetails(...);
    if (response.success) {
      executionDetails = response.data;
      break;
    }
  }
  
  // Step 3: Extract details
  const callDetails = bolnaApiService.extractCallDetailsFromExecution(executionDetails);
  
  // Step 4: Return combined response
  return {
    executionId: initial.executionId,
    callId: callDetails.callId,
    status: initial.status,
    executionDetails: executionDetails,
    // ... more fields
  };
}
```

## Database Storage

### What We Store in CallHistory

```javascript
{
  executionId: "b2af7ff9-ca6d-45e8-8e14-23c742ea0904",  // From Step 1
  runId: "...",                                           // From Step 1
  callId: "call_123abc",                                 // From Step 2
  status: "queued",                                      // From Step 1
  phoneNumberId: ObjectId("..."),                        // From assignment
  recipientPhoneNumber: "+919876543210",                 // From request
  
  // Original Bolna response
  bolnaResponse: { /* Step 1 response */ },
  
  // Full execution details
  executionDetails: { 
    call_id: "call_123abc",
    execution_id: "...",
    status: "connected",
    duration: 45,
    recording_url: "...",
    // ... all fields from Step 2 ...
  },
  
  // Webhook data (arrives later)
  recordingUrl: "https://...",  // From webhook
  recordingId: "rec-456",        // From webhook
  callDuration: 300,             // From webhook
  webhookData: { /* full webhook */ }
}
```

## Data Availability Timeline

```
T+0ms: Call initiated
  │
  ├─ Step 1: POST /call → execution_id ✓ available
  │
  ├─ Step 2: GET /executions/{id} → call_id ✓ available (after ~1-2 sec)
  │   (Retry up to 3 times with 2sec delays if not ready)
  │
  └─ Database: CallHistory created with execution_id, call_id, phone_number_id ✓
  
T+1-5m: Call in progress
  │
  └─ Database: No changes (waiting for webhook)

T+5m+: Call completes
  │
  └─ Webhook: POST with recording_url, duration, etc ✓
     Database: CallHistory updated ✓
     Frontend: Shows recording playback ✓
```

## Retry Strategy for Execution Fetch

```javascript
// Current configuration
maxAttempts = 3
delay = 2000ms (2 seconds)

// Timeline:
Attempt 1: Immediate (T+0ms)
  ├─ If success → Use data
  └─ If fail → Continue

Attempt 2: Wait 2s (T+2000ms)
  ├─ If success → Use data
  └─ If fail → Continue

Attempt 3: Wait 2s (T+4000ms)
  ├─ If success → Use data
  └─ If fail → Continue without execution details

Total time: 0-4 seconds
Result: Call initiated immediately, full details captured if available
```

## Example: Complete Flow Log

```
[API Call] POST /client-call/initiate
[Service] initiateCall() starting
[Service] Lead found: "Riya", project: "Shilp Serene"
[Service] Assignment found: agent_id="agent_xyz", phone="+918347506153"
[Service] Building Bolna payload...
[Bolna] POST /call
[Log] Bolna Call Initiation Response: {
  "status": "queued",
  "execution_id": "b2af7ff9-ca6d-45e8-8e14-23c742ea0904"
}
[Service] Got execution_id, fetching details...
[Bolna] GET /executions/b2af7ff9-ca6d-45e8-8e14-23c742ea0904
[Log] Bolna Execution Details: {
  "call_id": "call_123abc",
  "status": "connected",
  "recording_url": "https://recordings.bolna.ai/rec-456.mp3"
}
[Service] Details retrieved, extracting call info...
[Service] Saving call history...
[Database] INSERT CallHistory {
  executionId: "b2af7ff9-ca6d-45e8-8e14-23c742ea0904",
  callId: "call_123abc",
  phoneNumberId: ObjectId("123..."),
  status: "queued",
  executionDetails: { ... }
}
[Service] Call history saved
[Response] {
  success: true,
  execution_id: "b2af7ff9-ca6d-45e8-8e14-23c742ea0904",
  call_id: "call_123abc",
  status: "queued"
}
```

## Files to Reference

1. **Utils**: `src/utils/bolnaApi.js` - Main Bolna API interactions
2. **Service**: `src/clients/services/callService.js` - Call initiation logic
3. **History Service**: `src/clients/services/callHistoryService.js` - Save/update logic
4. **Model**: `src/models/CallHistory.js` - Database schema
5. **Repository**: `src/clients/repositories/callHistoryRepository.js` - Database queries

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| executionId null | Bolna API not responding | Check bearer token, network |
| callId null | Execution details not fetched | Check execution endpoint, retry logic logs |
| phoneNumberId null | Assignment not found | Verify lead has project, project has assignment |
| recordingUrl null | Webhook not arrived | Wait for Bolna to complete call (~5min) |
| All fields null | Multiple issues | Check all logs, verify API credentials |

---

**Quick Test Command**:
```bash
# Make a call and check logs
cd d:\Aloqa\aloqa-backend
npm start

# In another terminal, check database
mongo
use aloqa_dev
db.callhistories.find().sort({createdAt: -1}).limit(1).pretty()

# Should see: executionId, callId, phoneNumberId, executionDetails (not null)
```
