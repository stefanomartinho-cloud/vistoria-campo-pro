import { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { FileOpener } from "@capacitor-community/file-opener";
import { jsPDF } from "jspdf";
import { reportPdfFilename } from "@/lib/reportPdf";
import { buildDynamicReportPdf } from "@/lib/dynamicReportPdf";
import { toast } from "sonner";
import {
  Activity,
  Camera,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  CloudSun,
  Download,
  FileText,
  Flag,
  Gauge,
  HardHat,
  ImagePlus,
  LayoutDashboard,
  MapPin,
  Menu,
  Plus,
  Save,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";

type SectionKey = string;
type Participant = { name: string; role: string };
type Photo = { id: string; name: string; dataUrl: string; caption: string };
type FindingStatus = "ok" | "attention" | "critical";
type View = "dashboard" | "new" | "detail";

type Finding = {
  id: string;
  text: string;
  status: FindingStatus;
  responsible?: string;
  dueDate?: string;
  action?: string;
  photos?: Photo[];
};

type Visit = {
  id: string;
  property: string;
  companyName: string;
  logoDataUrl?: string;
  code: string;
  date: string;
  team: string;
  participants: Participant[];
  location: string;
  status: "Rascunho" | "Concluída";
  notes: string;
  categories: string[];
  photos: Photo[];
  findings: Record<SectionKey, Finding[]>;
};

const sectionMeta: Record<string, { icon: typeof ShieldCheck; color: string; soft: string; description: string }> = {
  Segurança: { icon: ShieldCheck, color: "#0f766e", soft: "#e8f5f2", description: "Condições seguras, documentos e comportamento" },
  Qualidade: { icon: Target, color: "#bb7b13", soft: "#fff5dd", description: "Padrão de execução, acessos e acabamento" },
  Produtividade: { icon: Gauge, color: "#3e65a6", soft: "#eaf0fb", description: "Planejamento, aderência e otimização" },
  Custo: { icon: BarChart3, color: "#8b4d9d", soft: "#f5ebf8", description: "Eficiência operacional e oportunidades" },
};

const defaultSections: SectionKey[] = ["Segurança", "Qualidade", "Produtividade", "Custo"];
const sectionOrder = defaultSections;
const getSectionMeta = (section: SectionKey) => sectionMeta[section] || { icon: ClipboardCheck, color: "#5b7280", soft: "#edf2f4", description: "Campo personalizado da operação" };

const finding = (id: string, text: string, status: FindingStatus): Finding => ({ id, text, status, responsible: "", dueDate: "", action: "", photos: [] });

const seedVisit: Visit = {
  id: "vis-6188",
  property: "Fazenda São Guilherme",
  companyName: "MS Florestal",
  logoDataUrl: "",
  code: "6188",
  date: "2026-08-06",
  team: "MS Florestal – MVL01",
  participants: [
    { name: "Anderson Truber", role: "Coordenador de operação" },
    { name: "Stefano Martin", role: "Técnico" },
    { name: "Callebe Maicon", role: "Técnico" },
  ],
  location: "BR-262 · Acesso principal",
  status: "Concluída",
  categories: defaultSections,
  photos: [],
  notes: "Rodada técnica realizada com alinhamento de segurança e operação com técnicos dos turnos A e B.",
  findings: {
    Segurança: [
      finding("s1", "Sinalização na entrada e saída da BR-262: ponto cego para acesso à fazenda.", "attention"),
      finding("s2", "Ajustar sinalização da ponte no acesso.", "attention"),
      finding("s3", "Sinalização e bloqueio dos trechos em atividades.", "ok"),
      finding("s4", "Inspeção nos documentos ADM e SST.", "ok"),
      finding("s5", "DDS e alinhamento operacional com os times dos turnos A e B.", "ok"),
      finding("s6", "Orientação sobre respeito, inclusão, brincadeiras, WhatsApp e tratamento adequado.", "ok"),
      finding("s7", "Inspeção no micro-ônibus da Crisp Tur.", "ok"),
    ],
    Qualidade: [
      finding("q1", "Ajustes nos cantos.", "attention"),
      finding("q2", "Umectação em trechos já finalizados.", "attention"),
      finding("q3", "Ajustes na estrada do projeto.", "attention"),
      finding("q4", "Rodada de campo e alinhamento com os técnicos.", "ok"),
      finding("q5", "Ajustes no acesso de transporte dos colaboradores.", "ok"),
      finding("q6", "Acompanhamento do lançamento com CBs.", "ok"),
      finding("q7", "Avaliação das atividades já realizadas.", "ok"),
    ],
    Produtividade: [
      finding("p1", "Avaliação do rotograma dos CBs de acordo com DMT pré-avaliado.", "ok"),
      finding("p2", "Avaliação de aderência ao planejamento do projeto.", "ok"),
      finding("p3", "Otimização de rotas para aproveitar oportunidades com CBs.", "ok"),
    ],
    Custo: [
      finding("c1", "Planejamento estratégico para otimizar rotas e ganhos em carreadores consolidados.", "ok"),
      finding("c2", "Orientação sobre uso do DMT efetivo para reduzir tempo, diesel e desgaste.", "ok"),
    ],
  },
};

const demoPhoto = (id: string, name: string, dataUrl: string, caption: string): Photo => ({ id, name, dataUrl, caption });

const demoVisit: Visit = {
  id: "vis-demo-2026", property: "Fazenda Modelo — Unidade Florestal", companyName: "Verde Forte Operações",
  logoDataUrl: "/offline-demo/logo.png", code: "DEMO-2026", date: "2026-09-18",
  team: "Equipe de Excelência Operacional · Turno A",
  participants: [
    { name: "Mariana Costa", role: "Gerente de operações" },
    { name: "Rafael Almeida", role: "Coordenador de segurança" },
    { name: "Camila Nunes", role: "Engenheira florestal" },
    { name: "Diego Martins", role: "Técnico de campo" },
  ],
  location: "BR-262 · Km 418 · Acesso norte", status: "Concluída",
  categories: ["Segurança", "Qualidade", "Produtividade", "Custo", "Meio ambiente", "Pessoas & cultura"],
  photos: [
    demoPhoto("demo-cover", "acesso-ponte.jpg", "/offline-demo/safety.jpg", "Acesso da ponte com sinalização provisória — registro demonstrativo."),
    demoPhoto("demo-road", "drenagem.jpg", "/offline-demo/quality.jpg", "Desgaste do bordo da estrada e necessidade de recomposição."),
    demoPhoto("demo-team", "equipe-transporte.jpg", "/offline-demo/equipment.jpg", "Equipe e transporte no ponto de apoio operacional."),
    demoPhoto("demo-environment", "protecao-ambiental.jpg", "/offline-demo/environment.jpg", "Controle de drenagem e proteção do solo — imagem fictícia."),
  ],
  notes: "Vistoria demonstrativa criada para apresentar o fluxo completo do sistema: registro em campo, evidências fotográficas, riscos críticos, plano de ação e decisão gerencial.",
  findings: {
    Segurança: [
      { id: "demo-s1", text: "Ponto cego no acesso da BR-262 exige reforço imediato de sinalização e controle de tráfego.", status: "critical", responsible: "Rafael Almeida", dueDate: "2026-09-20", action: "Implantar placas de advertência, balizadores e apoio de sinaleiro nos horários de pico.", photos: [demoPhoto("demo-s1-photo", "ponto-cego.jpg", "/offline-demo/safety.jpg", "Evidência do acesso e da ponte.")] },
      { id: "demo-s2", text: "Sinalização da ponte apresenta baixa visibilidade no sentido de saída da operação.", status: "attention", responsible: "Diego Martins", dueDate: "2026-09-22", action: "Reposicionar placa, revisar refletivos e confirmar visibilidade em teste noturno.", photos: [] },
      { id: "demo-s3", text: "Bloqueio físico dos trechos em atividade e DDS registrados com as equipes.", status: "ok", responsible: "Rafael Almeida", dueDate: "", action: "Manter rotina de verificação no início de cada turno.", photos: [] },
    ],
    Qualidade: [
      { id: "demo-q1", text: "Erosão no bordo da estrada próxima à drenagem pode comprometer a passagem de veículos pesados.", status: "critical", responsible: "Camila Nunes", dueDate: "2026-09-24", action: "Recompor o bordo, proteger a saída d'água e registrar medição após a chuva.", photos: [demoPhoto("demo-q1-photo", "erosao.jpg", "/offline-demo/quality.jpg", "Evidência da erosão no bordo da estrada.")] },
      { id: "demo-q2", text: "Umectação dos trechos finalizados está abaixo da frequência recomendada.", status: "attention", responsible: "Diego Martins", dueDate: "2026-09-23", action: "Revisar rota do caminhão-pipa e acompanhar o consumo de água por trecho.", photos: [] },
      { id: "demo-q3", text: "Acabamento dos acessos e limpeza das áreas de apoio dentro do padrão esperado.", status: "ok", responsible: "Camila Nunes", dueDate: "", action: "Registrar inspeção fotográfica semanal.", photos: [] },
    ],
    Produtividade: [
      { id: "demo-p1", text: "Rotograma dos caminhões apresenta oportunidade de reduzir deslocamentos vazios.", status: "attention", responsible: "Mariana Costa", dueDate: "2026-09-26", action: "Recalcular DMT e testar rota consolidada no próximo turno.", photos: [] },
      { id: "demo-p2", text: "Planejamento operacional aderente ao volume previsto para a semana.", status: "ok", responsible: "Mariana Costa", dueDate: "", action: "Monitorar aderência no fechamento diário.", photos: [] },
    ],
    Custo: [
      { id: "demo-c1", text: "Uso de DMT efetivo pode reduzir diesel, tempo de ciclo e desgaste dos equipamentos.", status: "attention", responsible: "Mariana Costa", dueDate: "2026-09-30", action: "Publicar mapa de oportunidades e validar ganho esperado com a supervisão.", photos: [] },
      { id: "demo-c2", text: "Carreadores consolidados identificados como oportunidade de ganho operacional.", status: "ok", responsible: "Diego Martins", dueDate: "", action: "Incluir no planejamento da próxima rodada.", photos: [] },
    ],
    "Meio ambiente": [
      { id: "demo-m1", text: "Drenagem protegida e barreiras de contenção instaladas no trecho em recuperação.", status: "ok", responsible: "Camila Nunes", dueDate: "", action: "Manter inspeção após eventos de chuva.", photos: [demoPhoto("demo-m1-photo", "protecao-solo.jpg", "/offline-demo/environment.jpg", "Registro ambiental demonstrativo.")] },
    ],
    "Pessoas & cultura": [
      { id: "demo-pc1", text: "Equipe alinhada sobre respeito, inclusão, comunicação e uso responsável do WhatsApp.", status: "ok", responsible: "Mariana Costa", dueDate: "", action: "Reforçar o tema no próximo DDS.", photos: [demoPhoto("demo-pc1-photo", "equipe.jpg", "/offline-demo/equipment.jpg", "Equipe em atividade — imagem fictícia.")] },
    ],
  },
};

const emptyFindings = (): Record<SectionKey, Finding[]> => ({ Segurança: [], Qualidade: [], Produtividade: [], Custo: [] });
const normalizeVisit = (raw: Partial<Visit>): Visit => {
  const categories = raw.categories?.length ? raw.categories : defaultSections;
  const findings = { ...emptyFindings(), ...(raw.findings || {}) } as Record<SectionKey, Finding[]>;
  Object.keys(findings).forEach((category) => { findings[category] = (findings[category] || []).map((item) => ({ ...item, photos: item.photos || [], responsible: item.responsible || "", dueDate: item.dueDate || "", action: item.action || "" })); });
  categories.forEach((category) => { if (!findings[category]) findings[category] = []; });
  const participants = (raw.participants || []).map((participant) => typeof participant === "string" ? { name: participant, role: "" } : participant);
  const photos = raw.photos || [];
  return { companyName: raw.companyName || "", logoDataUrl: raw.logoDataUrl || "", id: raw.id || `vis-${Date.now()}`, property: raw.property || "", code: raw.code || "", date: raw.date || new Date().toISOString().slice(0, 10), team: raw.team || "", participants, location: raw.location || "", status: raw.status || "Rascunho", notes: raw.notes || "", categories, photos, findings };
};
const blankVisit = (): Visit => ({
  id: `vis-${Date.now()}`,
  property: "",
  companyName: "",
  logoDataUrl: "",
  code: "",
  date: new Date().toISOString().slice(0, 10),
  team: "",
  participants: [{ name: "", role: "" }],
  location: "",
  status: "Rascunho",
  notes: "",
  categories: [...defaultSections],
  photos: [],
  findings: emptyFindings(),
});

const formatDate = (value: string) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)).replace(" de ", " ");
};
const shortDate = (value: string) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00`));
};
const totalFindings = (visit: Visit) => visit.categories.reduce((total, key) => total + (visit.findings[key]?.length || 0), 0);
const attentionFindings = (visit: Visit) => visit.categories.reduce((total, key) => total + (visit.findings[key] || []).filter((item) => item.status !== "ok").length, 0);

function StatusPill({ status }: { status: FindingStatus }) {
  const labels = { ok: "Conforme", attention: "Atenção", critical: "Crítico" };
  const icons = { ok: Check, attention: AlertTriangle, critical: Flag };
  const Icon = icons[status];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${status === "ok" ? "status-ok" : status === "attention" ? "status-attention" : "status-danger"}`}><Icon size={12} strokeWidth={2.5} />{labels[status]}</span>;
}

