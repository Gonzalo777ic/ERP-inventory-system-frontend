import { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Search } from "lucide-react";
import { ERP_APPS } from "../data/erpApps";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

export default function Apps() {
  const [query, setQuery] = useState("");

  const normalized = query.trim().toLowerCase();
  const apps = ERP_APPS.filter((app) => {
    if (!normalized) return true;
    return (
      app.name.toLowerCase().includes(normalized) ||
      app.description.toLowerCase().includes(normalized)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Aplicaciones</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Menú de apps del ERP. Abre un módulo existente o un placeholder.
          </p>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar app…"
            className="pl-9"
            aria-label="Buscar aplicaciones"
          />
        </div>
      </div>

      {apps.length === 0 ? (
        <p className="text-center py-10 text-muted-foreground">
          No hay aplicaciones que coincidan con «{query.trim()}».
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <li key={app.id}>
                <Link
                  to={app.path}
                  className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-4 text-center shadow-xl transition-colors duration-150 hover:bg-muted hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md transition-colors duration-150 group-hover:bg-primary/90">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="space-y-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {app.name}
                    </span>
                    <span className="block text-xs text-muted-foreground line-clamp-2">
                      {app.description}
                    </span>
                  </span>
                  {app.stub ? (
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      Próximamente
                    </Badge>
                  ) : (
                    <span className="h-5" aria-hidden />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
