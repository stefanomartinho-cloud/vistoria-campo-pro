from pathlib import Path

p = Path('/home/ubuntu/vistoria-campo-pro/client/src/pages/Home.tsx')
s = p.read_text()
s = s.replace('import { trpc } from "@/lib/trpc";\n', '')
s = s.replace('  const uploadImage = trpc.storage.uploadImage.useMutation();\n', '')
old = '  const addFindingPhoto = (section: SectionKey, id: string, files: FileList | null) => { if (!files?.length) return; Array.from(files).slice(0, 4).forEach(async (file) => { if (!file.type.startsWith("image/")) return; try { const dataUrl = await compressImage(file); const uploaded = await uploadImage.mutateAsync({ fileName: file.name, contentType: "image/jpeg", dataUrl }); setForm((current) => ({ ...current, findings: { ...current.findings, [section]: (current.findings[section] || []).map((item) => item.id === id ? { ...item, photos: [...(item.photos || []), { id: `item-photo-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: file.name, dataUrl: uploaded.url, caption: "" }] } : item) } })); toast.success("Foto salva na nuvem e vinculada ao item."); } catch { toast.error("Não foi possível enviar a foto para a nuvem."); } }); };'
new = '  const addFindingPhoto = (section: SectionKey, id: string, files: FileList | null) => { if (!files?.length) return; Array.from(files).slice(0, 4).forEach(async (file) => { if (!file.type.startsWith("image/")) return; try { const dataUrl = await compressImage(file); setForm((current) => ({ ...current, findings: { ...current.findings, [section]: (current.findings[section] || []).map((item) => item.id === id ? { ...item, photos: [...(item.photos || []), { id: `item-photo-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: file.name, dataUrl, caption: "" }] } : item) } })); toast.success("Foto salva no aparelho e vinculada ao item."); } catch { toast.error("Não foi possível salvar a foto no aparelho."); } }); };'
if old not in s: raise SystemExit('finding handler not found')
s = s.replace(old, new)
old = '  const addLogo = async (file: File | undefined) => { if (!file || !file.type.startsWith("image/")) return; try { const dataUrl = await compressImage(file, 800, 0.75); const uploaded = await uploadImage.mutateAsync({ fileName: file.name, contentType: "image/jpeg", dataUrl }); setForm((current) => ({ ...current, logoDataUrl: uploaded.url })); toast.success("Logo salva na nuvem."); } catch { toast.error("Não foi possível enviar a logo para a nuvem."); } };'
new = '  const addLogo = async (file: File | undefined) => { if (!file || !file.type.startsWith("image/")) return; try { const dataUrl = await compressImage(file, 800, 0.75); setForm((current) => ({ ...current, logoDataUrl: dataUrl })); toast.success("Logo salva no aparelho."); } catch { toast.error("Não foi possível salvar a logo no aparelho."); } };'
if old not in s: raise SystemExit('logo handler not found')
s = s.replace(old, new)
old = '  const addPhotos = (files: FileList | null) => { if (!files?.length) return; Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, 8).forEach(async (file) => { try { const dataUrl = await compressImage(file); const uploaded = await uploadImage.mutateAsync({ fileName: file.name, contentType: "image/jpeg", dataUrl }); setForm((current) => ({ ...current, photos: [...current.photos, { id: `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: file.name, dataUrl: uploaded.url, caption: "" }] })); } catch { toast.error(`Não foi possível enviar ${file.name} para a nuvem.`); } }); toast.success("Enviando fotos para a nuvem..."); };'
new = '  const addPhotos = (files: FileList | null) => { if (!files?.length) return; Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, 8).forEach(async (file) => { try { const dataUrl = await compressImage(file); setForm((current) => ({ ...current, photos: [...current.photos, { id: `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: file.name, dataUrl, caption: "" }] })); } catch { toast.error(`Não foi possível salvar ${file.name} no aparelho.`); } }); toast.success("Fotos salvas localmente no aparelho."); };'
if old not in s: raise SystemExit('photos handler not found')
s = s.replace(old, new)
marker = 'const compressImage = (file: File, maxSize = 1280, quality = 0.68): Promise<string> =>'
idx = s.index(marker)
helper = '''const OFFLINE_DB = "vistoria-campo-pro-offline";
const OFFLINE_STORE = "visits";
const openOfflineDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => { const request = indexedDB.open(OFFLINE_DB, 1); request.onupgradeneeded = () => request.result.createObjectStore(OFFLINE_STORE); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
const readOfflineVisits = async (): Promise<Visit[] | null> => { try { const db = await openOfflineDb(); return await new Promise((resolve, reject) => { const request = db.transaction(OFFLINE_STORE, "readonly").objectStore(OFFLINE_STORE).get("all"); request.onsuccess = () => resolve(request.result ? (request.result as unknown[]).map((item) => normalizeVisit(item as Partial<Visit>)) : null); request.onerror = () => reject(request.error); }); } catch { return null; } };
const writeOfflineVisits = async (visits: Visit[]) => { try { const db = await openOfflineDb(); await new Promise<void>((resolve, reject) => { const request = db.transaction(OFFLINE_STORE, "readwrite").objectStore(OFFLINE_STORE).put(visits, "all"); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); } catch { toast.error("Não foi possível salvar os dados offline neste aparelho."); } };

'''
s = s[:idx] + helper + s[idx:]
old = '  const [visits, setVisits] = useState<Visit[]>(() => { try { const saved = localStorage.getItem("vistoria-campo-pro-visits"); const parsed = saved ? (JSON.parse(saved) as unknown[]).map((item) => normalizeVisit(item as Partial<Visit>)) : [seedVisit]; return parsed.some((item) => item.id === demoVisit.id) ? parsed : [demoVisit, ...parsed]; } catch { return [seedVisit]; } });'
new = '  const [visits, setVisits] = useState<Visit[]>([seedVisit]);\n  const [offlineReady, setOfflineReady] = useState(false);\n  useEffect(() => { readOfflineVisits().then((saved) => { const parsed = saved?.length ? saved : [seedVisit]; setVisits(parsed.some((item) => item.id === demoVisit.id) ? parsed : [demoVisit, ...parsed]); setOfflineReady(true); }); }, []);'
if old not in s: raise SystemExit('visits state not found')
s = s.replace(old, new)
old = '  useEffect(() => { try { localStorage.setItem("vistoria-campo-pro-visits", JSON.stringify(visits)); } catch { try { const compact = visits.map((visit) => ({ ...visit, photos: [], findings: Object.fromEntries(Object.entries(visit.findings).map(([key, items]) => [key, items.map((item) => ({ ...item, photos: [] }))])) })); localStorage.setItem("vistoria-campo-pro-visits", JSON.stringify(compact)); toast.warning("Armazenamento local cheio. As fotos continuam visíveis nesta sessão; reduza a quantidade de imagens para manter tudo salvo no aparelho."); } catch { toast.error("Não foi possível salvar a vistoria neste aparelho."); } } }, [visits]);'
new = '  useEffect(() => { if (offlineReady) void writeOfflineVisits(visits); }, [visits, offlineReady]);'
if old not in s: raise SystemExit('persistence effect not found')
s = s.replace(old, new)
p.write_text(s)

cap = Path('/home/ubuntu/vistoria-campo-pro/capacitor.config.ts')
c = cap.read_text()
start = c.index('  server: {')
end = c.index('  android:', start)
cap.write_text(c[:start] + c[end:])
