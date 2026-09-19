from pathlib import Path
p=Path('/home/ubuntu/vistoria-campo-pro/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('type Finding = {\n  id: string;\n  text: string;\n  status: FindingStatus;\n};', 'type Finding = {\n  id: string;\n  text: string;\n  status: FindingStatus;\n  photos?: Photo[];\n};')
# normalize old findings and add helper handler.
s=s.replace('const findings = { ...emptyFindings(), ...(raw.findings || {}) } as Record<SectionKey, Finding[]>;', 'const findings = { ...emptyFindings(), ...(raw.findings || {}) } as Record<SectionKey, Finding[]>;\n  Object.keys(findings).forEach((category) => { findings[category] = (findings[category] || []).map((item) => ({ ...item, photos: item.photos || [] })); });')
s=s.replace('  const updateFinding = (section: SectionKey, id: string, patch: Partial<Finding>) =>', '  const addFindingPhoto = (section: SectionKey, id: string, files: FileList | null) => { const file = files?.[0]; if (!file || !file.type.startsWith("image/")) return; const reader = new FileReader(); reader.onload = () => { setForm((current) => ({ ...current, findings: { ...current.findings, [section]: (current.findings[section] || []).map((item) => item.id === id ? { ...item, photos: [...(item.photos || []), { id: `item-photo-${Date.now()}`, name: file.name, dataUrl: String(reader.result), caption: "" }] } : item) } })); toast.success("Foto vinculada ao item."); }; reader.readAsDataURL(file); };\n  const removeFindingPhoto = (section: SectionKey, id: string, photoId: string) => setForm((current) => ({ ...current, findings: { ...current.findings, [section]: (current.findings[section] || []).map((item) => item.id === id ? { ...item, photos: (item.photos || []).filter((photo) => photo.id !== photoId) } : item) } }));\n  const updateFinding = (section: SectionKey, id: string, patch: Partial<Finding>) =>')
# Add camera UI inside each finding, after textarea wrapper and before select div.
old='''</div><div className="flex items-center gap-2 sm:w-[135px] sm:pt-1"><select value={item.status}'''
new='''</div><div className="flex items-center gap-2 sm:w-[135px] sm:pt-1"><label title="Tirar foto deste item" className="flex h-[43px] w-[43px] cursor-pointer items-center justify-center rounded-lg border border-[#cfe3de] bg-[#f4fbf8] text-[#0f766e] hover:bg-[#e7f5f0]"><Camera size={17} /><input type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => { addFindingPhoto(activeSection, item.id, event.target.files); event.currentTarget.value = ""; }} /></label><select value={item.status}'''
if old not in s: raise SystemExit('item control anchor missing')
s=s.replace(old,new,1)
# Add thumbnails below item control row, preserving layout.
s=s.replace('''<button type="button" onClick={() => removeFinding(activeSection, item.id)} className="rounded-lg p-2 text-[#a9b6b7] hover:bg-[#fff1ef] hover:text-[#c2413a]"><Trash2 size={15} /></button></div></div>)}</div>}''','''<button type="button" onClick={() => removeFinding(activeSection, item.id)} className="rounded-lg p-2 text-[#a9b6b7] hover:bg-[#fff1ef] hover:text-[#c2413a]"><Trash2 size={15} /></button></div>{(item.photos || []).length > 0 && <div className="mt-3 flex flex-wrap gap-2 pl-8">{(item.photos || []).map((photo) => <div key={photo.id} className="group relative h-14 w-16 overflow-hidden rounded-lg border border-[#dce9e5]"><img src={photo.dataUrl} alt="Evidência do item" className="h-full w-full object-cover" /><button type="button" onClick={() => removeFindingPhoto(activeSection, item.id, photo.id)} className="absolute right-1 top-1 hidden rounded bg-[#173b3b]/80 p-1 text-white group-hover:block"><X size={10} /></button></div>)}</div>}</div></div>)}</div>}''',1)
# Report: show item photos under each finding row.
oldreport='''<p className="min-w-0 flex-1 text-sm leading-relaxed text-[#52666a]">{item.text}</p><StatusPill status={item.status} /></div>)}</div></section>; })}'''
newreport='''<div className="min-w-0 flex-1"><p className="text-sm leading-relaxed text-[#52666a]">{item.text}</p>{(item.photos || []).length > 0 && <div className="mt-3 flex flex-wrap gap-2">{(item.photos || []).map((photo, photoIndex) => <figure key={photo.id} className="w-[145px] overflow-hidden rounded-lg border border-[#dfe9e6] bg-white"><div className="relative aspect-[4/3]"><img src={photo.dataUrl} alt={photo.caption || `Foto ${photoIndex + 1}`} className="h-full w-full object-cover" /><span className="absolute left-1.5 top-1.5 rounded bg-[#173b3b]/85 px-1.5 py-0.5 text-[9px] font-bold text-white">Foto {photoIndex + 1}</span></div>{photo.caption && <figcaption className="px-2 py-1.5 text-[9px] text-[#617477]">{photo.caption}</figcaption>}</figure>)}</div>}</div><StatusPill status={item.status} /></div>)}</div></section>; })}'''
if oldreport not in s: raise SystemExit('report item anchor missing')
s=s.replace(oldreport,newreport,1)
# Remove empty generic photo section from report to avoid duplicates, leaving generic capture in form.
start=s.find('{(visit.photos || []).length > 0 && <section className="mt-10 break-before-page')
if start >= 0:
    end=s.find('</section>}<div className="mt-10 grid gap-6 border-t border-[#e7eeec] pt-6 sm:grid-cols-2">',start)
    if end >= 0:
        end += len('</section>')
        s=s[:start]+s[end:]
p.write_text(s)
print('item photos applied')
