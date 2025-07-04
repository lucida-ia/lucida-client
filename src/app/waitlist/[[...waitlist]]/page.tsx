import { Waitlist } from "@clerk/nextjs";

export default function WaitlistPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Waitlist signInUrl="/sign-in" />
    </div>
  );
} 