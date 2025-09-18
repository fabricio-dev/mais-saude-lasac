"use client";

import Script from "next/script";

export function LegacySupportScript() {
  return (
    <>
      {/* Meta tags para melhor compatibilidade */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Script inline para detectar navegador legado e aplicar polyfills */}
      <Script id="legacy-support" strategy="afterInteractive">
        {`
          (function() {
            // Detecta navegadores legados
            function isLegacyBrowser() {
              var ua = navigator.userAgent;
              
              // IE 11 e versões anteriores
              if (ua.indexOf('MSIE') !== -1 || ua.indexOf('Trident/') !== -1) {
                return true;
              }
              
              // Chrome muito antigo (< 60)
              var chromeMatch = ua.match(/Chrome\\/(\d+)/);
              if (chromeMatch && parseInt(chromeMatch[1], 10) < 60) {
                return true;
              }
              
              // Firefox muito antigo (< 55)
              var firefoxMatch = ua.match(/Firefox\\/(\d+)/);
              if (firefoxMatch && parseInt(firefoxMatch[1], 10) < 55) {
                return true;
              }
              
              // Safari muito antigo (< 12)
              var safariMatch = ua.match(/Version\\/(\d+).*Safari/);
              if (safariMatch && parseInt(safariMatch[1], 10) < 12) {
                return true;
              }
              
              return false;
            }
            
            // Se for navegador legado, adiciona classe ao body
            if (isLegacyBrowser()) {
              document.documentElement.className += ' legacy-browser';
              
              // Polyfill básico para CSS Custom Properties
              if (!window.CSS || !CSS.supports || !CSS.supports('color', 'var(--test)')) {
                // Adiciona um estilo inline com cores fixas
                var style = document.createElement('style');
                style.textContent = \`
                  .legacy-browser {
                    --primary: #3b82f6;
                    --background: #ffffff;
                    --foreground: #0f172a;
                    --card: #ffffff;
                    --border: #e2e8f0;
                    --muted: #f1f5f9;
                    --secondary: #f1f5f9;
                    --destructive: #ef4444;
                  }
                  .legacy-browser .bg-primary { background-color: #3b82f6 !important; }
                  .legacy-browser .text-primary { color: #3b82f6 !important; }
                  .legacy-browser .border-primary { border-color: #3b82f6 !important; }
                  .legacy-browser .bg-background { background-color: #ffffff !important; }
                  .legacy-browser .text-foreground { color: #0f172a !important; }
                  .legacy-browser .bg-card { background-color: #ffffff !important; }
                  .legacy-browser .text-card-foreground { color: #0f172a !important; }
                  .legacy-browser .bg-secondary { background-color: #f1f5f9 !important; }
                  .legacy-browser .text-secondary-foreground { color: #334155 !important; }
                  .legacy-browser .bg-muted { background-color: #f1f5f9 !important; }
                  .legacy-browser .text-muted-foreground { color: #64748b !important; }
                  .legacy-browser .border-border { border-color: #e2e8f0 !important; }
                  .legacy-browser .bg-destructive { background-color: #ef4444 !important; }
                  .legacy-browser .text-destructive-foreground { color: #ffffff !important; }
                  
                  /* Tema escuro para navegadores legados */
                  .legacy-browser.dark .bg-background { background-color: #0f172a !important; }
                  .legacy-browser.dark .text-foreground { color: #f8fafc !important; }
                  .legacy-browser.dark .bg-card { background-color: #1e293b !important; }
                  .legacy-browser.dark .text-card-foreground { color: #f8fafc !important; }
                  .legacy-browser.dark .bg-secondary { background-color: #334155 !important; }
                  .legacy-browser.dark .text-secondary-foreground { color: #f8fafc !important; }
                  .legacy-browser.dark .bg-muted { background-color: #334155 !important; }
                  .legacy-browser.dark .text-muted-foreground { color: #94a3b8 !important; }
                  .legacy-browser.dark .border-border { border-color: rgba(255, 255, 255, 0.1) !important; }
                \`;
                document.head.appendChild(style);
              }
            }
          })();
        `}
      </Script>
    </>
  );
}
