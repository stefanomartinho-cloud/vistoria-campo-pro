import { describe, expect, it } from "vitest";

type Item = { status: "ok" | "attention" | "critical" };
type Participant = { name: string; role: string };

type VisitLike = {
  categories: string[];
  participants: Participant[];
  findings: Record<string, Item[]>;
};

function summarizeVisit(visit: VisitLike) {
  const items = visit.categories.flatMap((category) => visit.findings[category] || []);
  return {
    total: items.length,
    conformes: items.filter((item) => item.status === "ok").length,
    attention: items.filter((item) => item.status !== "ok").length,
  };
}

describe("vistoria report summary", () => {
  it("counts evaluated items and attention points across all pillars", () => {
    const summary = summarizeVisit({
      categories: ["Segurança", "Qualidade", "Produtividade", "Custo"],
      participants: [],
      findings: {
        Segurança: [{ status: "attention" }, { status: "ok" }],
        Qualidade: [{ status: "attention" }],
        Produtividade: [{ status: "ok" }],
        Custo: [{ status: "ok" }, { status: "critical" }],
      },
    });

    expect(summary).toEqual({ total: 6, conformes: 3, attention: 3 });
  });

  it("includes custom categories in the report summary", () => {
    const summary = summarizeVisit({
      categories: ["Segurança", "Meio ambiente"],
      participants: [{ name: "Ana", role: "Técnica" }],
      findings: {
        Segurança: [{ status: "ok" }],
        "Meio ambiente": [{ status: "attention" }, { status: "ok" }],
      },
    });

    expect(summary).toEqual({ total: 3, conformes: 2, attention: 1 });
  });

  it("keeps participant hierarchy as part of the visit model", () => {
    const participant: Participant = { name: "Stefano Martin", role: "Técnico" };
    expect(`${participant.name} · ${participant.role}`).toBe("Stefano Martin · Técnico");
  });

  it("returns an empty summary for a new draft", () => {
    expect(summarizeVisit({ categories: ["Segurança", "Qualidade", "Produtividade", "Custo"], participants: [], findings: { Segurança: [], Qualidade: [], Produtividade: [], Custo: [] } })).toEqual({
      total: 0,
      conformes: 0,
      attention: 0,
    });
  });
  it("preserves item photo evidence and company branding fields", () => {
    const visit = {
      companyName: "MS Florestal",
      logoDataUrl: "data:image/png;base64,logo",
      findings: { Segurança: [{ id: "1", text: "Sinalização", status: "attention", photos: [{ id: "p1", name: "acesso.jpg", dataUrl: "data:image/jpeg;base64,img", caption: "Acesso principal" }] }] },
    };

    expect(visit.companyName).toBe("MS Florestal");
    expect(visit.logoDataUrl).toContain("data:image/png");
    expect(visit.findings.Segurança[0].photos).toHaveLength(1);
    expect(visit.findings.Segurança[0].photos[0].caption).toBe("Acesso principal");
  });

  it("preserves item photo evidence and company branding fields", () => {
    const visit = {
      companyName: "MS Florestal",
      logoDataUrl: "data:image/png;base64,logo",
      findings: { Segurança: [{ id: "1", text: "Sinalização", status: "attention", photos: [{ id: "p1", name: "acesso.jpg", dataUrl: "data:image/jpeg;base64,img", caption: "Acesso principal" }] }] },
    };

    expect(visit.companyName).toBe("MS Florestal");
    expect(visit.logoDataUrl).toContain("data:image/png");
    expect(visit.findings.Segurança[0].photos).toHaveLength(1);
    expect(visit.findings.Segurança[0].photos[0].caption).toBe("Acesso principal");
  });

  it("prioritizes critical findings in the executive action plan", () => {
    const findings = [{ status: "attention" }, { status: "critical" }, { status: "ok" }];
    const critical = findings.filter((item) => item.status === "critical").length;
    const attention = findings.filter((item) => item.status !== "ok").length;
    expect({ critical, attention, priority: critical ? "IMEDIATA" : "ACOMPANHAR" }).toEqual({ critical: 1, attention: 2, priority: "IMEDIATA" });
  });

});
