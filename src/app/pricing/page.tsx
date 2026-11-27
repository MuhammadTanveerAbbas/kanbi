import { Metadata } from "next";
import { SITE_URL } from "@/app/sitemap";
import PricingPage from "@/components/PricingPage";

export const metadata: Metadata = {
  title: "Pricing · Kanbi kanbi AI Task Management",
  description:
    "Start free forever. Upgrade to Pro for $9/month and unlock the Kanbi Assistant, burnout prevention, PDF import, and board export.",
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: {
    title: "Pricing · Kanbi kanbi AI Task Management",
    description:
      "Free plan forever. Pro at $9/month. No contracts, cancel anytime.",
    url: `${SITE_URL}/pricing`,
    type: "website",
    // Next.js merges metadata shallowly, so this page-level openGraph replaces
    // the one in the root layout. Repeat the shared fields here or they vanish.
    siteName: "KANBI",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Kanbi - a Kanban board filled with extracted tasks. Try Kanbi free, no card needed.",
      },
    ],
  },
};

export default function Page() {
  return <PricingPage />;
}
