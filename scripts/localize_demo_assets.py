from pathlib import Path

p = Path('/home/ubuntu/vistoria-campo-pro/client/src/pages/Home.tsx')
s = p.read_text()
replacements = {
    '/manus-storage/demo-logo_1ab963b7.png': '/offline-demo/logo.png',
    '/manus-storage/demo-safety_4b1dbc30.jpg': '/offline-demo/safety.jpg',
    '/manus-storage/demo-quality_199e2138.jpg': '/offline-demo/quality.jpg',
    '/manus-storage/demo-equipment_093190e3.jpg': '/offline-demo/equipment.jpg',
    '/manus-storage/demo-environment_2bb22cfa.jpg': '/offline-demo/environment.jpg',
}
for old, new in replacements.items():
    s = s.replace(old, new)
p.write_text(s)
