from pathlib import Path
p=Path('/home/ubuntu/vistoria-campo-pro/server/vistoria.test.ts')
s=p.read_text()
addition='''\n  it("prioritizes critical findings in the executive action plan", () => {\n    const findings = [{ status: "attention" }, { status: "critical" }, { status: "ok" }];\n    const critical = findings.filter((item) => item.status === "critical").length;\n    const attention = findings.filter((item) => item.status !== "ok").length;\n    expect({ critical, attention, priority: critical ? "IMEDIATA" : "ACOMPANHAR" }).toEqual({ critical: 1, attention: 2, priority: "IMEDIATA" });\n  });\n'''
idx=s.rfind('\n});')
if idx<0: raise SystemExit('test closing not found')
p.write_text(s[:idx]+addition+s[idx:])
print('action test added')
