import { Navigation } from "@/components/navigation";
import { MainPage } from "@/components/main-page";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <MainPage />
    </div>
  );
}
