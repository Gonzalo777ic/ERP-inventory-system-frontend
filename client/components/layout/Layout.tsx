import { Link, Outlet, useNavigate } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { useAuthStore } from "../../store/auth";
import { ThemeToggle } from "./ThemeToggle";
import { SidebarNavigation } from "./SidebarNavigation";

export default function Layout() {
  return (
    <div className="h-screen w-full overflow-hidden grid grid-rows-[auto_1fr] lg:grid-cols-[280px_1fr] lg:grid-rows-1">
      
      <aside className="hidden lg:flex flex-col border-r bg-gray-100 dark:bg-gray-900 overflow-y-auto h-full">
        <div className="p-4 sticky top-0 bg-gray-100 dark:bg-gray-900 z-10">
            <Brand />
        </div>
        <div className="px-4 pb-4">
            <SidebarNavigation />
        </div>
      </aside>

      <div className="flex flex-col h-full overflow-hidden">
        <Header />
        
        <main className="flex-1 p-4 md:p-6 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link
      to="/apps"
      className="flex items-center gap-3 text-lg font-semibold text-foreground transition-colors duration-150 hover:text-primary"
      aria-label="Ir a Aplicaciones"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        V
      </span>
      <span className="tracking-tight">ValeERP</span>
    </Link>
  );
}

function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user); 
  const logout = useAuthStore((s) => s.logout);
  
  return (
    <header className="flex-shrink-0 z-10 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:border-gray-700 h-16 flex items-center">
      <div className="flex items-center justify-between gap-2 px-4 w-full">
        <div className="lg:hidden flex items-center gap-2">
            <Brand />
        </div>
        
        <div className="flex items-center gap-3 ml-auto">
          <Link
            to="/apps"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted"
            aria-label="Abrir Aplicaciones"
          >
            <LayoutGrid className="h-5 w-5 text-primary" />
            <span className="hidden md:inline">Apps</span>
          </Link>
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l dark:border-gray-700">
            <div className="flex flex-col items-end">
                 <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name || user?.email?.split('@')[0] || "Usuario"}</span>
                 <span className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</span>
            </div>
            <button
              onClick={() => {
                logout(); 
                navigate("/login", { replace: true });
              }}
              className="ml-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 hover:text-red-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}