function Logo() {
  return <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6b73c] text-[#143536] shadow-lg shadow-black/10"><ClipboardCheck size={22} strokeWidth={2.5} /></div><div><div className="font-display text-[15px] font-bold tracking-tight text-white">Vistoria<span className="text-[#f6b73c]">.pro</span></div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a9c5c2]">Campo & operação</div></div></div>;
}

function Sidebar({ view, setView, onClose }: { view: View; setView: (view: View) => void; onClose?: () => void }) {
  const items: { label: string; icon: typeof LayoutDashboard; view: View }[] = [
    { label: "Visão geral", icon: LayoutDashboard, view: "dashboard" },
    { label: "Nova vistoria", icon: Plus, view: "new" },
  ];
  return <aside className="sidebar-texture no-print relative flex h-full w-[252px] flex-col px-5 py-6 text-white shadow-2xl shadow-[#102c2d]/20 lg:static lg:shadow-none">
    <div className="mb-10 flex items-center justify-between"><Logo /><button onClick={onClose} className="rounded-lg p-2 text-[#a9c5c2] hover:bg-white/10 lg:hidden"><X size={18} /></button></div>
    <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#85ada8]">Workspace</div>
    <nav className="space-y-1">
      {items.map(({ label, icon: Icon, view: itemView }) => <button key={label} onClick={() => { setView(itemView); onClose?.(); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${view === itemView ? "bg-white/12 text-white shadow-inner" : "text-[#b6cecb] hover:bg-white/7 hover:text-white"}`}><Icon size={18} strokeWidth={view === itemView ? 2.5 : 2} /><span>{label}</span>{itemView === "new" && <span className="ml-auto rounded-md bg-[#f6b73c] px-1.5 py-0.5 text-[10px] font-extrabold text-[#173536]">+</span>}</button>)}
    </nav>
    <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.06] p-4"><div className="mb-3 flex items-center gap-2 text-[#f6b73c]"><Sparkles size={15} /><span className="text-xs font-bold">Fluxo rápido</span></div><p className="mb-3 text-xs leading-relaxed text-[#b6cecb]">Registre achados em campo e finalize um relatório pronto para compartilhar.</p><div className="progress-line"><span style={{ width: "78%", background: "#f6b73c" }} /></div><p className="mt-2 text-[10px] font-semibold text-[#85ada8]">MVP operacional · 78% configurado</p></div>
    <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-5"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9ece8] text-xs font-extrabold text-[#14504c]">MS</div><div className="min-w-0"><div className="truncate text-xs font-bold">MS Florestal</div><div className="text-[10px] text-[#8fb3af]">Operação ativa</div></div><ChevronDown size={15} className="ml-auto text-[#8fb3af]" /></div>
  </aside>;
}

function Topbar({ view, onMenu, onNew }: { view: View; onMenu: () => void; onNew: () => void }) {
  const labels = { dashboard: "Visão geral", new: "Nova vistoria", detail: "Relatório da vistoria" };
  return <header className="no-print flex h-[76px] items-center justify-between border-b border-[#e2e9e8] bg-white/85 px-5 backdrop-blur sm:px-8"><div className="flex items-center gap-3"><button onClick={onMenu} className="rounded-lg p-2 text-[#557076] hover:bg-[#eef5f3] lg:hidden"><Menu size={20} /></button><div><p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#87979b]">Operação / {labels[view]}</p><h1 className="font-display text-xl font-bold text-[#1a2c31]">{labels[view]}</h1></div></div><div className="flex items-center gap-2 sm:gap-4"><div className="hidden items-center gap-2 rounded-full border border-[#dfe9e7] bg-[#f7fbfa] px-3 py-2 text-[11px] font-bold text-[#39736c] sm:flex"><span className="h-2 w-2 rounded-full bg-[#31a36c] shadow-[0_0_0_3px_#d9f2e4]" /> Dados salvos localmente</div><button onClick={onNew} className="btn-primary flex items-center gap-2 text-sm"><Plus size={17} /> <span className="hidden sm:inline">Nova vistoria</span><span className="sm:hidden">Nova</span></button></div></header>;
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return <div className="card-shadow flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f5f1] text-[#0f766e]"><ClipboardCheck size={27} /></div><h3 className="font-display text-lg font-bold text-[#24373b]">Nenhuma vistoria encontrada</h3><p className="mt-2 max-w-sm text-sm leading-relaxed text-[#75858a]">Comece registrando a primeira rodada técnica da sua operação.</p><button onClick={onNew} className="btn-primary mt-5 flex items-center gap-2 text-sm"><Plus size={16} /> Iniciar vistoria</button></div>;
}

function Dashboard({ visits, onNew, onOpen }: { visits: Visit[]; onNew: () => void; onOpen: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = visits.filter((visit) => `${visit.property} ${visit.code} ${visit.team}`.toLowerCase().includes(search.toLowerCase()));
  const completed = visits.filter((visit) => visit.status === "Concluída").length;
  const totalAttention = visits.reduce((sum, visit) => sum + attentionFindings(visit), 0);
  const totalItems = visits.reduce((sum, visit) => sum + totalFindings(visit), 0);
  return <div className="mx-auto max-w-[1440px] p-5 sm:p-8">
    <section className="hero-grid card-shadow relative mb-7 overflow-hidden rounded-2xl border border-[#dbeae7] bg-[#eaf5f2] p-6 sm:p-8"><div className="relative z-10 max-w-xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#0f766e]"><Activity size={13} /> Central de operação</div><h2 className="font-display text-3xl font-bold leading-[1.08] tracking-tight text-[#173b3b] sm:text-4xl">Campo bem registrado.<br /><span className="text-[#0f766e]">Decisão mais rápida.</span></h2><p className="mt-4 max-w-md text-sm leading-relaxed text-[#547176]">Organize suas rodadas técnicas, evidencie os pontos de atenção e gere relatórios profissionais em poucos minutos.</p><div className="mt-6 flex flex-wrap gap-3"><button onClick={onNew} className="btn-primary flex items-center gap-2 text-sm"><Plus size={17} /> Registrar nova visita</button><button onClick={() => document.getElementById("recent-visits")?.scrollIntoView({ behavior: "smooth" })} className="btn-secondary flex items-center gap-2 text-sm">Ver histórico <ArrowRight size={16} /></button></div></div><div className="pointer-events-none absolute -right-8 -top-10 hidden h-64 w-64 rounded-full border-[26px] border-[#b8ded5]/70 sm:block" /><div className="pointer-events-none absolute -bottom-16 right-20 hidden h-52 w-52 rounded-full border-[18px] border-[#d1eae5]/80 sm:block" /><div className="absolute bottom-5 right-8 hidden h-28 w-44 rotate-[-8deg] rounded-xl border border-white/70 bg-white/45 p-3 shadow-xl backdrop-blur sm:block"><div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[#69918e]"><span>Indicador da rodada</span><BarChart3 size={13} /></div><div className="mt-4 flex items-end gap-1.5"><span className="h-8 w-2 rounded-full bg-[#9bd0c6]" /><span className="h-12 w-2 rounded-full bg-[#68b6a7]" /><span className="h-10 w-2 rounded-full bg-[#0f766e]" /><span className="h-16 w-2 rounded-full bg-[#f6b73c]" /><span className="h-14 w-2 rounded-full bg-[#4b9c93]" /></div></div></section>
    <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Visitas registradas" value={String(visits.length).padStart(2, "0")} helper="histórico local" icon={ClipboardCheck} accent="#0f766e" /><Metric label="Concluídas" value={String(completed).padStart(2, "0")} helper="relatórios prontos" icon={Check} accent="#2b8c61" /><Metric label="Itens avaliados" value={String(totalItems).padStart(2, "0")} helper="todos os pilares" icon={Target} accent="#3e65a6" /><Metric label="Pontos de atenção" value={String(totalAttention).padStart(2, "0")} helper="acompanhar na próxima" icon={AlertTriangle} accent="#c48920" /> </section>
    <section id="recent-visits" className="card-shadow overflow-hidden rounded-2xl bg-white"><div className="flex flex-col gap-4 border-b border-[#edf1f1] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><div className="flex items-center gap-2"><h3 className="font-display text-lg font-bold text-[#263a3d]">Últimas visitas</h3><span className="rounded-full bg-[#eef5f3] px-2 py-1 text-[10px] font-bold text-[#4d7775]">{visits.length} registros</span></div><p className="mt-1 text-xs text-[#839195]">Acompanhe as rodadas técnicas e seus pontos de atenção.</p></div><div className="relative w-full sm:w-64"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aabad]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="field-input pl-9 text-sm" placeholder="Buscar fazenda, ID..." /></div></div>{filtered.length === 0 ? <EmptyState onNew={onNew} /> : <div className="divide-y divide-[#edf1f1]">{filtered.map((visit) => <button key={visit.id} onClick={() => onOpen(visit.id)} className="group flex w-full flex-col gap-4 p-5 text-left transition hover:bg-[#f8fbfa] sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex min-w-0 items-center gap-4"><div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e9f5f1] text-[#0f766e] sm:flex"><MapPin size={21} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="truncate font-bold text-[#2d4144]">{visit.property || "Visita sem identificação"}</h4><span className="rounded bg-[#f2f5f4] px-1.5 py-0.5 text-[10px] font-bold text-[#6b7d80]">ID {visit.code || "—"}</span></div><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#839195]"><span className="flex items-center gap-1"><CalendarDays size={13} /> {shortDate(visit.date)}</span><span className="flex items-center gap-1"><Users size={13} /> {visit.participants.filter((participant) => participant.name.trim()).length || 0} participantes</span><span className="hidden items-center gap-1 md:flex"><HardHat size={13} /> {visit.team || "Equipe não informada"}</span></div></div></div><div className="flex items-center justify-between gap-5 sm:justify-end"><div className="flex items-center gap-3"><span className={`h-2 w-2 rounded-full ${visit.status === "Concluída" ? "bg-[#39a86b]" : "bg-[#f0ab27]"}`} /><span className="text-xs font-bold text-[#65777b]">{visit.status}</span><span className="hidden text-xs text-[#91a0a3] sm:inline">{attentionFindings(visit)} atenção{attentionFindings(visit) === 1 ? "" : "ões"}</span></div><ArrowRight size={17} className="text-[#9aabad] transition group-hover:translate-x-1 group-hover:text-[#0f766e]" /></div></button>)}</div>}</section>
  </div>;
}

function Metric({ label, value, helper, icon: Icon, accent }: { label: string; value: string; helper: string; icon: typeof Check; accent: string }) {
  return <div className="card-shadow rounded-2xl bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-[#849397]">{label}</p><p className="mt-2 font-display text-3xl font-bold text-[#23383c]">{value}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${accent}14`, color: accent }}><Icon size={19} /></div></div><p className="mt-3 text-[11px] font-semibold" style={{ color: accent }}>{helper}</p></div>;
}

function VisitForm({ initial, onCancel, onSave }: { initial: Visit; onCancel: () => void; onSave: (visit: Visit) => void }) {
  const [form, setForm] = useState<Visit>(() => structuredClone(initial));
  const [activeSection, setActiveSection] = useState<SectionKey>(initial.categories[0] || "Segurança");
  const [isLocating, setIsLocating] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const sections = form.categories;
  const update = <K extends keyof Visit>(key: K, value: Visit[K]) => setForm((current) => ({ ...current, [key]: value }));
  const addFindingPhoto = (section: SectionKey, id: string, files: FileList | null) => { if (!files?.length) return; Array.from(files).slice(0, 4).forEach(async (file) => { if (!file.type.startsWith("image/")) return; try { const dataUrl = await compressImage(file); setForm((current) => ({ ...current, findings: { ...current.findings, [section]: (current.findings[section] || []).map((item) => item.id === id ? { ...item, photos: [...(item.photos || []), { id: `item-photo-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: file.name, dataUrl, caption: "" }] } : item) } })); toast.success("Foto salva no aparelho e vinculada ao item."); } catch { toast.error("Não foi possível salvar a foto no aparelho."); } }); };
  const removeFindingPhoto = (section: SectionKey, id: string, photoId: string) => setForm((current) => ({ ...current, findings: { ...current.findings, [section]: (current.findings[section] || []).map((item) => item.id === id ? { ...item, photos: (item.photos || []).filter((photo) => photo.id !== photoId) } : item) } }));
  const updateFinding = (section: SectionKey, id: string, patch: Partial<Finding>) => setForm((current) => ({ ...current, findings: { ...current.findings, [section]: current.findings[section].map((item) => item.id === id ? { ...item, ...patch } : item) } }));
  const addFinding = (section: SectionKey) => setForm((current) => ({ ...current, findings: { ...current.findings, [section]: [...current.findings[section], { id: `${section}-${Date.now()}`, text: "", status: "ok" }] } }));
  const removeFinding = (section: SectionKey, id: string) => setForm((current) => ({ ...current, findings: { ...current.findings, [section]: current.findings[section].filter((item) => item.id !== id) } }));
  const updateParticipant = (index: number, patch: Partial<Participant>) => setForm((current) => ({ ...current, participants: current.participants.map((item, currentIndex) => currentIndex === index ? { ...item, ...patch } : item) }));
  const addLogo = async (file: File | undefined) => { if (!file || !file.type.startsWith("image/")) return; try { const dataUrl = await compressImage(file, 800, 0.75); setForm((current) => ({ ...current, logoDataUrl: dataUrl })); toast.success("Logo salva no aparelho."); } catch { toast.error("Não foi possível salvar a logo no aparelho."); } };
  const addPhotos = (files: FileList | null) => { if (!files?.length) return; Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, 8).forEach(async (file) => { try { const dataUrl = await compressImage(file); setForm((current) => ({ ...current, photos: [...current.photos, { id: `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: file.name, dataUrl, caption: "" }] })); } catch { toast.error(`Não foi possível salvar ${file.name} no aparelho.`); } }); toast.success("Fotos salvas localmente no aparelho."); };
  const updatePhoto = (id: string, patch: Partial<Photo>) => setForm((current) => ({ ...current, photos: current.photos.map((photo) => photo.id === id ? { ...photo, ...patch } : photo) }));
  const removePhoto = (id: string) => setForm((current) => ({ ...current, photos: current.photos.filter((photo) => photo.id !== id) }));
  const locate = () => { if (!navigator.geolocation) { toast.error("Seu navegador não oferece geolocalização."); return; } setIsLocating(true); navigator.geolocation.getCurrentPosition(({ coords }) => { update("location", `Coordenadas capturadas · ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`); setIsLocating(false); toast.success("Localização registrada na vistoria."); }, () => { setIsLocating(false); toast.error("Não foi possível capturar a localização."); }); };
  const save = (status: Visit["status"]) => { const clean = { ...form, status, photos: form.photos || [], participants: form.participants.filter((participant) => participant.name.trim()), findings: Object.fromEntries(sections.map((key) => [key, (form.findings[key] || []).filter((item) => item.text.trim())])) as Record<SectionKey, Finding[]> }; if (!clean.property.trim() || !clean.team.trim()) { toast.error("Informe pelo menos a fazenda e a equipe."); return; } onSave(clean); };
  const currentFindings = form.findings[activeSection] || [];
  const completedSections = sections.filter((key) => (form.findings[key] || []).some((item) => item.text.trim())).length;
  const addSection = () => { const label = newSectionName.trim(); if (!label || sections.includes(label)) { toast.error("Informe um nome novo para a categoria."); return; } setForm((current) => ({ ...current, categories: [...current.categories, label], findings: { ...current.findings, [label]: [] } })); setActiveSection(label); setNewSectionName(""); toast.success(`Categoria ${label} criada.`); };
  const removeSection = (section: string) => { if (defaultSections.includes(section)) return; const next = sections.filter((item) => item !== section); setForm((current) => ({ ...current, categories: next, findings: Object.fromEntries(next.map((item) => [item, current.findings[item] || []])) as Record<SectionKey, Finding[]> })); setActiveSection(next[0] || defaultSections[0]); };
  return <div className="mobile-form mx-auto max-w-[1120px] p-4 sm:p-8"><div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><button onClick={onCancel} className="no-print mb-4 flex items-center gap-2 text-xs font-bold text-[#628084] hover:text-[#0f766e]"><ArrowLeft size={15} /> Voltar para visão geral</button><h2 className="font-display text-3xl font-bold tracking-tight text-[#203438]">Registrar rodada técnica</h2><p className="mt-2 max-w-xl text-sm text-[#788a8e]">Preencha os dados da visita e transforme seus apontamentos em um relatório claro e auditável.</p></div><div className="no-print flex items-center gap-2 text-xs font-bold text-[#6d8082]"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dcefeb] text-[#0f766e]">{completedSections}</span> de {sections.length} categorias preenchidas</div></div>
    <div className="grid gap-6 xl:grid-cols-[1fr_310px]">
      <div className="space-y-6"><section className="card-shadow rounded-2xl bg-white p-5 sm:p-7"><div className="mb-6 flex items-start justify-between"><div><h3 className="font-display text-lg font-bold text-[#263a3d]">Identificação da visita</h3><p className="mt-1 text-xs text-[#859497]">Contexto básico para localizar este registro.</p></div><div className="rounded-xl bg-[#edf6f3] p-2.5 text-[#0f766e]"><MapPin size={19} /></div></div><div className="grid gap-5 xl:grid-cols-2"><div className="grid gap-4 2xl:grid-cols-[1fr_220px] 2xl:items-end"><div><label className="field-label">Empresa / unidade responsável *</label><input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} className="field-input" placeholder="Ex.: MS Florestal" /></div><div><label className="field-label">Logo da empresa</label><label className="flex h-[45px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[#cfe3de] bg-[#f7fcfa] px-3 text-xs font-bold text-[#276c67] hover:bg-[#eaf7f3]"><ImagePlus size={16} /> {form.logoDataUrl ? "Trocar logo" : "Selecionar logo"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { addLogo(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label></div></div><div className="mt-4 flex items-center gap-3"><div className="flex h-14 w-20 items-center justify-center overflow-hidden rounded-lg border border-[#dfe9e7] bg-[#f5faf8]">{form.logoDataUrl ? <img src={form.logoDataUrl} alt="Logo da empresa" className="max-h-full max-w-full object-contain" /> : <span className="text-[10px] font-bold uppercase text-[#96aaa8]">Sem logo</span>}</div><p className="text-xs text-[#829496]">A logo aparecerá no cabeçalho verde do relatório PDF.</p></div><label className="mt-5"><span className="field-label">Fazenda / unidade *</span><input value={form.property} onChange={(event) => update("property", event.target.value)} className="field-input" placeholder="Ex.: Fazenda São Guilherme" /></label><label><span className="field-label">ID da operação</span><input value={form.code} onChange={(event) => update("code", event.target.value)} className="field-input" placeholder="Ex.: 6188" /></label><label><span className="field-label">Data da visita *</span><input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} className="field-input" /></label><label><span className="field-label">Equipe / frente *</span><input value={form.team} onChange={(event) => update("team", event.target.value)} className="field-input" placeholder="Ex.: MS Florestal – MVL01" /></label><label className="sm:col-span-2"><span className="field-label">Local / referência</span><div className="flex gap-2"><input value={form.location} onChange={(event) => update("location", event.target.value)} className="field-input" placeholder="BR-262 · Acesso principal" /><button type="button" onClick={locate} className="btn-secondary flex shrink-0 items-center gap-2 text-xs"><MapPin size={15} /> <span className="hidden sm:inline">{isLocating ? "Capturando..." : "Minha localização"}</span></button></div></label></div></section>
        <section className="card-shadow rounded-2xl bg-white p-5 sm:p-7"><div className="mb-5 flex items-start justify-between"><div><h3 className="font-display text-lg font-bold text-[#263a3d]">Equipe participante</h3><p className="mt-1 text-xs text-[#859497]">Registre quem esteve presente na rodada.</p></div><Users size={20} className="text-[#7e9999]" /></div><div className="space-y-3">{form.participants.map((participant, index) => <div key={`participant-${index}`} className="grid gap-2 sm:grid-cols-[43px_1fr_190px_auto]"><div className="flex h-[43px] w-[43px] items-center justify-center rounded-lg bg-[#edf6f3] text-xs font-bold text-[#43847a]">{String(index + 1).padStart(2, "0")}</div><input value={participant.name} onChange={(event) => updateParticipant(index, { name: event.target.value })} className="field-input" placeholder="Nome do participante" /><input value={participant.role} onChange={(event) => updateParticipant(index, { role: event.target.value })} className="field-input" placeholder="Hierarquia / cargo (ex.: Técnico)" />{form.participants.length > 1 && <button type="button" onClick={() => update("participants", form.participants.filter((_, currentIndex) => currentIndex !== index))} className="rounded-lg px-3 text-[#b0bdbd] hover:bg-[#fff1ef] hover:text-[#c2413a]"><Trash2 size={16} /></button>}</div>)}</div><button type="button" onClick={() => update("participants", [...form.participants, { name: "", role: "" }])} className="mt-4 flex items-center gap-2 text-xs font-bold text-[#0f766e] hover:text-[#0b5a55]"><Plus size={15} /> Adicionar participante</button></section><section className="card-shadow rounded-2xl bg-white p-5 sm:p-7"><div className="mb-5 flex items-start justify-between"><div><h3 className="font-display text-lg font-bold text-[#263a3d]">Evidências fotográficas</h3><p className="mt-1 text-xs text-[#859497]">Tire fotos na hora ou selecione imagens da galeria.</p></div><Camera size={20} className="text-[#7e9999]" /></div><div className="grid gap-3 sm:grid-cols-2"><label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#0f766e] bg-[#0f766e] px-4 py-4 text-center text-white transition hover:bg-[#0b615b]"><Camera size={20} /><span><strong className="block text-sm">Tirar foto</strong><small className="text-[11px] text-[#c8ece4]">Abrir câmera do celular</small></span><input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(event) => { addPhotos(event.target.files); event.currentTarget.value = ""; }} /></label><label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#cfe3de] bg-[#f7fcfa] px-4 py-4 text-center text-[#276c67] transition hover:bg-[#eaf7f3]"><ImagePlus size={20} /><span><strong className="block text-sm">Escolher da galeria</strong><small className="text-[11px] text-[#78918f]">Selecionar fotos existentes</small></span><input type="file" accept="image/*" multiple className="hidden" onChange={(event) => { addPhotos(event.target.files); event.currentTarget.value = ""; }} /></label></div>{(form.photos || []).length > 0 && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{(form.photos || []).map((photo) => <div key={photo.id} className="overflow-hidden rounded-xl border border-[#e0eae7] bg-white"><div className="relative aspect-[4/3] bg-[#eef4f2]"><img src={photo.dataUrl} alt={photo.caption || photo.name} className="h-full w-full object-cover" /><button type="button" onClick={() => removePhoto(photo.id)} className="absolute right-2 top-2 rounded-lg bg-[#173b3b]/80 p-1.5 text-white hover:bg-[#c2413a]"><Trash2 size={13} /></button></div><input value={photo.caption} onChange={(event) => updatePhoto(photo.id, { caption: event.target.value })} className="w-full border-0 px-3 py-2 text-xs outline-none" placeholder="Legenda / local" /></div>)}</div>}</section>
        <section className="card-shadow rounded-2xl bg-white p-5 sm:p-7"><div className="mb-5"><h3 className="font-display text-lg font-bold text-[#263a3d]">Avaliação por categoria</h3><p className="mt-1 text-xs text-[#859497]">Use os pilares padrão ou crie campos próprios para esta operação.</p></div><div className="mb-5 flex flex-wrap gap-2">{sections.map((section) => { const meta = getSectionMeta(section); const Icon = meta.icon; const active = activeSection === section; const count = (form.findings[section] || []).filter((item) => item.text.trim()).length; return <div key={section} className="flex items-stretch"><button type="button" onClick={() => setActiveSection(section)} className={`rounded-l-xl border p-3 text-left transition ${active ? "border-[#77bdb3] bg-[#eff8f5] shadow-sm" : "border-[#edf1f1] bg-white hover:border-[#c7dfda]"}`}><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: meta.soft, color: meta.color }}><Icon size={15} /></span><span className="text-xs font-bold text-[#334a4d]">{section}</span><span className="text-[10px] font-extrabold" style={{ color: active ? meta.color : "#a1afb0" }}>{count}</span></div></button>{!defaultSections.includes(section) && <button type="button" title="Remover categoria" onClick={() => removeSection(section)} className="rounded-r-xl border border-l-0 border-[#edf1f1] bg-white px-2 text-[#aab5b6] hover:bg-[#fff1ef] hover:text-[#c2413a]"><X size={13} /></button>}</div>; })}</div><div className="mb-6 flex flex-col gap-2 rounded-xl border border-dashed border-[#cfe1dc] bg-[#fbfdfc] p-3 sm:flex-row"><input value={newSectionName} onChange={(event) => setNewSectionName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addSection(); }} className="field-input text-sm" placeholder="Nova categoria (ex.: Meio ambiente)" /><button type="button" onClick={addSection} className="btn-secondary flex shrink-0 items-center justify-center gap-2 text-xs"><Plus size={14} /> Criar categoria</button></div><div className="rounded-xl border border-[#e8efed] bg-[#fbfdfc] p-4 sm:p-5"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h4 className="font-bold text-[#31494d]">{activeSection}</h4><span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ background: getSectionMeta(activeSection).soft, color: getSectionMeta(activeSection).color }}>{currentFindings.length} itens</span></div><p className="mt-1 text-xs text-[#859497]">{getSectionMeta(activeSection).description}</p></div><button type="button" onClick={() => addFinding(activeSection)} className="btn-secondary flex items-center gap-1.5 text-xs"><Plus size={14} /> Adicionar item</button></div>{currentFindings.length === 0 ? <div className="rounded-xl border border-dashed border-[#cfe1dc] px-5 py-8 text-center"><div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf5f2] text-[#0f766e]"><Plus size={19} /></div><p className="text-sm font-semibold text-[#597276]">Nenhum item neste pilar</p><p className="mt-1 text-xs text-[#8a999c]">Adicione um achado ou observação da visita.</p><button type="button" onClick={() => addFinding(activeSection)} className="mt-3 text-xs font-bold text-[#0f766e]">Adicionar primeiro item</button></div> : <div className="space-y-3">{currentFindings.map((item, index) => <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-[#e3ebea] bg-white p-3 sm:flex-row sm:items-start"><div className="flex min-w-0 flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-start"><span className="mt-2 text-[10px] font-extrabold text-[#9ba9ab]">{String(index + 1).padStart(2, "0")}</span><textarea value={item.text} onChange={(event) => updateFinding(activeSection, item.id, { text: event.target.value })} className="field-input min-h-[43px] resize-y text-sm" rows={item.text.length > 90 ? 2 : 1} placeholder="Descreva o item observado..." /><div className="mt-2 grid gap-2 sm:grid-cols-3"><input value={item.action || ""} onChange={(event) => updateFinding(activeSection, item.id, { action: event.target.value })} className="field-input text-xs" placeholder="Ação recomendada" /><input value={item.responsible || ""} onChange={(event) => updateFinding(activeSection, item.id, { responsible: event.target.value })} className="field-input text-xs" placeholder="Responsável" /><input type="date" value={item.dueDate || ""} onChange={(event) => updateFinding(activeSection, item.id, { dueDate: event.target.value })} className="field-input text-xs" /></div></div><div className="flex w-full flex-wrap items-center gap-2 sm:w-[135px] sm:flex-nowrap sm:pt-1"><label title="Tirar foto deste item" className="flex h-[43px] w-[43px] cursor-pointer items-center justify-center rounded-lg border border-[#cfe3de] bg-[#f4fbf8] text-[#0f766e] hover:bg-[#e7f5f0]"><Camera size={17} /><input type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { addFindingPhoto(activeSection, item.id, event.target.files); event.currentTarget.value = ""; }} /></label><label title="Escolher foto da galeria" className="flex h-[43px] w-[43px] cursor-pointer items-center justify-center rounded-lg border border-[#cfe3de] bg-[#f7fbfa] text-[#3e7b74] hover:bg-[#e7f5f0]"><ImagePlus size={17} /><input type="file" accept="image/*" multiple className="hidden" onChange={(event) => { addFindingPhoto(activeSection, item.id, event.target.files); event.currentTarget.value = ""; }} /></label><select value={item.status} onChange={(event) => updateFinding(activeSection, item.id, { status: event.target.value as FindingStatus })} className="field-input min-w-0 flex-1 px-2 text-xs font-bold"><option value="ok">Conforme</option><option value="attention">Atenção</option><option value="critical">Crítico</option></select><button type="button" onClick={() => removeFinding(activeSection, item.id)} className="rounded-lg p-2 text-[#a9b6b7] hover:bg-[#fff1ef] hover:text-[#c2413a]"><Trash2 size={15} /></button></div>{(item.photos || []).length > 0 && <div className="mt-3 flex flex-wrap gap-2 pl-8">{(item.photos || []).map((photo) => <div key={photo.id} className="group relative h-14 w-16 overflow-hidden rounded-lg border border-[#dce9e5]"><img src={photo.dataUrl} alt="Evidência do item" className="h-full w-full object-cover" /><button type="button" onClick={() => removeFindingPhoto(activeSection, item.id, photo.id)} className="absolute right-1 top-1 hidden rounded bg-[#173b3b]/80 p-1 text-white group-hover:block"><X size={10} /></button></div>)}</div>}</div>)}</div>}</div></section>
        <section className="card-shadow rounded-2xl bg-white p-5 sm:p-7"><div className="mb-4 flex items-start justify-between"><div><h3 className="font-display text-lg font-bold text-[#263a3d]">Síntese da rodada</h3><p className="mt-1 text-xs text-[#859497]">Adicione contexto, decisões ou próximos passos.</p></div><FileText size={20} className="text-[#7e9999]" /></div><textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} className="field-input min-h-[110px] resize-y" placeholder="Ex.: alinhamentos realizados, responsáveis, próximos passos..." /></section>
      </div>
      <aside className="no-print space-y-5 xl:sticky xl:top-6 xl:self-start"><div className="card-shadow rounded-2xl bg-[#173b3b] p-5 text-white"><div className="mb-4 flex items-center gap-2 text-[#f6c860]"><Sparkles size={17} /><span className="text-xs font-bold uppercase tracking-[.14em]">Resumo em tempo real</span></div><div className="mb-5"><p className="text-xs text-[#a9c5c2]">Progresso do registro</p><div className="mt-2 flex items-end justify-between"><span className="font-display text-3xl font-bold">{Math.round((completedSections / Math.max(sections.length, 1)) * 100)}%</span><span className="text-xs text-[#9dbab5]">{completedSections}/{sections.length} categorias</span></div><div className="mt-3 progress-line bg-white/15"><span style={{ width: `${(completedSections / Math.max(sections.length, 1)) * 100}%`, background: "#f6b73c" }} /></div></div><div className="space-y-3 border-t border-white/10 pt-4 text-xs"><div className="flex items-center justify-between"><span className="text-[#a9c5c2]">Itens lançados</span><strong>{sections.reduce((sum, key) => sum + (form.findings[key] || []).filter((item) => item.text.trim()).length, 0)}</strong></div><div className="flex items-center justify-between"><span className="text-[#a9c5c2]">Pontos de atenção</span><strong className="text-[#f6c860]">{sections.reduce((sum, key) => sum + (form.findings[key] || []).filter((item) => item.text.trim() && item.status !== "ok").length, 0)}</strong></div></div></div><div className="rounded-2xl border border-[#dceae7] bg-[#edf7f4] p-5"><div className="mb-3 flex items-center gap-2 text-[#0f766e]"><CloudSun size={18} /><span className="text-sm font-bold">Dica de campo</span></div><p className="text-xs leading-relaxed text-[#577a7b]">Descreva o fato observado com objetividade. O relatório final organiza automaticamente cada item por status.</p></div><div className="flex flex-col gap-2"><button type="button" onClick={() => save("Concluída")} className="btn-primary flex items-center justify-center gap-2"><Check size={17} /> Salvar e concluir</button><button type="button" onClick={() => save("Rascunho")} className="btn-secondary flex items-center justify-center gap-2"><Save size={16} /> Salvar como rascunho</button></div></aside>
    </div>
    <div className="no-print mt-6 flex gap-2 xl:hidden"><button type="button" onClick={() => save("Concluída")} className="btn-primary flex flex-1 items-center justify-center gap-2"><Check size={17} /> Salvar e concluir</button><button type="button" onClick={() => save("Rascunho")} className="btn-secondary flex items-center justify-center gap-2"><Save size={16} /><span className="hidden sm:inline">Rascunho</span></button></div>
  </div>;
}

const openPdfWithNativeApp = async (blob: Blob, fileName: string, fallbackUrl: string) => {
  if (!Capacitor.isNativePlatform()) { window.open(fallbackUrl, "_blank", "noopener,noreferrer"); return; }
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
    const base64 = dataUrl.split(",")[1] || dataUrl;
    await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache, recursive: true });
    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    await FileOpener.open({ filePath: uri, contentType: "application/pdf", openWithDefault: true });
  } catch (error) {
    console.error(error);
    window.open(fallbackUrl, "_blank", "noopener,noreferrer");
  }
};

