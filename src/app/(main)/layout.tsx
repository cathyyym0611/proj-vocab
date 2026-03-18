import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:pl-60 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
