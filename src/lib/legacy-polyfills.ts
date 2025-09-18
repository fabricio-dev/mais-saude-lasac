/**
 * Polyfills e fallbacks para navegadores legados
 * Garante compatibilidade com IE11 e versões antigas do Chrome/Firefox
 */

// Polyfill para CSS Custom Properties (CSS Variables)
export function initCSSVariablesPolyfill() {
  // Verifica se o navegador suporta CSS Custom Properties
  if (!window.CSS || !CSS.supports || !CSS.supports("color", "var(--test)")) {
    // Aplica cores diretamente via JavaScript para navegadores antigos
    const applyLegacyColors = () => {
      const root = document.documentElement;
      const isDark = root.classList.contains("dark");

      // Define as cores baseado no tema
      const colors = isDark
        ? {
            background: "#0f172a",
            foreground: "#f8fafc",
            card: "#1e293b",
            "card-foreground": "#f8fafc",
            primary: "#3b82f6",
            "primary-foreground": "#1e293b",
            secondary: "#334155",
            "secondary-foreground": "#f8fafc",
            muted: "#334155",
            "muted-foreground": "#94a3b8",
            border: "rgba(255, 255, 255, 0.1)",
            destructive: "#ef4444",
          }
        : {
            background: "#ffffff",
            foreground: "#0f172a",
            card: "#ffffff",
            "card-foreground": "#0f172a",
            primary: "#3b82f6",
            "primary-foreground": "#f8fafc",
            secondary: "#f1f5f9",
            "secondary-foreground": "#334155",
            muted: "#f1f5f9",
            "muted-foreground": "#64748b",
            border: "#e2e8f0",
            destructive: "#ef4444",
          };

      // Aplica as cores aos elementos
      Object.entries(colors).forEach(([name, value]) => {
        const elements = document.querySelectorAll(
          `[class*="bg-${name}"], [class*="text-${name}"], [class*="border-${name}"]`,
        );
        elements.forEach((element) => {
          const classList = Array.from(element.classList);
          classList.forEach((className) => {
            if (className.startsWith(`bg-${name}`)) {
              (element as HTMLElement).style.backgroundColor = value;
            }
            if (className.startsWith(`text-${name}`)) {
              (element as HTMLElement).style.color = value;
            }
            if (className.startsWith(`border-${name}`)) {
              (element as HTMLElement).style.borderColor = value;
            }
          });
        });
      });
    };

    // Aplica as cores inicialmente
    applyLegacyColors();

    // Observa mudanças no tema
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          applyLegacyColors();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
}

// Polyfill para Array.from (IE11)
export function initArrayPolyfills() {
  if (!Array.from) {
    (Array as unknown as Record<string, unknown>).from = (function () {
      const toStr = Object.prototype.toString;
      const isCallable = function (
        fn: unknown,
      ): fn is (...args: unknown[]) => unknown {
        return (
          typeof fn === "function" || toStr.call(fn) === "[object Function]"
        );
      };
      const toInteger = function (value: unknown): number {
        const number = Number(value);
        if (isNaN(number)) {
          return 0;
        }
        if (number === 0 || !isFinite(number)) {
          return number;
        }
        return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
      };
      const maxSafeInteger = Math.pow(2, 53) - 1;
      const toLength = function (value: unknown): number {
        const len = toInteger(value);
        return Math.min(Math.max(len, 0), maxSafeInteger);
      };

      return function from(
        arrayLike: ArrayLike<unknown>,
        mapFn?: (v: unknown, k: number) => unknown,
        thisArg?: unknown,
      ): unknown[] {
        const items = Object(arrayLike);
        if (arrayLike == null) {
          throw new TypeError(
            "Array.from requires an array-like object - not null or undefined",
          );
        }
        const mapFunction = arguments.length > 1 ? mapFn : void undefined;
        let T;
        if (typeof mapFunction !== "undefined") {
          if (!isCallable(mapFunction)) {
            throw new TypeError(
              "Array.from: when provided, the second argument must be a function",
            );
          }
          if (arguments.length > 2) {
            T = thisArg;
          }
        }
        const len = toLength(items.length);
        const A = new Array(len);
        let k = 0;
        let kValue;
        while (k < len) {
          kValue = items[k];
          if (mapFunction) {
            A[k] =
              typeof T === "undefined"
                ? mapFunction(kValue, k)
                : mapFunction.call(T, kValue, k);
          } else {
            A[k] = kValue;
          }
          k += 1;
        }
        A.length = len;
        return A;
      };
    })();
  }
}

// Polyfill para Object.assign (IE11)
export function initObjectPolyfills() {
  if (typeof Object.assign !== "function") {
    Object.assign = function (target: unknown, ...sources: unknown[]): unknown {
      if (target == null) {
        throw new TypeError("Cannot convert undefined or null to object");
      }
      const to = Object(target);
      for (let index = 0; index < sources.length; index++) {
        const nextSource = sources[index];
        if (nextSource != null) {
          for (const nextKey in nextSource as Record<string, unknown>) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              (to as Record<string, unknown>)[nextKey] = (
                nextSource as Record<string, unknown>
              )[nextKey];
            }
          }
        }
      }
      return to;
    };
  }
}

