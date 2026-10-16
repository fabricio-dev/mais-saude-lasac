import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // O que cada teste troca com vi.stubEnv/vi.stubGlobal volta ao fim dele.
    unstubEnvs: true,
    unstubGlobals: true,
    // As datas do sistema são de São Paulo: o teste não depende do fuso da máquina.
    env: { TZ: "America/Sao_Paulo" },
  },
});
