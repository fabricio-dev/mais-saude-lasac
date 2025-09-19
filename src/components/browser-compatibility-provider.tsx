"use client";

import { useEffect } from "react";

import {
  applyLegacyBrowserClasses,
  detectBrowserInfo,
  loadPolyfills,
  showBrowserUpdateWarning,
} from "@/utils/browser-compatibility";

interface BrowserCompatibilityProviderProps {
  children: React.ReactNode;
  showWarning?: boolean;
}

/**
 * Provider que detecta navegadores legados e aplica correções de compatibilidade
 */
export function BrowserCompatibilityProvider({
  children,
  showWarning = true,
}: BrowserCompatibilityProviderProps) {
  useEffect(() => {
    // Função para inicializar compatibilidade
    const initializeCompatibility = async () => {
      try {
        // Detectar informações do navegador
        const browserInfo = detectBrowserInfo();

        // Aplicar classes CSS de fallback
        applyLegacyBrowserClasses();

        // Carregar polyfills se necessário
        if (browserInfo.needsPolyfills) {
          await loadPolyfills();
        }

        // Mostrar aviso para navegadores legados
        if (showWarning && browserInfo.isLegacyBrowser) {
          showBrowserUpdateWarning();
        }

        // Log para debug (apenas em desenvolvimento)
        if (process.env.NODE_ENV === "development") {
          console.log("🌐 Browser Compatibility Info:", browserInfo);
        }
      } catch (error) {
        console.error(
          "Erro ao inicializar compatibilidade do navegador:",
          error,
        );
      }
    };

    // Aguardar DOM estar pronto
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeCompatibility);
    } else {
      initializeCompatibility();
    }

    // Cleanup
    return () => {
      document.removeEventListener("DOMContentLoaded", initializeCompatibility);
    };
  }, [showWarning]);

  return <>{children}</>;
}

/**
 * Hook para acessar informações do navegador
 */
export function useBrowserInfo() {
  const browserInfo = detectBrowserInfo();

  return {
    ...browserInfo,
    // Helpers adicionais
    canUseModernFeatures: !browserInfo.isLegacyBrowser,
    shouldShowFallback: browserInfo.isLegacyBrowser,
    recommendedBrowsers: [
      "Chrome 80+",
      "Firefox 75+",
      "Edge 80+",
      "Safari 13+",
    ],
  };
}
