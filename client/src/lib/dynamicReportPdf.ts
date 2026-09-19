import { jsPDF } from "jspdf";

export type DynamicPhoto = { dataUrl: string; caption?: string };
export type DynamicFinding = {
  text: string;
  status: "ok" | "attention" | "critical";
  action?: string;
  responsible?: string;
  dueDate?: string;
  photos?: DynamicPhoto[];
};
export type DynamicVisit = {
  property: string;
  companyName: string;
  logoDataUrl?: string;
  code: string;
  date: string;
  team: string;
  location: string;
  status: string;
  notes: string;
  participants: { name: string; role: string }[];
  categories: string[];
  findings: Record<string, DynamicFinding[]>;
};

type Color = [number, number, number];
const COLORS: Record<string, Color> = {
  ink: [31, 55, 58],
  body: [78, 98, 102],
  muted: [126, 145, 147],
  teal: [15, 118, 110],
  darkTeal: [16, 62, 59],
  gold: [246, 196, 83],
  pale: [239, 250, 246],
  line: [222, 233, 230],
  white: [255, 255, 255],
  green: [25, 128, 82],
  amber: [174, 119, 20],
  red: [184, 62, 55],
};

const statusLabel = (status: DynamicFinding["status"]) => status === "critical" ? "CRÍTICO" : status === "attention" ? "ATENÇÃO" : "CONFORME";
const statusColor = (status: DynamicFinding["status"]): Color => status === "critical" ? COLORS.red : status === "attention" ? COLORS.amber : COLORS.green;
const formatDate = (value: string) => { if (!value) return "—"; const date = new Date(`${value.length === 10 ? value : value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(date); };
const safeText = (value: string | undefined) => (value || "—").trim() || "—";

class PdfLayout {
  readonly pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  readonly left = 12;
  readonly right = 198;
  readonly top = 30;
  readonly bottom = 282;
  y = this.top;
  page = 1;
  hasContent = false;

  constructor(private readonly visit: DynamicVisit) {
    this.pdf.setProperties({ title: `Relatório de vistoria ${visit.code}`, subject: "Relatório executivo de campo" });
    this.drawPageChrome();
  }

  private setColor(color: Color) { this.pdf.setTextColor(...color); }
  private fill(color: Color) { this.pdf.setFillColor(...color); }
  private stroke(color: Color) { this.pdf.setDrawColor(...color); }
  private font(size: number, style: "normal" | "bold" = "normal") { this.pdf.setFont("helvetica", style); this.pdf.setFontSize(size); }

  private drawPageChrome() {
    this.fill(COLORS.darkTeal); this.pdf.rect(0, 0, 210, 18, "F");
    this.font(8, "bold"); this.setColor(COLORS.white); this.pdf.text((this.visit.companyName || "NOME DA EMPRESA").toUpperCase(), this.left, 11);
    this.font(7); this.setColor([202, 229, 222]); this.pdf.text("RELATÓRIO EXECUTIVO DE CAMPO", this.right, 11, { align: "right" });
    this.stroke(COLORS.gold); this.pdf.setLineWidth(1.2); this.pdf.line(this.left, 21, this.right, 21);
    this.font(7); this.setColor(COLORS.muted); this.pdf.text(`VISTORIA #${safeText(this.visit.code)}`, this.left, 289);
    this.pdf.text(`Página ${this.page}`, this.right, 289, { align: "right" });
  }

  private newPage() {
    if (!this.hasContent) return;
    this.pdf.addPage(); this.page += 1; this.y = this.top; this.hasContent = false; this.drawPageChrome();
  }

  ensure(height: number) {
    if (this.y + height > this.bottom) this.newPage();
  }

  textLines(text: string, width: number, size: number, style: "normal" | "bold" = "normal") {
    this.font(size, style); return this.pdf.splitTextToSize(safeText(text), width) as string[];
  }

  drawText(text: string, x: number, width: number, size: number, color: Color = COLORS.body, style: "normal" | "bold" = "normal", lineGap = 1.25) {
    const lines = this.textLines(text, width, size, style); this.setColor(color); this.pdf.text(lines, x, this.y); this.y += lines.length * size * 0.3528 * lineGap; this.hasContent = true; return lines.length;
  }

  sectionTitle(title: string, subtitle?: string) {
    this.ensure(18); this.fill(COLORS.teal); this.pdf.roundedRect(this.left, this.y, 5, 12, 1.5, 1.5, "F");
    this.font(13, "bold"); this.setColor(COLORS.ink); this.pdf.text(title, this.left + 9, this.y + 5.5);
    if (subtitle) { this.font(8); this.setColor(COLORS.muted); this.pdf.text(subtitle, this.left + 9, this.y + 10); }
    this.y += subtitle ? 18 : 14; this.hasContent = true;
  }

  labelValue(label: string, value: string, x: number, width: number) {
    this.font(7, "bold"); this.setColor(COLORS.muted); this.pdf.text(label.toUpperCase(), x, this.y);
    const lines = this.textLines(value, width, 9, "bold"); this.font(9, "bold"); this.setColor(COLORS.ink); this.pdf.text(lines, x, this.y + 4); return Math.max(11, 4 + lines.length * 3.5);
  }

  drawCover() {
    this.y = 25; this.fill(COLORS.darkTeal); this.pdf.roundedRect(this.left, this.y, this.right - this.left, 61, 4, 4, "F");
    this.fill(COLORS.gold); this.pdf.rect(this.left, this.y + 57, this.right - this.left, 4, "F");
    if (this.visit.logoDataUrl) { try { this.pdf.addImage(this.visit.logoDataUrl, "JPEG", this.left + 8, this.y + 8, 16, 16, undefined, "FAST"); } catch {} }
    this.font(10, "bold"); this.setColor(COLORS.white); this.pdf.text((this.visit.companyName || "NOME DA EMPRESA").toUpperCase(), this.left + 29, this.y + 14);
    this.font(7); this.setColor([185, 224, 214]); this.pdf.text("UNIDADE · OPERAÇÕES DE CAMPO", this.left + 29, this.y + 19);
    this.font(7, "bold"); this.setColor(COLORS.gold); this.pdf.text("RELATÓRIO EXECUTIVO DE CAMPO", this.left + 8, this.y + 30);
    this.font(22, "bold"); this.setColor(COLORS.white); this.pdf.text(["RODADA TÉCNICA", "OPERACIONAL"], this.left + 8, this.y + 40, { lineHeightFactor: 1.05 });
    this.font(8, "bold"); this.setColor([212, 236, 229]); this.pdf.text(`INSPEÇÃO SEMANAL · ${this.visit.property || "UNIDADE"}`, this.left + 8, this.y + 53);
    this.y += 70;
    this.fill(COLORS.pale); this.pdf.roundedRect(this.left, this.y, this.right - this.left, 23, 2, 2, "F");
    const col = (this.right - this.left) / 3;
    this.labelValue("EMPRESA", this.visit.companyName, this.left + 5, col - 8);
    this.labelValue("EQUIPE", this.visit.team, this.left + col + 2, col - 8);
    this.labelValue("LOCAL", this.visit.location || this.visit.property, this.left + col * 2 - 1, col - 5);
    this.y += 30;
    this.drawKpis();
    this.y += 3;
  }

  drawKpis() {
    const all = this.visit.categories.flatMap((section) => this.visit.findings[section] || []); const ok = all.filter((item) => item.status === "ok").length; const attention = all.length - ok;
    const values = [[String(all.length), "ITENS AVALIADOS"], [String(ok), "CONFORMES"], [String(attention), "PONTOS DE ATENÇÃO"]]; const width = (this.right - this.left - 8) / 3;
    values.forEach(([value, label], index) => { const x = this.left + index * (width + 4); this.fill(COLORS.white); this.stroke(COLORS.line); this.pdf.roundedRect(x, this.y, width, 19, 2, 2, "FD"); this.font(17, "bold"); this.setColor(index === 1 ? COLORS.green : index === 2 ? COLORS.amber : COLORS.ink); this.pdf.text(value, x + 5, this.y + 9); this.font(7); this.setColor(COLORS.muted); this.pdf.text(label, x + 5, this.y + 15); });
    this.y += 24;
  }

  drawExecutiveSummary() {
    this.sectionTitle("VISÃO GERENCIAL", "Resumo executivo da inspeção");
    this.fill([248, 251, 250]); this.stroke(COLORS.line); const lines = this.textLines(this.visit.notes, this.right - this.left - 12, 9); const h = 12 + lines.length * 4.2; this.ensure(h); this.pdf.roundedRect(this.left, this.y, this.right - this.left, h, 2, 2, "FD"); this.font(9); this.setColor(COLORS.body); this.pdf.text(lines, this.left + 6, this.y + 8, { lineHeightFactor: 1.2 }); this.y += h + 7;
  }

  drawActionCard(item: DynamicFinding, index: number) {
    const width = this.right - this.left; const inner = width - 14; const textWidth = inner - 34;
    const titleLines = this.textLines(item.text, textWidth, 9, "bold"); const actionLines = this.textLines(safeText(item.action), inner - 24, 8.5); const respLines = this.textLines(safeText(item.responsible), 48, 8.5); const dueLines = this.textLines(item.dueDate ? formatDate(item.dueDate) : "A definir", 48, 8.5);
    const h = 12 + titleLines.length * 4 + 8 + actionLines.length * 3.8 + 13 + Math.max(respLines.length, dueLines.length) * 3.8;
    this.ensure(h + 3); const start = this.y; this.fill(COLORS.white); this.stroke(COLORS.line); this.pdf.roundedRect(this.left, start, width, h, 2, 2, "FD");
    this.fill(statusColor(item.status)); this.pdf.roundedRect(this.left + 5, start + 6, 24, 6, 2, 2, "F"); this.font(6.5, "bold"); this.setColor(COLORS.white); this.pdf.text(statusLabel(item.status), this.left + 17, start + 10.2, { align: "center" });
    this.font(8, "bold"); this.setColor(COLORS.muted); this.pdf.text(String(index + 1).padStart(2, "0"), this.right - 8, start + 10, { align: "right" });
    this.font(9, "bold"); this.setColor(COLORS.ink); this.pdf.text(titleLines, this.left + 35, start + 10, { lineHeightFactor: 1.15 });
    let cy = start + 12 + titleLines.length * 4;
    this.font(6.5, "bold"); this.setColor(COLORS.teal); this.pdf.text("AÇÃO", this.left + 7, cy + 3); this.font(8.5); this.setColor(COLORS.body); this.pdf.text(actionLines, this.left + 7, cy + 7, { lineHeightFactor: 1.15 }); cy += 7 + actionLines.length * 3.8 + 4;
    this.font(6.5, "bold"); this.setColor(COLORS.muted); this.pdf.text("RESPONSÁVEL", this.left + 7, cy + 3); this.pdf.text("PRAZO", this.left + 106, cy + 3); this.font(8.5); this.setColor(COLORS.body); this.pdf.text(respLines, this.left + 7, cy + 7, { lineHeightFactor: 1.15 }); this.pdf.text(dueLines, this.left + 106, cy + 7, { lineHeightFactor: 1.15 });
    this.y = start + h + 3; this.hasContent = true;
  }

  drawExecutiveActions() {
    const all = this.visit.categories.flatMap((section) => this.visit.findings[section] || []).filter((item) => item.status !== "ok");
    if (!all.length) return; this.sectionTitle("DECISÃO EXECUTIVA", "Riscos críticos e plano de ação");
    all.forEach((item, index) => this.drawActionCard(item, index)); this.y += 4;
  }

  drawFinding(item: DynamicFinding, index: number) {
    const width = this.right - this.left; const textWidth = width - 54; const actionLines = item.action && item.action.trim() ? this.textLines(item.action, width - 30, 8) : []; const textLines = this.textLines(item.text, textWidth, 9);
    const photos = item.photos || []; const photoRows = Math.ceil(photos.length / 2); const photoHeight = photoRows ? photoRows * 35 + (photoRows - 1) * 4 : 0;
    const h = 10 + textLines.length * 4 + (actionLines.length ? 8 + actionLines.length * 3.5 : 0) + (photoRows ? 6 + photoHeight : 0) + 8;
    this.ensure(h + 3); const start = this.y; this.fill([252, 253, 253]); this.stroke(COLORS.line); this.pdf.roundedRect(this.left, start, width, h, 2, 2, "FD");
    this.font(8, "bold"); this.setColor(COLORS.muted); this.pdf.text(String(index + 1).padStart(2, "0"), this.left + 6, start + 8); this.fill(statusColor(item.status)); this.pdf.roundedRect(this.right - 31, start + 4, 25, 6, 2, 2, "F"); this.font(6.2, "bold"); this.setColor(COLORS.white); this.pdf.text(statusLabel(item.status), this.right - 18.5, start + 8.2, { align: "center" });
    this.font(9, "normal"); this.setColor(COLORS.body); this.pdf.text(textLines, this.left + 16, start + 8, { lineHeightFactor: 1.15 }); let cy = start + 8 + textLines.length * 4;
    if (actionLines.length) { this.font(6.5, "bold"); this.setColor(COLORS.teal); this.pdf.text("AÇÃO", this.left + 16, cy + 3); this.font(8); this.setColor(COLORS.body); this.pdf.text(actionLines, this.left + 29, cy + 3, { lineHeightFactor: 1.15 }); cy += Math.max(7, actionLines.length * 3.5); }
    if (photoRows) { cy += 4; const photoWidth = (width - 24) / 2; photos.forEach((photo, photoIndex) => { const row = Math.floor(photoIndex / 2); const col = photoIndex % 2; const x = this.left + 16 + col * (photoWidth + 4); const y = cy + row * 39; try { this.pdf.addImage(photo.dataUrl, "JPEG", x, y, photoWidth, 29, undefined, "FAST"); } catch {} if (photo.caption) { this.font(6.5); this.setColor(COLORS.muted); const cap = this.textLines(photo.caption, photoWidth, 6.5); this.pdf.text(cap.slice(0, 1), x, y + 33); } }); }
    this.y = start + h + 3; this.hasContent = true;
  }

  drawSections() {
    this.visit.categories.forEach((section) => { const items = this.visit.findings[section] || []; this.sectionTitle(section, `${items.length} ${items.length === 1 ? "item" : "itens"}`); items.forEach((item, index) => this.drawFinding(item, index)); this.y += 4; });
  }

  finish() { return this.pdf.output("blob"); }
}

export const buildDynamicReportPdf = (visit: DynamicVisit) => { const layout = new PdfLayout(visit); layout.drawCover(); layout.drawExecutiveSummary(); layout.drawExecutiveActions(); layout.drawSections(); return layout.finish(); };
