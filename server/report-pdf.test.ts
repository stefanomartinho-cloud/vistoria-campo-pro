import { describe, expect, it } from "vitest";
import { calculatePdfSliceHeight, reportPdfFilename, sanitizeReportCode } from "../client/src/lib/reportPdf";

describe("relatório PDF", () => {
  it("sanitiza códigos para nomes de arquivo compatíveis com Android", () => {
    expect(sanitizeReportCode("  6188 / BR-262  ")).toBe("6188-BR-262");
    expect(reportPdfFilename("DEMO 2026")).toBe("relatorio-vistoria-DEMO-2026.pdf");
    expect(reportPdfFilename("")).toBe("relatorio-vistoria-vistoria.pdf");
  });

  it("calcula uma fatia de página positiva para telas grandes e inválidas", () => {
    expect(calculatePdfSliceHeight(1940)).toBeGreaterThan(0);
    expect(calculatePdfSliceHeight(0)).toBe(1);
    expect(calculatePdfSliceHeight(-10)).toBe(1);
  });
});
