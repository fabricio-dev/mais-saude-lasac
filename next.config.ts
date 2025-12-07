import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desabilitar header X-Powered-By para não expor tecnologia
  poweredByHeader: false,

  // React Strict Mode para melhores práticas
  reactStrictMode: true,

  // Headers de segurança HTTP
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Configuração de imagens (se usar next/image no futuro)
  images: {
    remotePatterns: [
      // Adicionar apenas domínios confiáveis aqui
      // Exemplo:
      // {
      //   protocol: "https",
      //   hostname: "seudominio.com",
      // },
    ],
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
