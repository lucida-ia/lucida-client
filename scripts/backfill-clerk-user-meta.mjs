// Usage:
//   CLERK_SECRET_KEY=xxx MONGODB_URI=xxx node scripts/backfill-clerk-user-meta.mjs \
//     --dry-run=true --batchSize=200 --sleepMs=200 --concurrency=5 --maxRetries=6 --baseDelayMs=800

// Attempt to load .env if dotenv is available, but don't require it
try { await import('dotenv/config'); } catch {}

import mongoose from 'mongoose';

function parseBool(value, fallback) {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes'].includes(String(value).toLowerCase());
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRunArg = args.find((a) => a.startsWith('--dry-run='));
  const batchArg = args.find((a) => a.startsWith('--batchSize='));
  const sleepArg = args.find((a) => a.startsWith('--sleepMs='));
  const concArg = args.find((a) => a.startsWith('--concurrency='));
  const retriesArg = args.find((a) => a.startsWith('--maxRetries='));
  const baseDelayArg = args.find((a) => a.startsWith('--baseDelayMs='));

  const dryRun = dryRunArg ? parseBool(dryRunArg.split('=')[1], true) : true;
  const batchSize = batchArg ? parseInt(batchArg.split('=')[1], 10) : 200;
  const sleepMs = sleepArg ? parseInt(sleepArg.split('=')[1], 10) : 200;
  const concurrency = concArg ? parseInt(concArg.split('=')[1], 10) : 5;
  const maxRetries = retriesArg ? parseInt(retriesArg.split('=')[1], 10) : 5;
  const baseDelayMs = baseDelayArg ? parseInt(baseDelayArg.split('=')[1], 10) : 500;

  if (!process.env.CLERK_SECRET_KEY) {
    console.error('CLERK_SECRET_KEY is required');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });

  // Define a minimal flexible User model
  const UserModel = mongoose.models.User || mongoose.model(
    'User',
    new mongoose.Schema(
      {
        id: String,
        username: { type: String, default: null },
        email: { type: String, default: null },
      },
      { strict: false }
    )
  );

  const total = await UserModel.countDocuments({});
  console.log(`Found ${total} users to check`);
  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  let processed = 0;
  const cursor = UserModel.find({}).cursor();
  const batch = [];

  for await (const user of cursor) {
    batch.push(user);
    if (batch.length >= batchSize) {
      const res = await processBatch(batch, dryRun, UserModel, concurrency, maxRetries, baseDelayMs);
      updatedCount += res.updated;
      skippedCount += res.skipped;
      notFoundCount += res.notFound;
      errorCount += res.errors;
      processed += batch.length;
      console.log(`Processed ${processed}/${total}`);
      batch.length = 0;
      if (sleepMs > 0) await sleep(sleepMs);
    }
  }

  if (batch.length > 0) {
    const res = await processBatch(batch, dryRun, UserModel, concurrency, maxRetries, baseDelayMs);
    updatedCount += res.updated;
    skippedCount += res.skipped;
    notFoundCount += res.notFound;
    errorCount += res.errors;
    processed += batch.length;
    console.log(`Processed ${processed}/${total}`);
  }

  console.log(`Summary: updated=${updatedCount}, skipped=${skippedCount}, notFound=${notFoundCount}, errors=${errorCount}`);
  console.log('Done');
  await mongoose.connection.close();
  process.exit(0);
}

async function fetchWithRetry(url, options, { maxRetries, baseDelayMs }) {
  let attempt = 0;
  let lastErr;
  while (attempt <= maxRetries) {
    try {
      const res = await fetch(url, options);
      if (res.status === 404) {
        return { status: 404, json: null, res };
      }
      if (res.ok) {
        const json = await res.json();
        return { status: res.status, json, res };
      }
      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        const retryAfter = res.headers.get('retry-after');
        const serverDelay = retryAfter ? parseInt(retryAfter, 10) * 1000 : null;
        const delay = serverDelay ?? Math.min(baseDelayMs * 2 ** attempt, 30000);
        attempt++;
        if (attempt > maxRetries) {
          lastErr = new Error(`Clerk error: ${res.status}`);
          break;
        }
        await sleep(delay);
        continue;
      }
      throw new Error(`Clerk error: ${res.status}`);
    } catch (err) {
      lastErr = err;
      attempt++;
      if (attempt > maxRetries) break;
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), 30000);
      await sleep(delay);
    }
  }
  throw lastErr || new Error('Request failed');
}

async function fetchClerkIdentity(userId, maxRetries, baseDelayMs) {
  const url = `https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`;
  const { status, json } = await fetchWithRetry(
    url,
    {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    },
    { maxRetries, baseDelayMs }
  );
  if (status === 404) return { username: null, email: null, notFound: true };
  const cu = json;
  const primaryEmail =
    (cu.email_addresses || []).find((e) => e.id === cu.primary_email_address_id)?.email_address ||
    (cu.email_addresses || [])[0]?.email_address ||
    null;
  const username =
    cu.username || (cu.first_name && cu.last_name ? `${cu.first_name} ${cu.last_name}` : cu.first_name || null);
  return { username: username ?? null, email: primaryEmail ?? null, notFound: false };
}

async function mapWithConcurrency(items, limit, iterator) {
  for (let i = 0; i < items.length; i += limit) {
    const slice = items.slice(i, i + limit);
    await Promise.all(slice.map(iterator));
  }
}

async function processBatch(users, dryRun, UserModel, concurrency, maxRetries, baseDelayMs) {
  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  let errors = 0;
  await mapWithConcurrency(users, concurrency, async (user) => {
    try {
      const { username, email, notFound: nf } = await fetchClerkIdentity(user.id, maxRetries, baseDelayMs);
      if (nf) {
        notFound++;
        return;
      }
      const update = {};
      if (username && user.username !== username) update.username = username;
      if (email && user.email !== email) update.email = email;
      if (Object.keys(update).length > 0) {
        if (!dryRun) {
          await UserModel.updateOne({ _id: user._id }, { $set: update });
        }
        updated++;
      } else {
        skipped++;
      }
    } catch (err) {
      errors++;
      console.error(`Failed to update user ${user.id}:`, err?.message || err);
    }
  });
  return { updated, skipped, notFound, errors };
}

main().catch(async (err) => {
  console.error(err);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});


