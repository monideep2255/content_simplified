import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Home, Bookmark, Brain } from "lucide-react";
import { useExplanations } from "@/hooks/use-content-simplifier";

export function Navigation() {
  const [location] = useLocation();
  const { data: explanations = [] } = useExplanations();
  
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Brain className="text-white" size={16} />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Content Simplifier</h1>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                <span className="font-medium">Navigate</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {explanations.length}
                </Badge>
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/" className="flex items-center space-x-3 cursor-pointer">
                  <Home className="text-blue-500" size={16} />
                  <span>Main Page</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/saved" className="flex items-center space-x-3 cursor-pointer">
                  <Bookmark className="text-green-500" size={16} />
                  <span>Saved Items</span>
                  <Badge variant="secondary" className="ml-auto bg-gray-100 text-gray-600">
                    {explanations.length}
                  </Badge>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
