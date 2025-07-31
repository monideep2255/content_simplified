import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookmarkIcon, Trash2, Copy, Calendar, Brain, Eye, Download, FileText, FileImage, CalendarIcon, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  getAllExplanations, 
  searchExplanations, 
  toggleBookmark, 
  deleteExplanation 
} from "@/lib/api";
import type { ExplanationWithFollowups } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";
import ExplanationModal from "@/components/explanation-modal";
import { exportExplanation, exportMultipleExplanations, type ExportFormat } from "@/lib/export-utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { addDays, subDays, subWeeks, subMonths, startOfDay, endOfDay } from "date-fns";

const categoryColors = {
  ai: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  money: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", 
  tech: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  business: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

interface SearchFilters {
  query: string;
  category: string;
  bookmarkedOnly: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  contentType?: string; // 'url' | 'text' | 'file'
}

export default function HistoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: "",
    category: "",
    bookmarkedOnly: false,
    dateFrom: undefined,
    dateTo: undefined,
    contentType: ""
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedExplanation, setSelectedExplanation] = useState<ExplanationWithFollowups | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all explanations
  const { data: allExplanationsData, isLoading: allLoading } = useQuery({
    queryKey: ['/api/explanations'],
    queryFn: getAllExplanations,
  });

  // Search explanations
  const searchMutation = useMutation({
    mutationFn: searchExplanations,
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/explanations/search', searchFilters], data);
    }
  });

  // Toggle bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: toggleBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/explanations'] });
      toast({
        title: "Bookmark Updated",
        description: "Explanation bookmark status changed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    }
  });

  // Delete explanation mutation
  const deleteMutation = useMutation({
    mutationFn: deleteExplanation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/explanations'] });
      toast({
        title: "Deleted",
        description: "Explanation deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: "Failed to delete explanation",
        variant: "destructive",
      });
    }
  });

  const handleSearch = () => {
    const filters = {
      query: searchFilters.query || undefined,
      category: searchFilters.category || undefined,
      bookmarkedOnly: searchFilters.bookmarkedOnly,
      dateFrom: searchFilters.dateFrom,
      dateTo: searchFilters.dateTo,
      contentType: searchFilters.contentType || undefined
    };
    searchMutation.mutate(filters);
  };

  const handleDatePreset = (preset: string) => {
    const now = new Date();
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined = endOfDay(now);

    switch (preset) {
      case 'today':
        dateFrom = startOfDay(now);
        break;
      case 'week':
        dateFrom = startOfDay(subWeeks(now, 1));
        break;
      case 'month':
        dateFrom = startOfDay(subMonths(now, 1));
        break;
      case 'clear':
        dateFrom = undefined;
        dateTo = undefined;
        break;
    }

    setSearchFilters(prev => ({
      ...prev,
      dateFrom,
      dateTo
    }));
  };

  const clearAllFilters = () => {
    setSearchFilters({
      query: "",
      category: "",
      bookmarkedOnly: false,
      dateFrom: undefined,
      dateTo: undefined,
      contentType: ""
    });
    setActiveTab("all");
  };

  const handleCopyExplanation = (explanation: ExplanationWithFollowups) => {
    const content = `${explanation.title}\n\n${explanation.simplifiedContent}`;
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Explanation copied to clipboard.",
    });
  };

  const handleViewExplanation = (explanation: ExplanationWithFollowups) => {
    setSelectedExplanation(explanation);
    setIsModalOpen(true);
  };

  const handleExportSingle = async (explanation: ExplanationWithFollowups, format: ExportFormat) => {
    try {
      await exportExplanation(explanation, format);
      toast({
        title: "Export Successful",
        description: `Explanation exported as ${format.toUpperCase()} file.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export explanation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportAll = async (format: ExportFormat) => {
    const explanationsToExport = activeTab === "bookmarked" ? bookmarkedExplanations : displayExplanations;
    
    if (explanationsToExport.length === 0) {
      toast({
        title: "Nothing to Export",
        description: "No explanations available to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      await exportMultipleExplanations(explanationsToExport, format);
      toast({
        title: "Export Successful",
        description: `${explanationsToExport.length} explanations exported as ${format.toUpperCase()} file.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export explanations. Please try again.",
        variant: "destructive",
      });
    }
  };

  const allExplanations = allExplanationsData?.explanations || [];
  const bookmarkedExplanations = allExplanations.filter(e => e.isBookmarked);
  const searchResults = searchMutation.data?.explanations || [];

  const getDisplayExplanations = () => {
    if (searchMutation.isSuccess && (searchFilters.query || searchFilters.category || searchFilters.bookmarkedOnly)) {
      return searchResults;
    }
    
    switch (activeTab) {
      case "bookmarked":
        return bookmarkedExplanations;
      default:
        return allExplanations;
    }
  };

  const displayExplanations = getDisplayExplanations();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Content History
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Browse and manage your saved explanations
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <Input
                  placeholder="Search explanations..."
                  value={searchFilters.query}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, query: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="min-w-[180px]">
                <Select
                  value={searchFilters.category || "all"}
                  onValueChange={(value) => setSearchFilters(prev => ({ ...prev, category: value === "all" ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="ai">AI</SelectItem>
                    <SelectItem value="money">Money</SelectItem>
                    <SelectItem value="tech">Tech</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
                <Button 
                  onClick={handleSearch}
                  disabled={searchMutation.isPending}
                >
                  {searchMutation.isPending ? "Searching..." : "Search"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export All
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExportAll('pdf')}>
                      <FileImage className="w-4 h-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportAll('docx')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export as Word
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportAll('txt')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export as Text
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="border-t pt-4 mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Content Type Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Content Type
                    </label>
                    <Select
                      value={searchFilters.contentType}
                      onValueChange={(value) => setSearchFilters(prev => ({ ...prev, contentType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="url">URLs</SelectItem>
                        <SelectItem value="text">Text Input</SelectItem>
                        <SelectItem value="file">File Uploads</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Quick Presets */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Quick Date Filters
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDatePreset('today')}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDatePreset('week')}
                      >
                        This Week
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDatePreset('month')}
                      >
                        This Month
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDatePreset('clear')}
                      >
                        Clear Dates
                      </Button>
                    </div>
                  </div>

                  {/* Custom Date Range */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Custom Date Range
                    </label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {searchFilters.dateFrom ? format(searchFilters.dateFrom, "MMM dd") : "From"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={searchFilters.dateFrom}
                            onSelect={(date) => setSearchFilters(prev => ({ ...prev, dateFrom: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {searchFilters.dateTo ? format(searchFilters.dateTo, "MMM dd") : "To"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={searchFilters.dateTo}
                            onSelect={(date) => setSearchFilters(prev => ({ ...prev, dateTo: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(searchFilters.dateFrom || searchFilters.dateTo || searchFilters.contentType) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                    {searchFilters.dateFrom && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        From: {format(searchFilters.dateFrom, "MMM dd, yyyy")}
                      </Badge>
                    )}
                    {searchFilters.dateTo && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        To: {format(searchFilters.dateTo, "MMM dd, yyyy")}
                      </Badge>
                    )}
                    {searchFilters.contentType && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Type: {searchFilters.contentType.charAt(0).toUpperCase() + searchFilters.contentType.slice(1)}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Explanations ({allExplanations.length})</TabsTrigger>
            <TabsTrigger value="bookmarked">Bookmarked ({bookmarkedExplanations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {allLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300">Loading explanations...</p>
              </div>
            ) : displayExplanations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300">
                  {searchMutation.isSuccess ? "No explanations found matching your search." : "No explanations saved yet."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayExplanations.map((explanation) => (
                  <Card key={explanation.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2">
                          {explanation.title}
                        </CardTitle>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewExplanation(explanation)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => bookmarkMutation.mutate(explanation.id)}
                            disabled={bookmarkMutation.isPending}
                            title="Toggle Bookmark"
                          >
                            <BookmarkIcon 
                              className={`w-4 h-4 ${explanation.isBookmarked ? 'fill-current text-yellow-500' : 'text-gray-400'}`} 
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyExplanation(explanation)}
                            title="Copy to Clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(explanation.id)}
                            disabled={deleteMutation.isPending}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={categoryColors[explanation.category]}>
                          {explanation.category.toUpperCase()}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(explanation.createdAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">
                        {explanation.simplifiedContent}
                      </p>
                      {explanation.followups.length > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {explanation.followups.length} follow-up question{explanation.followups.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookmarked" className="space-y-4">
            {bookmarkedExplanations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300">No bookmarked explanations yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bookmarkedExplanations.map((explanation) => (
                  <Card key={explanation.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2">
                          {explanation.title}
                        </CardTitle>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewExplanation(explanation)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => bookmarkMutation.mutate(explanation.id)}
                            disabled={bookmarkMutation.isPending}
                            title="Toggle Bookmark"
                          >
                            <BookmarkIcon className="w-4 h-4 fill-current text-yellow-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyExplanation(explanation)}
                            title="Copy to Clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(explanation.id)}
                            disabled={deleteMutation.isPending}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={categoryColors[explanation.category]}>
                          {explanation.category.toUpperCase()}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(explanation.createdAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent 
                      className="cursor-pointer"
                      onClick={() => handleViewExplanation(explanation)}
                    >
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">
                        {explanation.simplifiedContent}
                      </p>
                      {explanation.followups.length > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {explanation.followups.length} follow-up question{explanation.followups.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Explanation Modal */}
        <ExplanationModal 
          explanation={selectedExplanation}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
}