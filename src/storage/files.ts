// PDFs guardados en el propio dispositivo (IndexedDB). No salen del navegador.

const DB = 'el-sistema-files'
const STORE = 'books'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const req = fn(t.objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export const putPdf = (bookId: string, data: Blob) => tx('readwrite', (s) => s.put(data, bookId))
export const getPdf = (bookId: string) => tx<Blob | undefined>('readonly', (s) => s.get(bookId))
export const deletePdf = (bookId: string) => tx('readwrite', (s) => s.delete(bookId))
