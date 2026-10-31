import { describe, expect, it } from "vitest";

import {
  headerMediaFileProblem,
  headerMediaPath,
  templateMismatch,
} from "@/lib/whatsapp/message-templates";

const withHeader = (headerFormat: string | null) => ({
  headerFormat,
  unsupported: null,
});

describe("templateMismatch — mídia no cabeçalho", () => {
  it.each(["IMAGE", "DOCUMENT", "VIDEO", "TEXT", null])(
    "lembrete aceita cabeçalho %s",
    (format) => {
      expect(templateMismatch("reminder_d30", withHeader(format))).toBeNull();
      expect(templateMismatch("reminder_d7", withHeader(format))).toBeNull();
    },
  );

  it("lembrete recusa mídia que o sistema não envia", () => {
    expect(templateMismatch("reminder_d30", withHeader("LOCATION"))).toMatch(
      /imagem, documento ou vídeo/,
    );
  });

  it("confirmação continua recusando imagem e vídeo", () => {
    expect(templateMismatch("activation", withHeader("IMAGE"))).toMatch(
      /documento/,
    );
    expect(templateMismatch("renewal", withHeader("VIDEO"))).toMatch(
      /documento/,
    );
  });

  it("lista de parceiros continua exigindo documento", () => {
    expect(templateMismatch("partners_list", withHeader("IMAGE"))).toMatch(
      /documento/,
    );
  });

  it("modelo que o whatsapp-ai não envia: vale o motivo dele", () => {
    expect(
      templateMismatch("reminder_d30", {
        headerFormat: "IMAGE",
        unsupported: "Cabeçalho com variável",
      }),
    ).toBe("Cabeçalho com variável");
  });
});

describe("headerMediaFileProblem", () => {
  const MB = 1024 * 1024;

  it("aceita o tipo e o tamanho de cada formato", () => {
    expect(
      headerMediaFileProblem("IMAGE", { type: "image/png", size: MB }),
    ).toBeNull();
    expect(
      headerMediaFileProblem("DOCUMENT", {
        type: "application/pdf",
        size: 9 * MB,
      }),
    ).toBeNull();
    expect(
      headerMediaFileProblem("VIDEO", { type: "video/mp4", size: 15 * MB }),
    ).toBeNull();
  });

  it("recusa arquivo de outro formato", () => {
    expect(
      headerMediaFileProblem("DOCUMENT", { type: "image/png", size: MB }),
    ).toMatch(/PDF/);
  });

  it("recusa acima do limite do formato", () => {
    expect(
      headerMediaFileProblem("IMAGE", { type: "image/jpeg", size: 6 * MB }),
    ).toMatch(/5 MB/);
  });
});

describe("headerMediaPath", () => {
  it("extensão pelo tipo e versão pela data do arquivo", () => {
    const updatedAt = new Date("2026-10-30T12:00:00Z");
    expect(
      headerMediaPath("reminder_d30", {
        mimeType: "application/pdf",
        updatedAt,
      }),
    ).toBe(
      `/arquivos/midia-dos-modelos/reminder_d30.pdf?v=${updatedAt.getTime()}`,
    );
  });
});
