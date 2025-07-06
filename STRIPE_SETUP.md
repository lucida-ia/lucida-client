# Lucida Stripe Integration Setup Guide

## Overview

This guide will help you complete the Stripe integration setup for your Lucida exam creation platform.

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Node Environment
NODE_ENV=development  # or production
```

## Step-by-Step Setup

### 1. Stripe Account Setup

1. **Create/Login to Stripe Account**

   - Go to [stripe.com](https://stripe.com)
   - Create an account or log in

2. **Get API Keys**

   - Navigate to Developers → API Keys
   - Copy your **Publishable key** and **Secret key**
   - For testing, use the test keys (they start with `pk_test_` and `sk_test_`)

3. **Create Products and Prices**
   - Go to Products → Add Product
   - Create two products:
     - **Pro Plan**: R$ 27,90/month
     - **Custom Plan**: Custom pricing
   - Note down the **Price IDs** for each product

### 2. Webhook Configuration

1. **Create Webhook Endpoint**

   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - Add your endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
   - For local development: Use ngrok to expose your local server

2. **Select Events**
   Select these events:

   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

3. **Get Webhook Secret**
   - After creating the webhook, click on it
   - Copy the **Signing secret** (starts with `whsec_`)

### 3. Update Configuration

1. **Update Price IDs**

   - In `src/app/dashboard/billing/page.tsx` (lines 66-67)
   - In `src/components/pricing/index.tsx` (lines 32-33)
   - Replace the current price IDs with your actual Stripe price IDs

2. **Update Checkout URLs**
   - In `src/app/dashboard/billing/page.tsx` (lines 76-77)
   - In `src/components/pricing/index.tsx` (lines 25-26)
   - Replace with your actual Stripe Checkout URLs

### 4. Database Configuration

Ensure your MongoDB connection is working:

- The app will automatically create user documents with subscription info
- No manual database setup required

### 5. Testing

1. **Test Webhook Locally**

   ```bash
   # Install ngrok
   npm install -g ngrok

   # Expose your local server
   ngrok http 3000

   # Use the ngrok URL in your Stripe webhook configuration
   ```

2. **Test Subscription Flow**
   - Create a test subscription using Stripe's test cards
   - Verify webhook events are received
   - Check that user subscription is updated in your database

### 6. Production Deployment

1. **Update Environment Variables**

   - Use production Stripe keys
   - Update NODE_ENV to "production"

2. **Update URLs**

   - Replace development URLs with production URLs
   - Update webhook endpoint to your production domain

3. **SSL Certificate**
   - Ensure your domain has a valid SSL certificate
   - Stripe requires HTTPS for webhooks

## Current Implementation Status

✅ **Completed Features:**

- Webhook handler with signature verification
- Subscription creation, updates, and cancellation
- Usage limits enforcement (3 free, 50 pro, unlimited custom)
- Complete billing UI with subscription management
- Usage tracking and display
- Checkout success handling
- Customer creation and management

✅ **Plan Limits:**

- Free: 3 exams/month
- Pro: 50 exams/month
- Custom: Unlimited exams

✅ **Supported Events:**

- Subscription lifecycle (created, updated, deleted)
- Payment success/failure
- Usage reset on successful payment

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Failed**

   - Check that STRIPE_WEBHOOK_SECRET is correct
   - Ensure the webhook endpoint URL is correct
   - Verify the endpoint is accessible

2. **Subscription Not Updating**

   - Check webhook events are being sent
   - Verify database connection
   - Check server logs for errors

3. **Usage Limits Not Working**
   - Verify user document has usage field
   - Check exam creation API logs
   - Ensure plan limits are correctly configured

### Debugging

1. **Check Webhook Logs**

   - Go to Stripe Dashboard → Webhooks
   - Click on your webhook to see delivery logs

2. **Check Application Logs**

   - Monitor your server logs for webhook processing
   - Check for any database connection errors

3. **Test with Stripe CLI**
   ```bash
   # Install Stripe CLI
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

## Support

If you encounter issues:

1. Check the Stripe Dashboard for webhook delivery status
2. Review your server logs for detailed error messages
3. Verify all environment variables are correctly set
4. Test with Stripe's test mode first

## Security Notes

- Never commit environment variables to version control
- Use test keys for development
- Regularly rotate your API keys
- Monitor webhook delivery logs for suspicious activity
