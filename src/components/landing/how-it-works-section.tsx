import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, FileText, Trello, Edit } from "lucide-react";

const steps = [
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: "1. Paste Your Text",
    description: "Drop in meeting notes or any unstructured text.",
  },
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: "2. AI Extracts Tasks",
    description: "AI parses your text and identifies tasks (requires API key).",
  },
  {
    icon: <Trello className="h-8 w-8 text-primary" />,
    title: "3. Get Your Board",
    description: "Tasks appear on a clean Kanban board ready to manage.",
  },
  {
    icon: <Edit className="h-8 w-8 text-primary" />,
    title: "4. Drag & Drop",
    description: "Move tasks through your workflow and track progress.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="w-full py-12 sm:py-24 bg-black">
      <div className="container mx-auto text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-4xl font-headline">
          Simple Workflow
        </h2>
        <p className="mt-3 text-sm sm:text-lg text-muted-foreground max-w-3xl mx-auto">
          Go from messy notes to organized tasks in minutes.
        </p>
        <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <Card key={step.title} className="text-center bg-background/50">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-secondary/50">
                  {step.icon}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardTitle className="mb-2 text-sm sm:text-base">
                  {step.title}
                </CardTitle>
                <p className="text-xs sm:text-base text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
