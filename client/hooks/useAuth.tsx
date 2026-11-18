import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useRef } from "react";
import { identityApiBase } from "../api/apiBases";
import { useAuthStore } from "../store/auth.ts";

interface AuthTokenResult {
  token: string;
  roles: string[];
  claims: any;
}

export const useAuth = () => {
  const {
    isAuthenticated,
    user,
    isLoading,
    logout: auth0Logout,
    getAccessTokenSilently,
    getIdTokenClaims,
  } = useAuth0();

  const { setIsAuthReady, setLogoutFunction, setUser, setToken, syncAuth } = useAuthStore();
  const isSyncedRef = useRef(false);

  const logout = useCallback(() => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    setUser(null);
  }, [auth0Logout, setUser]);

  useEffect(() => {
    setLogoutFunction(logout);
  }, [logout, setLogoutFunction]);

  const getAuthToken = useCallback(async (): Promise<AuthTokenResult | undefined> => {
    if (!isAuthenticated) return undefined;
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: "https://valeerp.inventory.api",
          scope: "openid profile email",
        },
      });
      const claims = await getIdTokenClaims();
      const roleClaim = "https://valeerp.local/roles";
      const roles: string[] = claims && claims[roleClaim] ? (claims[roleClaim] as string[]) : [];

      console.log("--- [AUTH] Token JWT de Auth0 Obtenido ---");
      return { token, roles, claims };
    } catch (error) {
      console.error("Error al obtener token de Auth0:", error);
      return undefined;
    }
  }, [isAuthenticated, getAccessTokenSilently, getIdTokenClaims]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      syncAuth(false, null);
      setIsAuthReady(true);
      isSyncedRef.current = false;
      return;
    }

    const initializeSession = async () => {
      const result = await getAuthToken();
      
      if (result) {
        setToken(result.token);
        const userWithClaims = { ...user, ...result.claims };
        
        syncAuth(true, userWithClaims);

        if (!isSyncedRef.current) {
          try {
            fetch(`${identityApiBase()}/auth/auth0-upsert`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ auth0Id: user?.sub, email: user?.email, roles: result.roles }),
            }).then((res) => {
              if (res.ok) isSyncedRef.current = true;
            });
          } catch (error) {
            console.error("No se pudo registrar la sesión en identidad.", error);
          }
        }
      } else {
        syncAuth(true, user);
      }
      
      setIsAuthReady(true);
    };

    initializeSession();
  }, [isLoading, isAuthenticated, user, getAuthToken, syncAuth, setIsAuthReady, setToken]);

  return { isAuthenticated, user, isLoading, logout, getAuthToken };
};