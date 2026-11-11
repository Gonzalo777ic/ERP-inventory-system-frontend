import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import { findErpApp } from "../data/erpApps";
import { Button } from "../components/ui/button";

export default function AppPlaceholder() {
  const { appId } = useParams<{ appId: string }>();
  const app = appId ? findErpApp(appId) : undefined;

  const title = app?.name ?? "Aplicación";
  const description =
    app?.description ??
    "Esta ruta es un placeholder estático del menú de apps.";

  return (
    <div className="space-y-6">
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-lg border border-border bg-card p-8 text-center shadow-xl space-y-4">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Construction className="h-6 w-6" aria-hidden />
          </span>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
            <p className="text-sm text-muted-foreground">
              Módulo en construcción — solo UI estática por ahora.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/apps">
              <ArrowLeft className="h-4 w-4" />
              Volver a Aplicaciones
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
