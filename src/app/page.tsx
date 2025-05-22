import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import DashboardCards from "@/components/DashboardCards";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-slate-2 dark:bg-slate-1 transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-8">
          <div className="border-2 border-dashed border-slate-5 dark:border-slate-8 rounded-2xl min-h-[500px] bg-[repeating-linear-gradient(135deg,#f4f6fb_0px,#f4f6fb_4px,#fff_4px,#fff_20px)] dark:bg-none flex flex-col justify-center items-center transition-colors">
            <DashboardCards />
          </div>
        </main>
      </div>
    </div>
  );
}
