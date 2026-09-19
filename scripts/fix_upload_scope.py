from pathlib import Path
p=Path('/home/ubuntu/vistoria-campo-pro/client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('function VisitForm({ initial, onCancel, onSave }: { initial: Visit; onCancel: () => void; onSave: (visit: Visit) => void }) {\n', 'function VisitForm({ initial, onCancel, onSave }: { initial: Visit; onCancel: () => void; onSave: (visit: Visit) => void }) {\n  const uploadImage = trpc.storage.uploadImage.useMutation();\n',1)
s=s.replace('export default function Home() {\n  const uploadImage = trpc.storage.uploadImage.useMutation();\n', 'export default function Home() {\n',1)
p.write_text(s)
print('upload hook scope fixed')