async function exportReportPdf(visit: Visit, onReady?: (url: string, file: File, open: () => Promise<void>) => void) {
  try {
    toast.info("Preparando PDF executivo com paginação dinâmica...");
    const pdfBlob = buildDynamicReportPdf(visit);
    const fileName = reportPdfFilename(visit.code);
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });
    const openPdf = () => openPdfWithNativeApp(pdfBlob, fileName, pdfUrl);
    onReady?.(pdfUrl, pdfFile, openPdf);
    const downloadLink = document.createElement("a");
    downloadLink.href = pdfUrl;
    downloadLink.download = fileName;
    downloadLink.click();
    const sharePdf = async () => {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [pdfFile] }))) await navigator.share({ title: "Relatório de vistoria", files: [pdfFile] });
      else await openPdf();
    };
    window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 120000);
    toast.success("PDF gerado com layout dinâmico e salvo em Downloads.", { duration: 12000, action: { label: "Abrir PDF", onClick: () => { void openPdf(); } }, cancel: { label: "Compartilhar", onClick: () => { void sharePdf(); } } });
  } catch (error) {
    console.error(error);
    toast.error("Não foi possível gerar o PDF. Tente novamente.");
  }
}
function Report({ visit, onBack, onEdit }: { visit: Visit; onBack: () => void; onEdit: () => void }) {
  const allItems = visit.categories.flatMap((section) => visit.findings[section].map((item) => ({ ...item, section })));
  const attention = allItems.filter((item) => item.status !== "ok");
  const actionItems = allItems.filter((item) => item.status !== "ok");
  const criticalItems = allItems.filter((item) => item.status === "critical");
  const [pdfActions, setPdfActions] = useState<{ url: string; file: File; open: () => Promise<void> } | null>(null);
  useEffect(() => () => { if (pdfActions?.url) URL.revokeObjectURL(pdfActions.url); }, [pdfActions]);
  const openSavedPdf = () => { if (pdfActions) void pdfActions.open(); };
  const shareSavedPdf = async () => { if (!pdfActions) return; if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [pdfActions.file] }))) await navigator.share({ title: "Relatório de vistoria", files: [pdfActions.file] }); else openSavedPdf(); };
  return <div className="mx-auto max-w-[1050px] p-5 sm:p-8"><div className="no-print mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><button onClick={onBack} className="mb-3 flex items-center gap-2 text-xs font-bold text-[#628084] hover:text-[#0f766e]"><ArrowLeft size={15} /> Voltar para histórico</button><h2 className="font-display text-3xl font-bold tracking-tight text-[#203438]">Relatório da vistoria</h2><p className="mt-2 text-sm text-[#788a8e]">Revise os registros antes de gerar o PDF final.</p></div><div className="flex gap-2"><button onClick={onEdit} className="btn-secondary flex items-center gap-2 text-sm"><FileText size={16} /> Editar</button><button onClick={() => void exportReportPdf(visit, (url, file, open) => setPdfActions({ url, file, open }))} className="btn-primary flex items-center gap-2 text-sm"><Download size={16} /> Baixar PDF</button></div></div>{pdfActions && <div className="no-print mb-5 flex flex-col gap-3 rounded-xl border border-[#bfe4d9] bg-[#effaf6] p-4 text-sm text-[#276c67] sm:flex-row sm:items-center sm:justify-between"><div><strong className="block">PDF pronto para uso</strong><span className="text-xs">O arquivo foi salvo em Downloads. Você também pode abrir ou compartilhar agora.</span></div><div className="flex flex-wrap gap-2"><button type="button" onClick={openSavedPdf} className="btn-secondary flex items-center gap-2 text-xs"><FileText size={15} /> Abrir PDF</button><button type="button" onClick={() => { void shareSavedPdf(); }} className="btn-primary flex items-center gap-2 text-xs"><Share2 size={15} /> Compartilhar</button></div></div>}<article id="print-report" className="print-page card-shadow overflow-hidden rounded-2xl bg-white"><div className="executive-cover relative overflow-hidden border-b-[9px] border-[#f6c453] px-6 py-8 text-white shadow-[inset_0_-18px_0_rgba(0,0,0,.08)] sm:px-10"><div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[28px] border-[#5cc6ad]/20" /><div className="pointer-events-none absolute -bottom-36 right-28 h-80 w-80 rounded-full border-[18px] border-[#f6c453]/15" /><div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-start"><div className="max-w-2xl"><div className="mb-8 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f6c453] text-[#103e3b] shadow-lg"><ClipboardCheck size={25} strokeWidth={2.5} /></div><div><div className="flex items-center gap-2 font-display text-base font-bold tracking-tight">{visit.logoDataUrl ? <img src={visit.logoDataUrl} alt="Logo" className="h-9 w-9 rounded-lg bg-white/90 object-contain p-1" /> : <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f6c453] text-[#103e3b]"><ClipboardCheck size={17} /></span>}{visit.companyName || "NOME DA EMPRESA"}</div><div className="executive-label mt-1 text-[#b9e0d6]">Unidade · Operações de campo</div></div></div><p className="executive-kicker mb-3 text-[#f6c453]">RELATÓRIO EXECUTIVO DE CAMPO</p><h1 className="font-display text-3xl font-bold uppercase leading-[1.05] tracking-tight sm:text-5xl">RODADA TÉCNICA<br />OPERACIONAL</h1><p className="mt-4 text-sm font-bold uppercase tracking-[.18em] text-[#d4ece5]">INSPEÇÃO SEMANAL · {visit.property || "UNIDADE OPERACIONAL"}</p><p className="mt-3 max-w-xl text-sm leading-relaxed text-[#b9d8d1]">Avaliação integrada de segurança, qualidade, produtividade, custos e oportunidades de melhoria.</p></div><div className="sm:min-w-[170px] sm:text-right"><div className="mb-4 inline-flex rounded-full bg-[#d9f2e5] px-3 py-1.5 text-xs font-extrabold text-[#176440]">{visit.status.toUpperCase()}</div><p className="executive-label text-[#a9cec6]">DATA DA VISITA</p><p className="font-display text-xl font-bold">{formatDate(visit.date)}</p><p className="mt-4 executive-label text-[#a9cec6]">CÓDIGO</p><p className="font-display text-xl font-bold">#{visit.code || "—"}</p></div></div></div><div className="border-b border-[#e8eeee] bg-[#f5faf8] px-6 py-4 sm:px-10"><div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#5b7374]"><span><strong className="text-[#35595a]">EMPRESA:</strong> {visit.companyName || "NOME DA EMPRESA"}</span><span><strong className="text-[#35595a]">EQUIPE:</strong> {visit.team || "NÃO INFORMADA"}</span><span><strong className="text-[#35595a]">LOCAL:</strong> {visit.location || "NÃO INFORMADO"}</span></div></div><div className="grid border-b border-[#e8eeee] sm:grid-cols-3"><ReportMeta label="Equipe" value={visit.team || "Não informada"} icon={HardHat} /><ReportMeta label="Participantes" value={`${visit.participants.filter((participant) => participant.name.trim()).length} pessoas`} icon={Users} /><ReportMeta label="Itens avaliados" value={`${allItems.length} registros`} icon={ClipboardCheck} /></div><div className="p-6 sm:p-10"><div className="mb-5"><p className="executive-kicker text-[#0f766e]">VISÃO GERENCIAL</p><h2 className="mt-1 font-display text-lg font-bold uppercase text-[#2e4346]">Resumo executivo da inspeção</h2></div><div className="mb-8 grid gap-4 sm:grid-cols-3"><ReportKpi value={String(allItems.length).padStart(2, "0")} label="itens avaliados" /><ReportKpi value={String(allItems.filter((item) => item.status === "ok").length).padStart(2, "0")} label="conformes" green /><ReportKpi value={String(attention.length).padStart(2, "0")} label="pontos de atenção" warning /></div><div className="mb-8 rounded-xl border border-[#e7eeec] bg-[#f8fbfa] p-5"><div className="mb-3 flex items-center gap-2"><FileText size={16} className="text-[#0f766e]" /><h2 className="text-sm font-bold text-[#33494c]">Síntese da rodada</h2></div><p className="text-sm leading-relaxed text-[#617477]">{visit.notes || "Nenhuma síntese adicional foi registrada."}</p></div><section className="break-before-page break-inside-avoid mb-10 rounded-2xl border border-[#d9e7e3] bg-[#f5faf8] p-6 sm:p-8"><div className="mb-6 flex items-start justify-between gap-4 border-b border-[#d7e8e3] pb-5"><div><p className="executive-kicker text-[#0f766e]">DECISÃO EXECUTIVA</p><h2 className="mt-1 font-display text-2xl font-bold uppercase text-[#214447]">Riscos críticos e plano de ação</h2><p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#637b7d]">Síntese automática dos desvios que exigem decisão, acompanhamento ou correção prioritária.</p></div><div className="rounded-xl bg-[#0f766e] px-4 py-3 text-center text-white"><div className="font-display text-2xl font-bold">{criticalItems.length}</div><div className="text-[9px] font-bold uppercase tracking-[.12em] text-[#c9ebe2]">riscos críticos</div></div></div>{actionItems.length === 0 ? <div className="rounded-xl border border-dashed border-[#b8d9d1] bg-white px-5 py-8 text-center text-sm text-[#5c7778]">Nenhum risco ou ponto de atenção registrado. A operação apresenta conformidade nos itens avaliados.</div> : <div className="space-y-3">{actionItems.map((item, index) => <div key={`action-${item.id}`} className="break-inside-avoid rounded-xl border border-[#e0eae7] bg-white p-4"><div className="flex items-start gap-3"><span className={`mt-0.5 rounded-md px-2 py-1 text-[9px] font-extrabold uppercase ${item.status === "critical" ? "bg-[#ffebe9] text-[#b73c35]" : "bg-[#fff4d8] text-[#a36b08]"}`}>{item.status === "critical" ? "Crítico" : "Atenção"}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold leading-relaxed text-[#344e51]">{item.text}</p><div className="mt-3 grid gap-3 text-xs sm:grid-cols-3"><div><span className="executive-label text-[#8c9d9e]">AÇÃO</span><p className="mt-1 text-[#526b6d]">{item.action || "Definir ação corretiva"}</p></div><div><span className="executive-label text-[#8c9d9e]">RESPONSÁVEL</span><p className="mt-1 text-[#526b6d]">{item.responsible || "A designar"}</p></div><div><span className="executive-label text-[#8c9d9e]">PRAZO</span><p className="mt-1 text-[#526b6d]">{item.dueDate ? new Intl.DateTimeFormat("pt-BR").format(new Date(`${item.dueDate}T12:00:00`)) : "A definir"}</p></div></div></div><span className="text-[10px] font-extrabold text-[#a0adae]">{String(index + 1).padStart(2, "0")}</span></div></div>)}</div>}<div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-white p-3"><p className="executive-label text-[#8c9d9e]">TOTAL DE ATENÇÕES</p><p className="mt-1 font-display text-xl font-bold text-[#a36b08]">{attention.length}</p></div><div className="rounded-lg bg-white p-3"><p className="executive-label text-[#8c9d9e]">CONFORMIDADE</p><p className="mt-1 font-display text-xl font-bold text-[#157a4a]">{allItems.length ? Math.round((allItems.filter((item) => item.status === "ok").length / allItems.length) * 100) : 0}%</p></div><div className="rounded-lg bg-white p-3"><p className="executive-label text-[#8c9d9e]">PRIORIDADE</p><p className="mt-1 font-display text-xl font-bold text-[#214447]">{criticalItems.length ? "IMEDIATA" : actionItems.length ? "ACOMPANHAR" : "NORMAL"}</p></div></div></section><div className="space-y-7">{visit.categories.map((section) => { const meta = getSectionMeta(section); const Icon = meta.icon; return <section key={section} className="break-inside-avoid"><div className="mb-3 flex items-center justify-between border-b border-[#e8eeee] pb-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: meta.soft, color: meta.color }}><Icon size={18} /></span><div><h2 className="font-display text-base font-bold text-[#2e4346]">{section}</h2><p className="text-[11px] text-[#8a999c]">{meta.description}</p></div></div><span className="text-xs font-bold text-[#91a0a3]">{visit.findings[section].length} itens</span></div><div className="space-y-2">{visit.findings[section].length === 0 ? <p className="py-2 text-xs italic text-[#9aa7a8]">Nenhum item registrado.</p> : visit.findings[section].map((item, index) => <div key={item.id} className="flex items-start gap-3 rounded-lg px-2 py-2"><span className="mt-1 text-[10px] font-extrabold text-[#a0adae]">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><p className="text-sm leading-relaxed text-[#52666a]">{item.text}</p>{(item.photos || []).length > 0 && <div className="mt-3 flex flex-wrap gap-2">{(item.photos || []).map((photo, photoIndex) => <figure key={photo.id} className="w-[145px] overflow-hidden rounded-lg border border-[#dfe9e6] bg-white"><div className="relative aspect-[4/3]"><img src={photo.dataUrl} alt={photo.caption || `Foto ${photoIndex + 1}`} className="h-full w-full object-cover" /><span className="absolute left-1.5 top-1.5 rounded bg-[#173b3b]/85 px-1.5 py-0.5 text-[9px] font-bold text-white">Foto {photoIndex + 1}</span></div>{photo.caption && <figcaption className="px-2 py-1.5 text-[9px] text-[#617477]">{photo.caption}</figcaption>}</figure>)}</div>}</div><StatusPill status={item.status} /></div>)}</div></section>; })}</div><div className="mt-10 grid gap-6 border-t border-[#e7eeec] pt-6 sm:grid-cols-2"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#87979a]">Participantes da visita</p><div className="flex flex-wrap gap-2">{visit.participants.filter((person) => person.name.trim()).map((person) => <span key={person.name} className="rounded-full bg-[#edf6f3] px-3 py-1.5 text-xs font-semibold text-[#3f716f]">{person.name}{person.role ? ` · ${person.role}` : ""}</span>)}</div></div><div className="sm:text-right"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#87979a]">Registro gerado em</p><p className="text-xs font-semibold text-[#637579]">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date())}</p></div></div></div><footer className="flex flex-col gap-2 border-t border-[#e8eeee] bg-[#fbfcfc] px-6 py-4 text-[10px] text-[#93a0a1] sm:flex-row sm:items-center sm:justify-between sm:px-10"><span>{visit.companyName || "NOME DA EMPRESA"} · Documento de gestão operacional</span><span>RELATÓRIO {visit.code ? `#${visit.code}` : "SEM ID"} · USO INTERNO</span></footer></article></div>;
}

