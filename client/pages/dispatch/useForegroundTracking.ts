import { useEffect, useRef, useState } from "react";
import { dispatchService } from "../../api/services/dispatchService";

const GEOLOCATION_TIMEOUT_MS = 15_000;
const GEOLOCATION_MAX_AGE_MS = 0;

/**
 * Pide la posición solo con la pantalla visible y un recorrido en curso.
 * El intervalo sale de la política del servidor. No hay seguimiento en segundo plano.
 */
export function useForegroundTracking(
  enabled: boolean,
  onFix: (latitude: number, longitude: number) => void,
): string | null {
  const onFixRef = useRef(onFix);
  onFixRef.current = onFix;
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setHint(null);
      return;
    }
    if (!navigator.geolocation) {
      setHint("Este navegador no puede leer la ubicación.");
      return;
    }

    let timer: number | undefined;
    let cancelled = false;
    let denied = false;
    let removeListeners = () => {};

    const stopTimer = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    const send = () => {
      if (cancelled || denied || document.visibilityState !== "visible") return;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled || document.visibilityState !== "visible") return;
          onFixRef.current(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          if (cancelled) return;
          if (error.code === error.PERMISSION_DENIED) {
            denied = true;
            stopTimer();
            setHint("Sin permiso de ubicación no se registra el punto. El recorrido sigue en curso.");
            return;
          }
          setHint("No se pudo leer la ubicación. Se reintenta mientras la pantalla siga abierta.");
        },
        {
          enableHighAccuracy: true,
          timeout: GEOLOCATION_TIMEOUT_MS,
          maximumAge: GEOLOCATION_MAX_AGE_MS,
        },
      );
    };

    const arm = (intervalMs: number) => {
      stopTimer();
      if (document.visibilityState !== "visible" || denied) return;
      timer = window.setInterval(send, intervalMs);
    };

    const onVisibility = (intervalMs: number) => {
      if (document.visibilityState === "visible") {
        send();
        arm(intervalMs);
        return;
      }
      stopTimer();
    };

    setHint("Ubicación activa solo con esta pantalla abierta.");

    void dispatchService.policy().then((policy) => {
      if (cancelled) return;
      const intervalMs = policy.intervalSeconds * 1000;
      const onChange = () => onVisibility(intervalMs);
      const onHide = () => stopTimer();
      document.addEventListener("visibilitychange", onChange);
      window.addEventListener("pagehide", onHide);
      removeListeners = () => {
        document.removeEventListener("visibilitychange", onChange);
        window.removeEventListener("pagehide", onHide);
      };
      if (document.visibilityState === "visible") {
        send();
        arm(intervalMs);
      }
    }).catch(() => {
      if (!cancelled) {
        setHint("No hay política de ubicación. No se envían puntos.");
      }
    });

    return () => {
      cancelled = true;
      stopTimer();
      removeListeners();
    };
  }, [enabled]);

  return hint;
}
