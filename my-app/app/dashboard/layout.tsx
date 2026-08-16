"use client";

import Link from "next/link";
import { LayoutDashboard, Activity, Shield, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const sidebarItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Activity Insights", href: "/dashboard/activity", icon: Activity },
  { name: "Privacy Center", href: "/dashboard/privacy", icon: Shield },
  { name: "Controls", href: "/dashboard/controls", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
          {/* Sidebar Header Removed - Using Global Floating Header */}
          <div className="pt-24"> {/* Added padding to clear the floating header */}
          
          <nav className="p-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                    isActive 
                      ? "bg-slate-50 text-slate-900 shadow-sm border border-slate-200" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <item.icon className={cn("size-4 transition-colors", isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* STATUS FOOTER */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">System Status</p>
           <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-xs font-bold text-slate-700">Protocol Active</span>
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative bg-slate-50/50">
        
        {/* Internal Header Removed - Using Global Floating Header */}

        <div className="p-8 pt-24 max-w-7xl mx-auto relative z-0">
          {children}
        </div>
      </main>
    </div>
  );
}
