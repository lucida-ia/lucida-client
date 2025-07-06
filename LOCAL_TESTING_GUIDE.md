# Local Testing Guide for Stripe Integration

## Prerequisites

- Stripe CLI installed and authenticated
- Next.js development server running
- `.env.local` file configured with test keys

## Setup Steps

### 1. Start Development Environment

```bash
# Terminal 1: Start your Next.js app
npm run dev

# Terminal 2: Start Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 2. Update Environment Variables

Copy the webhook secret from the Stripe CLI output to your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

Restart your development server after updating the environment variables.

## Testing Scenarios

### Test 1: Create a Test Customer and Subscription

```bash
# 1. Create a test customer
stripe customers create \
  --email "test@example.com" \
  --name "Test User" \
  --metadata user_id="test_user_123"

# Note the customer ID (cus_xxxxx)

# 2. Create a subscription for Pro plan
stripe subscriptions create \
  --customer cus_xxxxx \
  --items '[{"price": "price_1RgrOp4RuS8yGC3wQUwTYx90"}]' \
  --metadata user_id="test_user_123"
```

### Test 2: Test Payment Success

```bash
# Create a payment success event
stripe events create \
  --type invoice.payment_succeeded \
  --data '{
    "customer": "cus_xxxxx",
    "subscription": "sub_xxxxx",
    "amount_paid": 2790,
    "currency": "brl"
  }'
```

### Test 3: Test Payment Failure

```bash
# Create a payment failure event
stripe events create \
  --type invoice.payment_failed \
  --data '{
    "customer": "cus_xxxxx",
    "subscription": "sub_xxxxx",
    "amount_due": 2790,
    "currency": "brl"
  }'
```

### Test 4: Test Subscription Updates

```bash
# Update subscription to custom plan
stripe subscriptions update sub_xxxxx \
  --items '[{"id": "si_xxxxx", "price": "price_1RgZzc4RuS8yGC3w2EYaA8Ob"}]'
```

### Test 5: Test Subscription Cancellation

```bash
# Cancel subscription at period end
stripe subscriptions update sub_xxxxx \
  --cancel-at-period-end true

# Or cancel immediately
stripe subscriptions cancel sub_xxxxx
```

## Testing with Stripe Test Cards

Use these test cards in your Stripe Checkout:

```
# Successful payment
4242 4242 4242 4242

# Declined payment
4000 0000 0000 0002

# Requires authentication
4000 0025 0000 3155

# Insufficient funds
4000 0000 0000 9995
```

## Verification Checklist

After each test, verify:

### ✅ Database Updates

```bash
# Check your MongoDB/database to verify:
# 1. User subscription plan updated
# 2. Usage limits reflect new plan
# 3. Subscription status is correct
```

### ✅ Webhook Events

```bash
# In your Stripe CLI terminal, you should see:
# - Event received
# - Event processed successfully
# - No error messages
```

### ✅ Application Logs

```bash
# Check your Next.js console for:
# - Webhook received logs
# - Database update logs
# - No error messages
```

### ✅ Frontend Updates

```bash
# Check your application:
# 1. Dashboard shows correct subscription status
# 2. Usage limits are updated
# 3. Billing page shows correct plan
```

## End-to-End Testing Flow

### Complete User Journey Test

1. **Start with Free Plan**

   ```bash
   # Create user in your app (sign up)
   # Verify: Dashboard shows "Free" plan with 3 exams limit
   ```

2. **Create 3 Exams**

   ```bash
   # Create exams through your app
   # Verify: Usage counter increases
   # Try to create 4th exam
   # Verify: Should be blocked with upgrade message
   ```

3. **Upgrade to Pro Plan**

   ```bash
   # Use Stripe CLI to simulate subscription creation
   stripe subscriptions create \
     --customer cus_xxxxx \
     --items '[{"price": "price_1RgrOp4RuS8yGC3wQUwTYx90"}]'

   # Verify: Dashboard shows "Pro" plan with 50 exams limit
   # Verify: Can now create more exams
   ```

4. **Test Payment Success**

   ```bash
   # Simulate successful payment
   stripe events create --type invoice.payment_succeeded

   # Verify: Usage counter resets to 0
   ```

5. **Cancel Subscription**

   ```bash
   # Test cancellation through your app or CLI
   stripe subscriptions update sub_xxxxx --cancel-at-period-end true

   # Verify: Shows "cancels at period end" message
   ```

## Troubleshooting Common Issues

### Issue 1: Webhook Not Receiving Events

```bash
# Check if webhook endpoint is accessible
curl -X POST localhost:3000/api/webhooks/stripe

# Verify Stripe CLI is forwarding
# Should see events in CLI output
```

### Issue 2: Database Not Updating

```bash
# Check MongoDB connection
# Verify user exists in database
# Check server logs for errors
```

### Issue 3: Environment Variables

```bash
# Verify all required env vars are set
cat .env.local

# Restart development server after changes
```

### Issue 4: Webhook Signature Verification

```bash
# Ensure webhook secret matches CLI output
# Check for typos in environment variable
```

## Advanced Testing

### Test Multiple Users

```bash
# Create multiple customers with different metadata
stripe customers create --email "user1@test.com" --metadata user_id="user1"
stripe customers create --email "user2@test.com" --metadata user_id="user2"

# Test concurrent subscriptions
```

### Test Edge Cases

```bash
# Test subscription with no customer metadata
# Test invalid price IDs
# Test webhook events with missing data
```

## Monitoring and Logs

### What to Watch For

1. **Stripe CLI Output**: Real-time webhook events
2. **Next.js Console**: Application logs and errors
3. **Database**: User subscription updates
4. **Browser Network Tab**: API responses

### Success Indicators

- ✅ Webhook events processed without errors
- ✅ Database updates reflect subscription changes
- ✅ Frontend shows correct subscription status
- ✅ Usage limits work as expected
- ✅ Exam creation respects plan limits

## Production Readiness Check

Before deploying to production:

1. **Test all webhook events**
2. **Verify error handling**
3. **Test with different subscription states**
4. **Validate usage limit enforcement**
5. **Test cancellation and reactivation flows**

## Useful Commands

```bash
# List all customers
stripe customers list

# List all subscriptions
stripe subscriptions list

# Get subscription details
stripe subscriptions retrieve sub_xxxxx

# List all webhook events
stripe events list

# Test webhook endpoint manually
stripe events create --type customer.subscription.created
```
