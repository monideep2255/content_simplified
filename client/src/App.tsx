import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainPage } from "@/components/main-page";
import HistoryPage from "@/pages/history";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="min-h-screen bg-gray-50">
          <Switch>
            <Route path="/" component={MainPage} />
            <Route path="/history" component={HistoryPage} />
            <Route component={MainPage} />
          </Switch>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
