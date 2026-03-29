import { Metadata } from "next";
import PricingPage from "@/components/PricingPage";

export const metadata: Metadata = {
  title: "Pricing · Kanbi kanbi AI Task Management",
  description:
    "Start free forever. Upgrade to Pro for $9/month and unlock AI Chat, burnout prevention, PDF import, and Google Calendar sync.",
  openGraph: {
    title: "Pricing · Kanbi kanbi AI Task Management",
    description:
      "Free plan forever. Pro at $9/month. No contracts, cancel anytime.",
    url: "https://kanbi.app/pricing",
    type: "website",
  },
};

export default function Page() {
  return <PricingPage />;
}
