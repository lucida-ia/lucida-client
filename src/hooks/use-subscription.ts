import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface UserSubscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  usage?: {
    examsThisPeriod: number;
    examsThisPeriodResetDate: Date;
  };
}

export function useSubscription() {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch("/api/subscription");

      if (!response.ok) {
        throw new Error("Failed to fetch subscription");
      }

      const data = await response.json();
      setSubscription(data.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const isCustomSubscription = subscription?.plan === "custom";
  const shouldHideBilling = isCustomSubscription;

  return {
    subscription,
    loading,
    error,
    isCustomSubscription,
    shouldHideBilling,
    refetchSubscription: fetchSubscription,
  };
}
