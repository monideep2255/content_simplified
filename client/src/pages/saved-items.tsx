import { Navigation } from "@/components/navigation";
import { SavedItemsPage } from "@/components/saved-items-page";

export default function SavedItems() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <SavedItemsPage />
    </div>
  );
}
