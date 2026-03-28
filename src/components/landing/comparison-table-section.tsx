"use client";

import { motion } from "framer-motion";
import { Check, X, Zap, Brain, FileText, BarChart3, Lock, CheckCircle, Calendar, Lightbulb, Sparkles } from "lucide-react";

const competitors = [
  { name: "Kanbi", icon: Zap, color: "text-primary" },
  { name: "Asana", icon: CheckCircle, color: "text-muted-foreground" },
  { name: "Monday", icon: Calendar, color: "text-muted-foreground" },
];

const comparisonData = [
  {
    feature: "AI Task Extraction",
    icon: Brain,
    kanbi: true,
    asana: false,
    monday: false,
  },
  {
    feature: "PDF Parsing",
    icon: FileText,
    kanbi: true,
    asana: false,
    monday: false,
  },
  {
    feature: "Kanban Board",
    icon: Zap,
    kanbi: true,
    asana: true,
    monday: true,
  },
  {
    feature: "Analytics Dashboard",
    icon: BarChart3,
    kanbi: true,
    asana: true,
    monday: true,
  },
  {
    feature: "Free Plan Available",
    icon: Lock,
    kanbi: true,
    asana: true,
    monday: false,
  },
  {
    feature: "Affordable Pricing",
    icon: Lightbulb,
    kanbi: true,
    asana: false,
    monday: false,
  },
];

export default function ComparisonTableSection() {
  return (
    <section className="w-full py-10 sm:py-14 md:py-18 lg:py-24 bg-black">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4 md:mb-6 px-2">
            How Kanbi Compares
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Honest comparison with industry leaders
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-x-auto"
        >
          <div className="min-w-full">
            {/* Desktop Table */}
            <div className="hidden lg:block border border-border rounded-lg overflow-hidden bg-card/30 backdrop-blur-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-card/50">
                    <th className="px-4 sm:px-6 py-4 text-left text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary/60" />
                        Features
                      </div>
                    </th>
                    {competitors.map((comp) => {
                      const CompIcon = comp.icon;
                      return (
                        <th key={comp.name} className="px-4 sm:px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${comp.name === "Kanbi" ? "bg-primary/20 border border-primary/30" : "bg-muted/20 border border-muted/30"} flex items-center justify-center`}>
                              <CompIcon className={`w-4 h-4 ${comp.color}`} />
                            </div>
                            <span className={`text-xs font-semibold ${comp.color}`}>
                              {comp.name}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => {
                    const IconComponent = row.icon;
                    return (
                      <tr
                        key={row.feature}
                        className={`border-b border-border transition-colors ${
                          index % 2 === 0 ? "bg-transparent" : "bg-card/20"
                        } hover:bg-card/40`}
                      >
                        <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-4 h-4 text-primary/60" />
                            {row.feature}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-center">
                          {row.kanbi ? (
                            <Check className="w-5 h-5 text-primary mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-center">
                          {row.asana ? (
                            <Check className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-center">
                          {row.monday ? (
                            <Check className="w-5 h-5 text-muted-foreground/50 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Cards */}
            <div className="lg:hidden space-y-3">
              {comparisonData.map((row) => {
                const IconComponent = row.icon;
                return (
                  <motion.div
                    key={row.feature}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="border border-border rounded-lg bg-card/30 backdrop-blur-sm p-3 sm:p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <IconComponent className="w-4 h-4 text-primary/60 flex-shrink-0" />
                      <p className="font-medium text-xs sm:text-sm">{row.feature}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {competitors.map((comp) => {
                        const CompIcon = comp.icon;
                        const value = row[comp.name.toLowerCase() as keyof typeof row] as boolean;
                        return (
                          <div key={comp.name} className="flex flex-col items-center gap-1 p-2 rounded bg-card/50">
                            <CompIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${comp.color}`} />
                            <span className="text-xs font-semibold text-muted-foreground line-clamp-1">
                              {comp.name}
                            </span>
                            {value ? (
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                            ) : (
                              <X className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground/30" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
