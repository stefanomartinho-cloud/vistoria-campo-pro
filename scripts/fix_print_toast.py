from pathlib import Path
p=Path('/home/ubuntu/vistoria-campo-pro/client/src/index.css')
s=p.read_text()
needle='''@media print {\n  body { background:white; }'''
replacement='''@media print {\n  [data-sonner-toaster], .sonner-toaster, [data-radix-toast-viewport], .toast, .toaster { display:none !important; visibility:hidden !important; }\n  body { background:white; }'''
if needle not in s: raise SystemExit('print media anchor missing')
s=s.replace(needle,replacement,1)
if '.break-before-page' not in s:
    s += '\n.break-before-page { break-before: page; page-break-before: always; }\n'
p.write_text(s)
print('print toast rules added')
