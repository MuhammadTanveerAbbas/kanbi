"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Loader2,
  WifiOff,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  FileText,
  Upload,
  Link as LinkIcon,
  FileType,
  ClipboardPaste,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Task, TaskPriority } from "@/lib/types";

interface TaskGeneratorProps {
  addTask: (task: Omit<Task, "id" | "status" | "createdAt">) => void;
}

function mapPriority(s: string): TaskPriority {
  const v = (s || "").toLowerCase();
  if (v === "urgent") return "Urgent";
  if (v === "high") return "High";
  if (v === "medium") return "Medium";
  if (v === "low") return "Low";
  return "Medium";
}

export default function TaskGenerator({ addTask }: TaskGeneratorProps) {
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfMeta, setPdfMeta] = useState<{ pages: number; characterCount: number } | null>(null);
  const [pdfPhase, setPdfPhase] = useState<"idle" | "reading" | "extracting">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlPageTitle, setUrlPageTitle] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlPhase, setUrlPhase] = useState<"idle" | "fetching" | "extracting">("idle");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const parseTasksIntelligently = (text: string): Array<{ title: string; description: string }> => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 2);
    const tasks: Array<{ title: string; description: string }> = [];

    lines.forEach((line) => {
      if (line.match(/^(meeting|notes?|agenda|discussion):/i)) return;
      if (line.match(/^#+\s/)) return;

      let cleanLine = line.replace(/^[-•*]\s*/, "").trim();

      const dueDateMatch = cleanLine.match(
        /(by|due|deadline)\s+(\w+day|\d+\/\d+|\w+\s+\d+)/i
      );
      const priorityMatch = cleanLine.match(
        /(urgent|asap|high priority|important)/i
      );

      cleanLine = cleanLine.replace(/(by|due|deadline)\s+\w+day?/gi, "").trim();
      cleanLine = cleanLine
        .replace(/(urgent|asap|high priority|important)/gi, "")
        .trim();

      if (cleanLine && (cleanLine.includes(" ") || cleanLine.length > 8)) {
        let description = "";
        if (dueDateMatch) description += `Due: ${dueDateMatch[2]}. `;
        if (priorityMatch) description += "High priority.";

        tasks.push({
          title: cleanLine,
          description: description.trim(),
        });
      }
    });

    return tasks;
  };

  const generateTasks = async () => {
    if (!notes.trim()) return;

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/parse-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (res.status === 500) {
        const parsedTasks = parseTasksIntelligently(notes);
        if (parsedTasks.length === 0) {
          setError("I couldn't find any tasks. Try writing what you need to do.");
          return;
        }
        parsedTasks.forEach((task) => addTask({ title: task.title, description: task.description }));
        setNotes("");
        return;
      }

      if (!res.ok) {
        const msg = data.error || "AI extraction failed. Try again.";
        setError(msg);
        return;
      }

      const tasks = Array.isArray(data) ? data : data.tasks || [];
      if (tasks.length === 0) {
        setError("No tasks found. Make sure your notes contain action items like 'Fix bug', 'Call client', 'Review document', etc.");
        return;
      }

      tasks.forEach((t: { task?: string; title?: string; owner?: string; deadline?: string; priority?: string }) => {
        const title = t.task ?? t.title ?? "";
        const descParts = [];
        if (t.owner && t.owner !== "Me") descParts.push(`Owner: ${t.owner}`);
        if (t.deadline && t.deadline !== "Not specified") descParts.push(`Due: ${t.deadline}`);
        addTask({
          title,
          description: descParts.join(" • ") || undefined,
          dueDate: t.deadline && t.deadline !== "Not specified" ? t.deadline : undefined,
          priority: mapPriority(t.priority || "medium"),
          tags: ["ai-extracted"],
        });
      });

      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    if (error) setError(null);
  };

  const addTasksFromApiResponse = (data: unknown) => {
    const tasks = Array.isArray(data) ? data : (data as { tasks?: unknown[] }).tasks || [];
    tasks.forEach((t: { task?: string; title?: string; owner?: string; deadline?: string; priority?: string }) => {
      const title = t.task ?? t.title ?? "";
      const descParts = [];
      if (t.owner && t.owner !== "Me") descParts.push(`Owner: ${t.owner}`);
      if (t.deadline && t.deadline !== "Not specified") descParts.push(`Due: ${t.deadline}`);
      addTask({
        title,
        description: descParts.join(" • ") || undefined,
        dueDate: t.deadline && t.deadline !== "Not specified" ? t.deadline : undefined,
        priority: mapPriority(t.priority || "medium"),
        tags: ["ai-extracted"],
      });
    });
  };

  const extractTasksFromPdf = async () => {
    if (!pdfFile) return;
    setError(null);
    setPdfMeta(null);
    setIsGenerating(true);
    setPdfPhase("reading");

    try {
      setPdfPhase("extracting");
      const formData = new FormData();
      formData.set("file", pdfFile);
      const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
      let data: any;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        setError(data.error || "Failed to extract tasks from PDF.");
        return;
      }
      const meta = data.meta as { pages?: number; characterCount?: number } | undefined;
      if (meta) setPdfMeta({ pages: meta.pages ?? 0, characterCount: meta.characterCount ?? 0 });
      const tasks = data.tasks ?? data;
      if (Array.isArray(tasks) && tasks.length > 0) {
        addTasksFromApiResponse(tasks);
        setPdfFile(null);
      } else {
        setError("No tasks found in the PDF.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process PDF.");
    } finally {
      setIsGenerating(false);
      setPdfPhase("idle");
    }
  };

  const onPdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") setPdfFile(file);
    else setError("Please drop a PDF file.");
  };

  const onPdfDragOver = (e: React.DragEvent) => e.preventDefault();

  const onPdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === "application/pdf") setPdfFile(file);
    e.target.value = "";
  };

  const extractTasksFromUrl = async () => {
    if (!urlInput.trim()) return;
    setError(null);
    setUrlPageTitle(null);
    setUrlLoading(true);
    setUrlPhase("fetching");
    try {
      setUrlPhase("extracting");
      const res = await fetch("/api/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) {
        setError(data.error || "Failed to extract tasks from URL.");
        return;
      }
      if (data.pageTitle) setUrlPageTitle(data.pageTitle);
      const tasks = data.tasks ?? [];
      if (Array.isArray(tasks) && tasks.length > 0) {
        addTasksFromApiResponse(tasks);
      } else {
        setError("No tasks found on this page.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract tasks from URL.");
    } finally {
      setUrlLoading(false);
      setUrlPhase("idle");
    }
  };

  const insertExample = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      if (process.env.NEXT_PUBLIC_USE_AI === "true") {
        try {
          const response = await fetch("/api/generate-example", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          if (response.ok) {
            let data: any;
            try {
              data = await response.json();
            } catch {
              data = {};
            }
            if (data.example) {
              setNotes(data.example);
              setIsGenerating(false);
              return;
            }
          }
        } catch (aiError) {
          console.log("AI example generation failed, using fallback");
        }
      }

      const examples = [
        `- Fix the login bug by Friday
- Review marketing copy
- Call John about the project
- Update pricing page`,
        `- Prepare presentation for Monday meeting
- Send follow-up emails to clients
- Update website content
- Schedule team standup`,
        `- Research competitor pricing
- Write blog post about new features
- Test mobile app performance
- Plan next sprint tasks`,
        `- Review code pull requests
- Update documentation
- Fix reported bugs
- Deploy to staging environment`,
      ];

      const randomExample =
        examples[Math.floor(Math.random() * examples.length)];
      setNotes(randomExample);
    } catch (error) {
      setError("Couldn't generate example. Try typing your own tasks.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Add Your Tasks</h2>
            {!isOnline && <WifiOff className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        <Tabs defaultValue="paste" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="paste" className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
              <ClipboardPaste className="h-4 w-4" />
              <span className="hidden sm:inline">Paste</span>
            </TabsTrigger>
            <TabsTrigger value="pdf" className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
              <FileType className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
              <LinkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">URL</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="flex-1 flex flex-col gap-4 mt-0 data-[state=inactive]:hidden">
            {!notes && (
              <Button variant="ghost" size="sm" className="self-start" onClick={insertExample}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Show Me How
              </Button>
            )}
            <Textarea
              placeholder="What's on your mind?

- Fix login bug
- Review copy
- Call John"
              value={notes}
              onChange={handleInputChange}
              rows={5}
              className="resize-none min-h-[120px] sm:min-h-[140px] placeholder:text-sm"
            />
            <Button
              onClick={generateTasks}
              disabled={!notes.trim() || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding Your Tasks...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Turn This Into Tasks
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="url" className="flex-1 flex flex-col gap-4 mt-0 data-[state=inactive]:hidden">
            <p className="text-xs text-muted-foreground">
              Works with Google Docs (published), project briefs, job postings, any public URL
            </p>
            <Input
              placeholder="https://docs.google.com/... or any webpage"
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); if (error) setError(null); }}
              className="text-sm"
            />
            {urlPageTitle && <p className="text-xs text-muted-foreground">Page: {urlPageTitle}</p>}
            <Button
              onClick={extractTasksFromUrl}
              disabled={!urlInput.trim() || urlLoading}
              className="w-full"
              size="lg"
            >
              {urlLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {urlPhase === "fetching" ? "Fetching page..." : "Extracting tasks..."}
                </>
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Extract Tasks from URL
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="pdf" className="flex-1 flex flex-col gap-4 mt-0 data-[state=inactive]:hidden">
            <div
              onDrop={onPdfDrop}
              onDragOver={onPdfDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors min-h-[140px] flex flex-col items-center justify-center gap-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={onPdfSelect}
              />
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {pdfFile ? pdfFile.name : "Drop your meeting notes PDF here"}
              </p>
              <p className="text-xs text-muted-foreground">or click to browse</p>
            </div>
            {pdfMeta && (
              <p className="text-xs text-muted-foreground">
                {pdfMeta.pages} page(s) • {pdfMeta.characterCount} characters
              </p>
            )}
            <Button
              onClick={extractTasksFromPdf}
              disabled={!pdfFile || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {pdfPhase === "reading" ? "Reading PDF..." : "Extracting tasks with AI..."}
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Extract Tasks from PDF
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {success && (
          <Alert className="bg-muted border-muted-foreground/20 mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{success}</span>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs underline ml-2" onClick={() => setSuccess(null)}>
                Clear
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <p className="text-xs text-muted-foreground text-center mt-4">
          AI powered task extraction • Smart deadline detection • Privacy first
        </p>
      </CardContent>
    </Card>
  );
}
