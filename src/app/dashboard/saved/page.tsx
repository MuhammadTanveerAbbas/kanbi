"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Grid3x3,
  List,
  Star,
  StarOff,
  Copy,
  Download,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from '@/components/dashboard/empty-state';
import { Generation } from "@/lib/dashboard-types";

type ViewMode = "grid" | "list";

export default function SavedPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [filteredGenerations, setFilteredGenerations] = useState<Generation[]>(
    []
  );
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedGeneration, setSelectedGeneration] =
    useState<Generation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenerations();
  }, [sortBy, sortOrder, showFavoritesOnly]);

  useEffect(() => {
    filterGenerations();
  }, [searchQuery, generations]);

  const fetchGenerations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sort: sortBy,
        order: sortOrder,
        ...(showFavoritesOnly && { favorite: "true" }),
      });

      const response = await fetch(`/api/saved/list?${params}`);
      if (!response.ok) {
        const text = await response.text();
        console.error('API Error:', text);
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setGenerations(data);
      setFilteredGenerations(data);
    } catch (error) {
      console.error("Failed to fetch generations:", error);
      setGenerations([]);
      setFilteredGenerations([]);
    } finally {
      setLoading(false);
    }
  };

  const filterGenerations = () => {
    if (!searchQuery.trim()) {
      setFilteredGenerations(generations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = generations.filter(
      (gen) =>
        gen.title?.toLowerCase().includes(query) ||
        gen.input_text.toLowerCase().includes(query) ||
        gen.output_text.toLowerCase().includes(query)
    );
    setFilteredGenerations(filtered);
  };

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      const response = await fetch(`/api/saved/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: !currentFavorite }),
      });

      if (response.ok) {
        fetchGenerations();
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this generation?")) return;

    try {
      const response = await fetch(`/api/saved/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchGenerations();
        if (selectedGeneration?.id === id) {
          setIsModalOpen(false);
          setSelectedGeneration(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleExport = (generation: Generation) => {
    const content = `Title: ${generation.title || "Untitled"}\n\nInput:\n${
      generation.input_text
    }\n\nOutput:\n${generation.output_text}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${generation.title || "generation"}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openModal = (generation: Generation) => {
    setSelectedGeneration(generation);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Saved Boards</h1>
          <p className="text-sm sm:text-base text-gray-400">
            {filteredGenerations.length} saved board
            {filteredGenerations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search generations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#141414] border-[#262626] text-sm sm:text-base"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-[#141414] border border-[#262626] rounded-md text-white text-sm"
            >
              <option value="created_at">Date</option>
              <option value="title">Title</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star
                className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`}
              />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generations Grid/List */}
      {filteredGenerations.length === 0 ? (
        <EmptyState
          title="No saved boards yet"
          description="Create and save your Kanban boards to access them here"
          action="/dashboard/board"
          actionLabel="Create Board"
        />
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          }
        >
          {filteredGenerations.map((generation) => (
            <GenerationCard
              key={generation.id}
              generation={generation}
              viewMode={viewMode}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
              onCopy={handleCopy}
              onExport={handleExport}
              onView={openModal}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="border-[#262626] bg-[#141414] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedGeneration?.title || "Untitled"}</DialogTitle>
            <DialogDescription>
              {new Date(
                selectedGeneration?.created_at || ""
              ).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          {selectedGeneration && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-400">
                  Input
                </h3>
                <div className="p-4 bg-gray-900 rounded-md border border-gray-800">
                  <pre className="text-sm whitespace-pre-wrap">
                    {selectedGeneration.input_text}
                  </pre>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-400">
                  Output
                </h3>
                <div className="p-4 bg-gray-900 rounded-md border border-gray-800">
                  <pre className="text-sm whitespace-pre-wrap">
                    {selectedGeneration.output_text}
                  </pre>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            {selectedGeneration && (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleToggleFavorite(
                      selectedGeneration.id,
                      selectedGeneration.is_favorite || false
                    )
                  }
                >
                  {selectedGeneration.is_favorite ? (
                    <>
                      <StarOff className="h-4 w-4 mr-2" />
                      Remove Favorite
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Add Favorite
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCopy(selectedGeneration.output_text)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Output
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport(selectedGeneration)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedGeneration.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GenerationCard({
  generation,
  viewMode,
  onToggleFavorite,
  onDelete,
  onCopy,
  onExport,
  onView,
}: {
  generation: Generation;
  viewMode: ViewMode;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
  onExport: (gen: Generation) => void;
  onView: (gen: Generation) => void;
}) {
  const preview =
    generation.output_text.substring(0, 150) +
    (generation.output_text.length > 150 ? "..." : "");

  if (viewMode === "list") {
    return (
      <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414] hover:border-[#3a3a3a] transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() =>
                onToggleFavorite(generation.id, generation.is_favorite || false)
              }
              className="mt-1"
            >
              {generation.is_favorite ? (
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
              ) : (
                <Star className="h-5 w-5 text-gray-600" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold mb-1 truncate">
                {generation.title || "Untitled"}
              </h3>
              <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                {preview}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(generation.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(generation)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(generation.output_text)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport(generation)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(generation.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414] hover:border-[#3a3a3a] transition-colors h-full flex flex-col">
        <CardContent className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold truncate flex-1">
              {generation.title || "Untitled"}
            </h3>
            <button
              onClick={() =>
                onToggleFavorite(generation.id, generation.is_favorite || false)
              }
              className="ml-2 flex-shrink-0"
            >
              {generation.is_favorite ? (
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
              ) : (
                <Star className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
          <p className="text-sm text-gray-400 mb-4 line-clamp-3 flex-1">
            {preview}
          </p>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              {new Date(generation.created_at).toLocaleDateString()}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(generation)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(generation.output_text)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport(generation)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(generation.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
