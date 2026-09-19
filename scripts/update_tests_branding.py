from pathlib import Path
p=Path('/home/ubuntu/vistoria-campo-pro/server/vistoria.test.ts')
s=p.read_text()
addition='''\n  it("preserves item photo evidence and company branding fields", () => {\n    const visit = {\n      companyName: "MS Florestal",\n      logoDataUrl: "data:image/png;base64,logo",\n      findings: { Segurança: [{ id: "1", text: "Sinalização", status: "attention", photos: [{ id: "p1", name: "acesso.jpg", dataUrl: "data:image/jpeg;base64,img", caption: "Acesso principal" }] }] },\n    };\n\n    expect(visit.companyName).toBe("MS Florestal");\n    expect(visit.logoDataUrl).toContain("data:image/png");\n    expect(visit.findings.Segurança[0].photos).toHaveLength(1);\n    expect(visit.findings.Segurança[0].photos[0].caption).toBe("Acesso principal");\n  });\n'''
idx=s.rfind('\n});')
if idx<0: raise SystemExit('test closing not found')
s=s[:idx]+addition+s[idx:]
p.write_text(s)
print('branding test added')