function ReportMeta({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) { return <div className="flex items-center gap-3 border-b border-[#e8eeee] px-6 py-4 last:border-0 sm:border-b-0 sm:border-r sm:px-8"><Icon size={17} className="text-[#77a9a3]" /><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#94a2a4]">{label}</p><p className="mt-1 text-xs font-bold text-[#43595c]">{value}</p></div></div>; }
function ReportKpi({ value, label, green, warning }: { value: string; label: string; green?: boolean; warning?: boolean }) { return <div className="rounded-xl border border-[#e8eeee] p-4"><p className={`font-display text-2xl font-bold ${green ? "text-[#198052]" : warning ? "text-[#b27714]" : "text-[#284b4d]"}`}>{value}</p><p className="mt-1 text-[11px] font-semibold text-[#89989a]">{label}</p></div>; }

const OFFLINE_DB = "vistoria-campo-pro-offline";
const OFFLINE_STORE = "visits";
const openOfflineDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => { const request = indexedDB.open(OFFLINE_DB, 1); request.onupgradeneeded = () => request.result.createObjectStore(OFFLINE_STORE); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
const readOfflineVisits = async (): Promise<Visit[] | null> => { try { const db = await openOfflineDb(); return await new Promise((resolve, reject) => { const request = db.transaction(OFFLINE_STORE, "readonly").objectStore(OFFLINE_STORE).get("all"); request.onsuccess = () => resolve(request.result ? (request.result as unknown[]).map((item) => normalizeVisit(item as Partial<Visit>)) : null); request.onerror = () => reject(request.error); }); } catch { return null; } };
const writeOfflineVisits = async (visits: Visit[]) => { try { const db = await openOfflineDb(); await new Promise<void>((resolve, reject) => { const request = db.transaction(OFFLINE_STORE, "readwrite").objectStore(OFFLINE_STORE).put(visits, "all"); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); } catch { toast.error("Não foi possível salvar os dados offline neste aparelho."); } };

const compressImage = (file: File, maxSize = 1280, quality = 0.68): Promise<string> => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(reader.error); reader.onload = () => { const image = new Image(); image.onload = () => { const scale = Math.min(1, maxSize / Math.max(image.width, image.height)); const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); const context = canvas.getContext("2d"); if (!context) return reject(new Error("Canvas indisponível")); context.drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL("image/jpeg", quality)); }; image.onerror = () => reject(new Error("Imagem inválida")); image.src = String(reader.result); }; reader.readAsDataURL(file); });

