from pathlib import Path
p=Path('/home/ubuntu/vistoria-campo-pro/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('  property: string;\n  code:', '  property: string;\n  companyName: string;\n  logoDataUrl?: string;\n  code:')
s=s.replace('  property: "Fazenda São Guilherme",\n  code:', '  property: "Fazenda São Guilherme",\n  companyName: "MS Florestal",\n  logoDataUrl: "",\n  code:')
s=s.replace('  property: "",\n  code:', '  property: "",\n  companyName: "",\n  logoDataUrl: "",\n  code:')
s=s.replace('  return { id:', '  return { companyName: raw.companyName || "", logoDataUrl: raw.logoDataUrl || "", id:',1)
# Add logo handler beside addPhotos.
s=s.replace('  const addPhotos = (files: FileList | null) => {', '  const addLogo = (file: File | undefined) => { if (!file || !file.type.startsWith("image/")) return; const reader = new FileReader(); reader.onload = () => setForm((current) => ({ ...current, logoDataUrl: String(reader.result) })); reader.readAsDataURL(file); };\n  const addPhotos = (files: FileList | null) => {')
# Add fields at start of identification form before property label.
needle='<label><span className="field-label">Fazenda / unidade *'
insert='''<div className="grid gap-4 sm:grid-cols-[1fr_220px] sm:items-end"><div><label className="field-label">Empresa / unidade responsável *</label><input value={form.companyName} onChange={(event) => update("companyName", event.target.value)} className="field-input" placeholder="Ex.: MS Florestal" /></div><div><label className="field-label">Logo da empresa</label><label className="flex h-[45px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[#cfe3de] bg-[#f7fcfa] px-3 text-xs font-bold text-[#276c67] hover:bg-[#eaf7f3]"><ImagePlus size={16} /> {form.logoDataUrl ? "Trocar logo" : "Selecionar logo"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { addLogo(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label></div></div><div className="mt-4 flex items-center gap-3"><div className="flex h-14 w-20 items-center justify-center overflow-hidden rounded-lg border border-[#dfe9e7] bg-[#f5faf8]">{form.logoDataUrl ? <img src={form.logoDataUrl} alt="Logo da empresa" className="max-h-full max-w-full object-contain" /> : <span className="text-[10px] font-bold uppercase text-[#96aaa8]">Sem logo</span>}</div><p className="text-xs text-[#829496]">A logo aparecerá no cabeçalho verde do relatório PDF.</p></div><label className="field-label mt-5">Fazenda / unidade *'''
if needle not in s: raise SystemExit('identification anchor not found')
s=s.replace(needle,insert,1)
# Replace static company header occurrences in report.
s=s.replace('<div className="font-display text-base font-bold tracking-tight">NOME DA EMPRESA</div>', '<div className="flex items-center gap-2 font-display text-base font-bold tracking-tight">{visit.logoDataUrl ? <img src={visit.logoDataUrl} alt="Logo" className="h-9 w-9 rounded-lg bg-white/90 object-contain p-1" /> : <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f6c453] text-[#103e3b]"><ClipboardCheck size={17} /></span>}{visit.companyName || "NOME DA EMPRESA"}</div>',1)
s=s.replace('<span><strong className="text-[#35595a]">EMPRESA:</strong> NOME DA EMPRESA</span>', '<span><strong className="text-[#35595a]">EMPRESA:</strong> {visit.companyName || "NOME DA EMPRESA"}</span>',1)
s=s.replace('<span>NOME DA EMPRESA · Documento de gestão operacional</span>', '<span>{visit.companyName || "NOME DA EMPRESA"} · Documento de gestão operacional</span>',1)
p.write_text(s)
print('company logo added')
