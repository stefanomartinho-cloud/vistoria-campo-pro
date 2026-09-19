from pathlib import Path
import re
p=Path('/home/ubuntu/vistoria-campo-pro/client/src/pages/Home.tsx')
s=p.read_text()
start=s.find('{(visit.photos || []).length > 0 && <section className="mt-10 break-inside-avoid')
end=s.find('</section>}<div className="mt-10 grid gap-6 border-t border-[#e7eeec] pt-6 sm:grid-cols-2">', start)
if start < 0 or end < 0: raise SystemExit(f'anchors missing {start} {end}')
end += len('</section>')
new='''{(visit.photos || []).length > 0 && <section className="mt-10 break-before-page break-inside-avoid border-t-[3px] border-[#0f766e] pt-6"><div className="mb-5 flex items-end justify-between"><div><div className="mb-2 flex items-center gap-2 text-[#0f766e]"><Camera size={16} /><span className="text-[10px] font-bold uppercase tracking-[.16em]">Anexo gerencial</span></div><h2 className="font-display text-xl font-bold text-[#2e4346]">Evidências fotográficas</h2><p className="mt-1 text-xs text-[#7c8d90]">Registro visual dos pontos observados durante a rodada técnica.</p></div><span className="rounded-full bg-[#eaf5f2] px-3 py-1.5 text-xs font-bold text-[#26716b]">{(visit.photos || []).length} {(visit.photos || []).length === 1 ? "foto" : "fotos"}</span></div><div className="grid grid-cols-2 gap-4">{(visit.photos || []).map((photo, index) => <figure key={photo.id} className="break-inside-avoid overflow-hidden rounded-xl border border-[#dfe9e6] bg-white shadow-sm"><div className="relative aspect-[4/3] bg-[#eef4f2]"><img src={photo.dataUrl} alt={photo.caption || photo.name} className="h-full w-full object-cover" /><span className="absolute left-2 top-2 rounded-md bg-[#173b3b]/85 px-2 py-1 text-[10px] font-bold text-white">Foto {String(index + 1).padStart(2, "0")}</span></div><figcaption className="min-h-[42px] border-t border-[#e8eeee] px-3 py-2.5 text-[11px] leading-relaxed text-[#52666a]">{photo.caption || "Registro fotográfico da vistoria"}</figcaption></figure>)}</div><div className="mt-5 rounded-lg bg-[#f5f9f7] px-4 py-3 text-[10px] leading-relaxed text-[#718387]"><strong className="text-[#3f6060]">Nota gerencial:</strong> As imagens acima foram registradas como evidência visual da visita de campo e devem ser analisadas em conjunto com os achados e status apresentados neste relatório.</div></section>}'''
s=s[:start]+new+s[end:]
p.write_text(s)
print('upgraded')
