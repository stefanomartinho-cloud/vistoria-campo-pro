from pathlib import Path
p=Path('/home/ubuntu/vistoria-campo-pro/client/src/index.css')
s=p.read_text()
old='''@media print {\n  body { background:white; }\n  .no-print { display:none !important; }\n  #print-report { display:block !important; }\n  .print-page { box-shadow:none !important; border:0 !important; margin:0 !important; max-width:none !important; }\n  @page { size: A4; margin: 14mm; }\n}'''
new='''@media print {\n  body { background:white; }\n  .no-print { display:none !important; }\n  #print-report { display:block !important; overflow:visible !important; }\n  .print-page { box-shadow:none !important; border:0 !important; margin:0 !important; max-width:none !important; overflow:visible !important; }\n  .print-page * { max-width:100%; overflow-wrap:anywhere; word-break:break-word; }\n  .print-page img { max-width:100%; height:auto; }\n  .print-page p, .print-page h1, .print-page h2, .print-page h3, .print-page figure, .print-page .break-inside-avoid { break-inside:avoid; page-break-inside:avoid; }\n  .executive-cover { -webkit-print-color-adjust:exact; print-color-adjust:exact; }\n  @page { size: A4; margin: 14mm; }\n}'''
if old not in s: raise SystemExit('print block not found')
p.write_text(s.replace(old,new))
print('print audit rules added')
