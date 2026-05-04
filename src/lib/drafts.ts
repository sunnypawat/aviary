// IndexedDB helpers for offline sighting drafts

const DB_NAME = "aviary"
const STORE = "drafts"
const VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export type Draft = {
  id: string
  data: Record<string, string>
  savedAt: string
}

export async function saveDraft(data: Record<string, string>): Promise<string> {
  const db = await openDB()
  const draft: Draft = { id: crypto.randomUUID(), data, savedAt: new Date().toISOString() }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).put(draft)
    tx.oncomplete = () => resolve(draft.id)
    tx.onerror = () => reject(tx.error)
  })
}

export async function getDrafts(): Promise<Draft[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly")
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result as Draft[])
    req.onerror = () => reject(req.error)
  })
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
