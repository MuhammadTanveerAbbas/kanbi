"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Check, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const competitors = [
  { name: "KANBI", highlight: true },
  { name: "Jira", highlight: false },
  { name: "Asana", highlight: false },
  { name: "Linear", highlight: false },
];

const features = [
  {
    name: "AI Powered Insights",
    values: ["full", "none", "none", "partial"],
    description: "Smart predictions and recommendations",
  },
  {
    name: "Real time Collaboration",
    values: ["full", "full", "full", "full"],
    description: "Work together seamlessly",
  },
  {
    name: "Task Automation",
    values: ["full", "partial", "partial", "full"],
    description: "Automate repetitive workflows",
  },
  {
    name: "Industry Templates",
    values: ["9", "none", "3", "none"],
    description: "Pre-built workflows for your industry",
  },
  {
    name: "Offline-First",
    values: ["full", "none", "none", "none"],
    description: "Work anywhere, anytime",
  },
  {
    name: "No Login Required",
    values: ["full", "none", "none", "none"],
    description: "Start instantly, no barriers",
  },
  {
    name: "Free Forever Plan",
    values: ["full", "none", "partial", "none"],
    description: "Full features, zero cost",
  },
  {
    name: "Privacy-First",
    values: ["full", "none", "none", "none"],
    description: "Your data stays on your device",
  },
];

const getIcon = (value: string) => {
  if (
    value === "full" ||
    (value !== "none" && value !== "partial" && !isNaN(Number(value)))
  ) {
    return <Check className="h-5 w-5 text-green-500" />;
  }
  if (value === "partial") {
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  }
  return <X className="h-5 w-5 text-red-500" />;
};

const getValue = (value: string) => {
  if (value === "full") return "";
  if (value === "none") return "";
  if (value === "partial") return "";
  return value;
};

export default function ComparisonSection() {
  return (
    <section className="w-full py-12 sm:py-24 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <Badge className="mb-3 sm:mb-4 text-xs">Why Choose KANBI</Badge>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight font-headline">
            Built Different, Built Better
          </h2>
          <p className="mt-3 text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            See how KANBI stacks up against the competition. More features,
            better privacy, completely free.
          </p>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Feature</th>
                      {competitors.map((comp) => (
                        <th
                          key={comp.name}
                          className={`text-center p-4 font-semibold ${
                            comp.highlight ? "bg-primary/10" : ""
                          }`}
                        >
                          {comp.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, idx) => (
                      <tr
                        key={feature.name}
                        className={`border-b ${
                          idx % 2 === 0 ? "bg-muted/30" : ""
                        }`}
                      >
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{feature.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {feature.description}
                            </div>
                          </div>
                        </td>
                        {feature.values.map((value, compIdx) => (
                          <td
                            key={compIdx}
                            className={`text-center p-4 ${
                              competitors[compIdx].highlight
                                ? "bg-primary/5"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              {getIcon(value)}
                              <span className="text-sm font-medium">
                                {getValue(value)}
                              </span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-6">
          {features.map((feature) => (
            <Card key={feature.name}>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-1">{feature.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {feature.description}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {competitors.map((comp, idx) => (
                    <div
                      key={comp.name}
                      className={`flex items-center justify-between p-2 rounded ${
                        comp.highlight ? "bg-primary/10" : "bg-muted/50"
                      }`}
                    >
                      <span className="text-sm font-medium">{comp.name}</span>
                      <div className="flex items-center gap-1">
                        {getIcon(feature.values[idx])}
                        <span className="text-xs">
                          {getValue(feature.values[idx])}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            * Data accurate as of {new Date().getFullYear()}. Competitor
            features may vary by plan.
          </p>
        </div>
      </div>
    </section>
  );
}