export default function Home() {
  const [visits, setVisits] = useState<Visit[]>([seedVisit]);
  const [offlineReady, setOfflineReady] = useState(false);
  useEffect(() => { readOfflineVisits().then((saved) => { const parsed = saved?.length ? saved : [seedVisit]; setVisits(parsed.some((item) => item.id === demoVisit.id) ? parsed : [demoVisit, ...parsed]); setOfflineReady(true); }); }, []);
  const [view, setView] = useState<View>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { if (offlineReady) void writeOfflineVisits(visits); }, [visits, offlineReady]);
  const selectedVisit = useMemo(() => visits.find((visit) => visit.id === selectedId), [visits, selectedId]);
  const openVisit = (id: string) => { setSelectedId(id); setView("detail"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openNew = () => { setSelectedId(null); setView("new"); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const saveVisit = (visit: Visit) => { setVisits((current) => { const exists = current.some((item) => item.id === visit.id); return exists ? current.map((item) => item.id === visit.id ? visit : item) : [visit, ...current]; }); setSelectedId(visit.id); setView("detail"); toast.success(visit.status === "Concluída" ? "Vistoria concluída e pronta para PDF." : "Rascunho salvo com sucesso."); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const editSelected = () => { setView("new"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const activeView = view === "new" || view === "detail" ? view : "dashboard";
  return <div className="app-shell flex"><div className={`${menuOpen ? "block" : "hidden"} no-print fixed inset-0 z-20 bg-[#102c2d]/40 backdrop-blur-sm lg:hidden`} onClick={() => setMenuOpen(false)} /><div className={`${menuOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-30 transition-transform duration-200 lg:static lg:translate-x-0`}><Sidebar view={activeView} setView={(next) => { if (next === "new") openNew(); else { setView(next); setMenuOpen(false); } }} onClose={() => setMenuOpen(false)} /></div><div className="min-w-0 flex-1"><Topbar view={view} onMenu={() => setMenuOpen(true)} onNew={openNew} />{view === "dashboard" && <Dashboard visits={visits} onNew={openNew} onOpen={openVisit} />}{view === "new" && <VisitForm initial={selectedVisit || blankVisit()} onCancel={() => { setView("dashboard"); setSelectedId(null); }} onSave={saveVisit} />}{view === "detail" && selectedVisit && <Report visit={selectedVisit} onBack={() => { setView("dashboard"); setSelectedId(null); }} onEdit={editSelected} />}{view === "detail" && !selectedVisit && <Dashboard visits={visits} onNew={openNew} onOpen={openVisit} />}</div></div>;
}