// Polyfill para Element.closest (IE11)
export function initDOMPolyfills() {
  if (!Element.prototype.closest) {
    Element.prototype.closest = function (
      this: Element,
      s: string,
    ): Element | null {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let currentElement: Element | null = this;
      do {
        if (currentElement.matches && currentElement.matches(s))
          return currentElement;
        currentElement =
          currentElement.parentElement ||
          (currentElement.parentNode as Element);
      } while (currentElement !== null && currentElement.nodeType === 1);
      return null;
    };
  }

  if (!Element.prototype.matches) {
    const elementPrototype = Element.prototype as unknown as Record<
      string,
      unknown
    >;
    Element.prototype.matches =
      (elementPrototype.matchesSelector as (s: string) => boolean) ||
      (elementPrototype.mozMatchesSelector as (s: string) => boolean) ||
      (elementPrototype.msMatchesSelector as (s: string) => boolean) ||
      (elementPrototype.oMatchesSelector as (s: string) => boolean) ||
      (elementPrototype.webkitMatchesSelector as (s: string) => boolean) ||
      function (this: Element, s: string): boolean {
        const matches = (this.ownerDocument || document).querySelectorAll(s);
        let i = matches.length;
        while (--i >= 0 && matches.item(i) !== this) {}
        return i > -1;
      };
  }
}

// Polyfill para fetch API (IE11)
export function initFetchPolyfill() {
  if (!window.fetch) {
    console.warn(
      "Fetch API não suportada. Considere adicionar um polyfill como whatwg-fetch",
    );
  }
}

// Função principal para inicializar todos os polyfills
export function initLegacySupport() {
  // Só executa se estivermos no navegador
  if (typeof window === "undefined") return;

  initArrayPolyfills();
  initObjectPolyfills();
  initDOMPolyfills();
  initFetchPolyfill();

  // Aguarda o DOM estar pronto antes de aplicar os polyfills CSS
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCSSVariablesPolyfill);
  } else {
    initCSSVariablesPolyfill();
  }
}

// Detecta se é um navegador legado
export function isLegacyBrowser(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent;

  // IE 11 e versões anteriores
  if (ua.indexOf("MSIE") !== -1 || ua.indexOf("Trident/") !== -1) {
    return true;
  }

  // Chrome muito antigo (< 60)
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  if (chromeMatch && parseInt(chromeMatch[1], 10) < 60) {
    return true;
  }

  // Firefox muito antigo (< 55)
  const firefoxMatch = ua.match(/Firefox\/(\d+)/);
  if (firefoxMatch && parseInt(firefoxMatch[1], 10) < 55) {
    return true;
  }

  // Safari muito antigo (< 12)
  const safariMatch = ua.match(/Version\/(\d+).*Safari/);
  if (safariMatch && parseInt(safariMatch[1], 10) < 12) {
    return true;
  }

  return false;
}
