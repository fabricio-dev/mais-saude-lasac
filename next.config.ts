import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O dev server do Next bloqueia o JavaScript de desenvolvimento (/_next/*)
  // quando a página vem de outro endereço que não localhost: aberta pelo túnel,
  // a página não hidrata e só o fundo aparece. O túnel `lasac`
  // (~/.cloudflared/lasac.yml) aponta este endereço para o dev server na 3001.
  //
  // Vale só em desenvolvimento; `next build` ignora esta opção.
  allowedDevOrigins: ["lasac.condamus.com.br"],

  experimental: {
    // O padrão é 1 MB, e o arquivo vai no corpo da Server Action: a lista de
    // parceiros aceita até 10 MB, e a mídia dos lembretes até 16 MB (vídeo).
    serverActions: { bodySizeLimit: "20mb" },
  },
};

export default nextConfig;
