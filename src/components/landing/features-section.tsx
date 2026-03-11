"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Bot,
  FileText,
  Target,
  Clipboard,
  BarChart3,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: (
      <Bot className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "Real AI extraction",
    description:
      "Not keyword matching actual understanding of what needs to happen, who owns it, and when.",
  },
  {
    icon: (
      <FileText className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "5 ways to get your notes in",
    description:
      "Paste text, upload a PDF, import a Notion page, paste an email thread, or drop in a URL. Kanbi reads them all.",
  },
  {
    icon: (
      <Target className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "Priorities set automatically",
    description:
      "AI reads deadlines in context. 'By Friday' becomes Urgent. 'Next sprint' becomes Medium. No manual tagging.",
  },
  {
    icon: (
      <Clipboard className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "Kanban board, ready instantly",
    description:
      "Tasks land in To Do, In Progress, or Done. Drag to move. Everything saves to your account automatically.",
  },
  {
    icon: (
      <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "Track what's actually shipped",
    description:
      "Dashboard shows task completion trends, AI usage, and board history. Know your productivity at a glance.",
  },
  {
    icon: (
      <Lock className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
    ),
    title: "Your client data stays yours",
    description:
      "Supabase row level security means no one else can see your boards. Export anytime as JSON.",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="w-full py-10 sm:py-14 md:py-18 lg:py-24 bg-black"
    >
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4 md:mb-6 px-2">
            Built for how you work
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            One tool for notes, emails, PDFs, and Notion. One Kanban board. One
            less thing to remember.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border-2 hover:border-primary/30 transition-all duration-300 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-2 group">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col items-start gap-3 sm:gap-4 md:gap-6">
                    <div className="p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2 md:mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
