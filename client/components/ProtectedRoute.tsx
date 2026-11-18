import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { LogOut, RotateCcw } from "lucide-react";
import { useAuthStore } from "../store/auth";
import { BrandLoader } from "./BrandLoader";
import { Button } from "./ui/button";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: string[];
}

const ROLE_CLAIM_KEY = "https://valeerp.local/roles";

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const logout = useAuthStore((state) => state.logout);
  const { loginWithRedirect } = useAuth0();


  if (!isAuthReady) {
    return (
      <BrandLoader label="Verificando permisos..." />
    );
  }


  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }


  const userRoles: string[] = (user as any)?.[ROLE_CLAIM_KEY] || [];
  const isStaff = userRoles.some((role) => role !== "ROLE_CLIENT");



  if (!isStaff) {
    const account = user?.email || "esta cuenta";
    return (
      <div className="flex min-h-screen items-center bg-background p-4 md:p-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-lg border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-2 border-l-4 border-destructive pl-4">
            <h1 className="text-xl font-bold text-foreground">Acceso restringido</h1>
            <p className="text-sm text-muted-foreground">
              {account} no tiene un rol de gestión. Pide al administrador que te asigne uno.
              Cierra la sesión y vuelve a entrar para que el cambio quede aplicado.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
            <Button type="button" onClick={() => logout()}>
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void loginWithRedirect({
                  authorizationParams: { prompt: "login" },
                });
              }}
            >
              <RotateCcw className="h-5 w-5" />
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }


  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));
    if (!hasPermission) {

      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;