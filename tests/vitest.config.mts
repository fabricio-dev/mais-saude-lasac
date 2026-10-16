import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const fromHere = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": fromHere("../src"),
      "@tests": fromHere("."),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**"],
    // O que cada teste troca com vi.stubEnv/vi.stubGlobal volta ao fim dele.
    unstubEnvs: true,
    unstubGlobals: true,
    // As datas do sistema são de São Paulo: o teste não depende do fuso da máquina.
    env: { TZ: "America/Sao_Paulo" },
  },
});
