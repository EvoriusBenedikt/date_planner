import { getCtx } from "@/lib/auth";
import { BottomNav, TopNav } from "@/components/app-nav";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await getCtx(); // couple gate for every page in this group
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-5 pb-24 sm:px-6 md:pb-10">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
