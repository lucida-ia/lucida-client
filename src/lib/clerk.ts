import { clerkClient } from "@clerk/nextjs/server";

export async function getClerkIdentity(
  userId: string
): Promise<{ username: string | null; email: string | null }> {
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    const primaryEmail =
      clerkUser.emailAddresses.find(
        (e: { id: string; emailAddress: string }) =>
          e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || null;

    const username =
      clerkUser.username ||
      (clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.firstName || null);

    return { username: username ?? null, email: primaryEmail ?? null };
  } catch {
    return { username: null, email: null };
  }
}


