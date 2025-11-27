# Webhook URL Configuration Update

## Change Made

The `webhookUrl` is now fetched **directly from the Assistant data** returned by Bolna AI API, instead of using a hardcoded environment variable.

## Files Updated

### 1. **callRepository.js** - Updated `getAssignmentForCall()`
```javascript
// NOW FETCHES webhookUrl from assistant
.populate('assistantId', 'agentId agentName webhookUrl')
```

### 2. **callService.js** - Two Changes

**Removed hardcoded line:**
```javascript
// DELETED:
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://yourdomain.com/api/client-call/call-history/webhook';
```

**Updated initiateCall() method:**
```javascript
// CHANGED FROM:
webhookUrl: WEBHOOK_URL

// CHANGED TO:
webhookUrl: assignment.assistantId?.webhookUrl || null
```

**Updated initiateCustomCall() method:**
```javascript
// CHANGED FROM:
webhookUrl: WEBHOOK_URL

// CHANGED TO:
webhookUrl: assistant?.webhookUrl || null
```

## Data Flow

### Before:
```
User calls API
  ↓
Backend uses hardcoded env variable
  ↓
"https://yourdomain.com/api/client-call/call-history/webhook"
```

### After:
```
User calls API
  ↓
Backend fetches assignment/assistant data from DB
  ↓
Gets webhookUrl from Assistant model
  ↓
"https://shilp-serene-calls.loca.lt" (dynamic from Bolna)
```

## How It Works Now

1. When a call is initiated, the backend fetches the Assistant data
2. The Assistant model contains the `webhookUrl` field
3. This URL comes from Bolna's API response when the assistant was created
4. The URL is now stored in your database for each assistant
5. When saving CallHistory, it uses the exact webhookUrl from the assistant

## No Environment Variable Needed

You no longer need to set `WEBHOOK_URL` in your `.env` file. Each assistant has its own webhook URL from Bolna.

## Webhook Data Comes From Bolna

When Bolna AI completes a call, it POSTs to the webhookUrl stored in the assistant with:
```json
{
  "call_id": "...",
  "status": "completed",
  "duration": 125,
  "recording_url": "https://...",
  "recording_id": "rec-123"
}
```

Your webhook endpoint receives this data and updates the CallHistory record.

## Benefits

✅ **Dynamic**: Each assistant can have different webhook URLs
✅ **Automatic**: No manual configuration needed
✅ **Flexible**: URLs come directly from Bolna's response
✅ **Multi-tenant**: Different users/projects can have different webhooks
✅ **No hardcoding**: No environment variables needed
