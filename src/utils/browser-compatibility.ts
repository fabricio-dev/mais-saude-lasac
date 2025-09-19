/**
 * Utilitários para detecção de navegadores legados e compatibilidade
 */

export interface BrowserInfo {
  isLegacyBrowser: boolean;
  isWindows7: boolean;
  isInternetExplorer: boolean;
  isOldChrome: boolean;
  isOldFirefox: boolean;
  browserName: string;
  browserVersion: string;
  needsPolyfills: boolean;
  supportsCSSVariables: boolean;
  supportsFlexbox: boolean;
  supportsGrid: boolean;
}

/**
 * Detecta informações sobre o navegador do usuário
 */
export function detectBrowserInfo(): BrowserInfo {
  // Valores padrão para SSR
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isLegacyBrowser: false,
      isWindows7: false,
      isInternetExplorer: false,
      isOldChrome: false,
      isOldFirefox: false,
      browserName: "unknown",
      browserVersion: "unknown",
      needsPolyfills: false,
      supportsCSSVariables: true,
      supportsFlexbox: true,
      supportsGrid: true,
    };
  }

  const userAgent = navigator.userAgent;

  // Detectar Windows 7
  const isWindows7 = /Windows NT 6\.1/.test(userAgent);

  // Detectar Internet Explorer (incluindo IE11)
  const isInternetExplorer = /MSIE|Trident/.test(userAgent);

  // Detectar versões antigas do Chrome
  const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
  const chromeVersion = chromeMatch ? parseInt(chromeMatch[1]) : 0;
  const isOldChrome = chromeVersion > 0 && chromeVersion < 80;

  // Detectar versões antigas do Firefox
  const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
  const firefoxVersion = firefoxMatch ? parseInt(firefoxMatch[1]) : 0;
  const isOldFirefox = firefoxVersion > 0 && firefoxVersion < 75;

  // Detectar Edge antigo
  const isOldEdge = /Edge\/(\d+)/.test(userAgent);

  // Determinar se é navegador legado
  const isLegacyBrowser =
    isWindows7 ||
    isInternetExplorer ||
    isOldChrome ||
    isOldFirefox ||
    isOldEdge;

  // Testar suporte a CSS Variables
  const supportsCSSVariables =
    CSS && CSS.supports && CSS.supports("color", "var(--fake-var)");

  // Testar suporte a Flexbox
  const supportsFlexbox =
    CSS && CSS.supports && CSS.supports("display", "flex");

  // Testar suporte a CSS Grid
  const supportsGrid = CSS && CSS.supports && CSS.supports("display", "grid");

  // Determinar nome e versão do navegador
  let browserName = "unknown";
  let browserVersion = "unknown";

  if (isInternetExplorer) {
    browserName = "Internet Explorer";
    const ieVersionMatch = userAgent.match(/(?:MSIE |Trident\/.*; rv:)(\d+)/);
    browserVersion = ieVersionMatch ? ieVersionMatch[1] : "unknown";
  } else if (chromeMatch) {
    browserName = "Chrome";
    browserVersion = chromeMatch[1];
  } else if (firefoxMatch) {
    browserName = "Firefox";
    browserVersion = firefoxMatch[1];
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    browserName = "Safari";
    const safariMatch = userAgent.match(/Version\/(\d+)/);
    browserVersion = safariMatch ? safariMatch[1] : "unknown";
  } else if (userAgent.includes("Edge")) {
    browserName = "Edge";
    const edgeMatch = userAgent.match(/Edge\/(\d+)/);
    browserVersion = edgeMatch ? edgeMatch[1] : "unknown";
  }

  return {
    isLegacyBrowser,
    isWindows7,
    isInternetExplorer,
    isOldChrome,
    isOldFirefox,
    browserName,
    browserVersion,
    needsPolyfills: isLegacyBrowser,
    supportsCSSVariables,
    supportsFlexbox,
    supportsGrid,
  };
}

