"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, X, Lightbulb } from "lucide-react";

interface OnboardingProps {
  hasAnyTasks: boolean;
}

export default function Onboarding({ hasAnyTasks }: OnboardingProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("kanbi-onboarding-seen");
    if (!hasSeenOnboarding && !hasAnyTasks) {
      setShowOnboarding(true);
    }
  }, [hasAnyTasks]);

  const steps = [
    {
      title: "Hey! Let's get you organized",
      content:
        "I'll help you turn your scattered thoughts into a clear to do list. It takes 30 seconds.",
    },
    {
      title: "Just paste whatever you have",
      content:
        "Meeting notes, random ideas, things floating in your head. Don't worry about formatting.",
    },
    {
      title: "I'll do the rest",
      content:
        "I'll find your tasks and put them in columns. Drag them around as you work.",
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem("kanbi-onboarding-seen", "true");
    setShowOnboarding(false);
  };

  if (!showOnboarding) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <Lightbulb className="h-5 w-5 text-primary mt-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={completeOnboarding}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.content}</p>
            </div>

            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full ${
                    index <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="ghost" onClick={completeOnboarding}>
                I'll figure it out
              </Button>
              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? "Let's do this" : "Got it"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function QuickStartExample() {
  const [showExample, setShowExample] = useState(true);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(() => {
    return localStorage.getItem("kanbi-example-dismissed") === "true";
  });

  const handleDismiss = () => {
    setShowExample(false);
    setHasBeenDismissed(true);
    localStorage.setItem("kanbi-example-dismissed", "true");
  };

  if (!showExample || hasBeenDismissed) return null;

  return (
    <Alert className="border-blue-200 bg-blue-50 text-blue-800">
      <Lightbulb className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm">
          <strong>Not sure what to write?</strong> Try: "Fix login bug by
          Friday, Review marketing copy, Call John"
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-blue-600 hover:text-blue-800 ml-2"
        >
          <X className="h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
