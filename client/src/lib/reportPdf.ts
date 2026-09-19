export const sanitizeReportCode = (value: string | undefined) => {
  const normalized = (value || "vistoria").trim().replace(/[^A-Za-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || "vistoria";
};

export const calculatePdfSliceHeight = (canvasWidth: number, pageHeightMm = 297, marginMm = 8, contentWidthMm = 194) => {
  if (canvasWidth <= 0 || contentWidthMm <= 0) return 1;
  return Math.max(1, Math.floor(canvasWidth * ((pageHeightMm - marginMm * 2) / contentWidthMm)));
};

export const reportPdfFilename = (code: string | undefined) => `relatorio-vistoria-${sanitizeReportCode(code)}.pdf`;