/**
 * Aplica classes CSS de fallback para navegadores legados
 */
export function applyLegacyBrowserClasses(): void {
  if (typeof document === "undefined") return;

  const browserInfo = detectBrowserInfo();

  if (browserInfo.isLegacyBrowser) {
    document.documentElement.classList.add("legacy-browser");
  }

  if (browserInfo.isWindows7) {
    document.documentElement.classList.add("windows-7");
  }

  if (browserInfo.isInternetExplorer) {
    document.documentElement.classList.add("internet-explorer");
  }

  if (!browserInfo.supportsCSSVariables) {
    document.documentElement.classList.add("no-css-variables");
  }

  if (!browserInfo.supportsFlexbox) {
    document.documentElement.classList.add("no-flexbox");
  }

  if (!browserInfo.supportsGrid) {
    document.documentElement.classList.add("no-grid");
  }
}

/**
 * Mostra aviso para usuários de navegadores legados
 */
export function showBrowserUpdateWarning(): void {
  if (typeof document === "undefined") return;

  const browserInfo = detectBrowserInfo();

  if (!browserInfo.isLegacyBrowser) return;

  // Criar elemento de aviso
  const warningDiv = document.createElement("div");
  warningDiv.id = "legacy-browser-warning";
  warningDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #fbbf24;
    color: #92400e;
    padding: 12px;
    text-align: center;
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: bold;
    z-index: 9999;
    border-bottom: 2px solid #f59e0b;
  `;

  let message = "";
  if (browserInfo.isWindows7) {
    message =
      "⚠️ Você está usando Windows 7. Para melhor experiência, atualize seu navegador ou sistema operacional.";
  } else if (browserInfo.isInternetExplorer) {
    message =
      "⚠️ Internet Explorer não é mais suportado. Use Chrome, Firefox ou Edge para melhor experiência.";
  } else {
    message =
      "⚠️ Seu navegador está desatualizado. Atualize para a versão mais recente para melhor experiência.";
  }

  warningDiv.innerHTML = `
    ${message}
    <button onclick="this.parentElement.style.display='none'" style="margin-left: 10px; background: #92400e; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">×</button>
  `;

  // Inserir no início do body
  document.body.insertBefore(warningDiv, document.body.firstChild);

  // Ajustar margin-top do body para compensar o aviso
  document.body.style.marginTop = "50px";
}

/**
 * Carrega polyfills necessários para navegadores legados
 */
export function loadPolyfills(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const browserInfo = detectBrowserInfo();

  if (!browserInfo.needsPolyfills) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    // Lista de polyfills a serem carregados
    const polyfills: string[] = [];

    // CSS Variables polyfill
    if (!browserInfo.supportsCSSVariables) {
      polyfills.push(
        "https://cdn.jsdelivr.net/npm/css-vars-ponyfill@2/dist/css-vars-ponyfill.min.js",
      );
    }

    // Flexbox polyfill para IE
    if (browserInfo.isInternetExplorer) {
      polyfills.push(
        "https://cdn.jsdelivr.net/npm/flexibility@2/flexibility.js",
      );
    }

    // Carregar polyfills sequencialmente
    let loadedCount = 0;
    const totalPolyfills = polyfills.length;

    if (totalPolyfills === 0) {
      resolve();
      return;
    }

    polyfills.forEach((polyfillUrl) => {
      const script = document.createElement("script");
      script.src = polyfillUrl;
      script.onload = () => {
        loadedCount++;
        if (loadedCount === totalPolyfills) {
          // Inicializar CSS Variables polyfill se carregado
          if (
            !browserInfo.supportsCSSVariables &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).cssVars
          ) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).cssVars({
              watch: true,
              preserveStatic: false,
              preserveVars: false,
            });
          }
          resolve();
        }
      };
      script.onerror = () => {
        loadedCount++;
        if (loadedCount === totalPolyfills) {
          resolve();
        }
      };
      document.head.appendChild(script);
    });
  });
}
