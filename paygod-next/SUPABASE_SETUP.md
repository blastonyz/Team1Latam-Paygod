# Supabase Integration & Transaction Indexing Setup

## Overview

This document describes how to set up transaction indexing using Supabase Realtime and webhooks from Alchemy/Thirdweb for the Paygod system.

## Architecture

```
On-Chain Event (PrivateTransfer)
         ↓
  Alchemy/Thirdweb Webhook
         ↓
  Frontend Webhook Endpoint: /api/webhooks/tx-confirmed
         ↓
  Supabase transactions table (insert)
         ↓
  Supabase Realtime (publish event)
         ↓
  Frontend useRealtimeTransactions hook (subscribe)
         ↓
  Overview page updates with new transactions
```

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project (free tier includes 500k row limit)
3. Note your project URL and anon key from Settings > API

## Step 2: Create Transactions Table

In Supabase dashboard, create a new table with the following schema:

```sql
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  tx_hash TEXT UNIQUE NOT NULL,
  sender_wallet TEXT NOT NULL,
  recipient_wallet TEXT NOT NULL,
  amount_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'flagged'
  auditor_decision TEXT,
  risk_score INT,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- Create index for faster queries
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp DESC);
```

## Step 3: Configure Frontend .env

Update `paygod-next/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
WEBHOOK_SECRET=your-secret-key-for-hmac-validation
```

## Step 4: Set Up Alchemy Webhook (Recommended)

1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com)
2. Create a webhook that triggers on `PrivateTransfer` events from your EncryptedERC contract
3. Set webhook URL to: `https://your-frontend-domain/api/webhooks/tx-confirmed`
4. Configure webhook payload to include:
   - `txHash`: Transaction hash
   - `senderWallet`: Sender address
   - `recipientWallet`: Recipient address
   - `amountEncrypted`: Encrypted amount
   - `timestamp`: Block timestamp

Example payload format:
```json
{
  "txHash": "0x1234...",
  "senderWallet": "0x5678...",
  "recipientWallet": "0xabcd...",
  "amountEncrypted": "••••• AVAX",
  "status": "approved",
  "timestamp": "2025-05-20T14:32:11Z"
}
```

## Step 5: Enable Realtime in Frontend

The `useRealtimeTransactions` hook automatically subscribes to the `transactions` table.

Override in `app/app/overview/page.tsx`:
```typescript
const { transactions, loading, error } = useRealtimeTransactions(6);
```

This hook will:
- Fetch the 6 most recent transactions on mount
- Subscribe to realtime updates
- Push new transactions to the top of the list
- Maintain a max of 6 transactions in the UI

## Step 6: Fallback Behavior

If Supabase is not configured:
- Frontend will use mock data from `lib/mockData.ts`
- Webhook endpoint will return 400 error if required fields are missing
- No realtime updates until configured

## Testing

### Test the webhook endpoint locally:

```bash
curl -X POST http://localhost:3000/api/webhooks/tx-confirmed \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0xtest123",
    "senderWallet": "0x1234...",
    "recipientWallet": "0x5678...",
    "amountEncrypted": "••••• AVAX",
    "status": "approved",
    "timestamp": "2025-05-20T14:32:11Z"
  }'
```

Expected response:
```json
{
  "success": true,
  "transaction": [...]
}
```

### Test realtime subscription:

1. Start dev server: `npm run dev`
2. Navigate to Overview page
3. In another terminal, send a webhook payload
4. Overview table should update automatically

## Security Considerations

1. **Webhook Validation**: Add HMAC signature verification in `api/webhooks/tx-confirmed/route.ts`
2. **Rate Limiting**: Webhook endpoint should have rate limiting configured
3. **Data Encryption**: Sensitive data should remain encrypted at rest in Supabase
4. **Access Control**: Use Row Level Security (RLS) policies if needed

## Troubleshooting

**Transactions not appearing:**
- Check Supabase credentials in `.env.local`
- Verify table exists and Realtime is enabled
- Check browser console for errors

**Webhook not triggering:**
- Verify Alchemy/Thirdweb webhook URL is correct
- Check webhook payload format matches expected schema
- Enable debug logging in `api/webhooks/tx-confirmed/route.ts`

**Connection failures:**
- Verify Supabase project is active
- Check network connectivity
- Review Supabase logs for authentication errors

## Production Deployment

For Cloud Run deployment:
1. Set environment variables in Cloud Run:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `WEBHOOK_SECRET`

2. Update webhook URL in Alchemy to your production domain

3. Monitor Supabase row usage and upgrade plan if needed

## Next Steps

- Add RLS policies to Supabase for user-specific transaction views
- Implement webhook signature validation for security
- Add transaction search/filter functionality
- Create admin dashboard for transaction monitoring
