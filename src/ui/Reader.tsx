import { useEffect, useRef, useState } from 'react'
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react'
import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { getPdf } from '../storage/files'
import { useSystem } from '../store'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

/** Lector de PDF a pantalla completa. Guarda la página por la que vas. */
export function Reader({ bookId, title, onClose }: { bookId: string; title: string; onClose: () => void }) {
  const { state, update } = useSystem()
  const canvas = useRef<HTMLCanvasElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [doc, setDoc] = useState<pdfjs.PDFDocumentProxy | null>(null)
  const [error, setError] = useState<string | null>(null)
  const page = Math.max(1, state.books[bookId]?.page ?? 1)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const blob = await getPdf(bookId)
        if (!blob) throw new Error('No hay PDF guardado para este libro. Súbelo desde la Biblioteca.')
        const d = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise
        if (cancelled) return
        setDoc(d)
        update((s) => ({ ...s, books: { ...s.books, [bookId]: { ...(s.books[bookId] ?? { page: 1, status: 'leyendo', updated: Date.now() }), total: d.numPages, status: s.books[bookId]?.status === 'terminado' ? 'terminado' : 'leyendo', hasPdf: true } } }))
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se ha podido abrir el PDF.')
      }
    })()
    return () => { cancelled = true }
  }, [bookId, update])

  useEffect(() => {
    if (!doc || !canvas.current) return
    let task: pdfjs.RenderTask | null = null
    let cancelled = false
    ;(async () => {
      const p = await doc.getPage(Math.min(page, doc.numPages))
      if (cancelled || !canvas.current) return
      const width = Math.min(900, (stage.current?.clientWidth ?? 360) - 24)
      const base = p.getViewport({ scale: 1 })
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const vp = p.getViewport({ scale: (width / base.width) * dpr })
      const c = canvas.current
      c.width = vp.width
      c.height = vp.height
      c.style.width = `${vp.width / dpr}px`
      task = p.render({ canvas: c, viewport: vp })
      await task.promise.catch(() => undefined)
    })()
    return () => { cancelled = true; task?.cancel() }
  }, [doc, page])

  const go = (d: number) => {
    if (!doc) return
    const next = Math.max(1, Math.min(doc.numPages, page + d))
    update((s) => ({
      ...s,
      books: { ...s.books, [bookId]: { ...(s.books[bookId] ?? { status: 'leyendo' }), page: next, total: doc.numPages, status: next >= doc.numPages ? 'terminado' : 'leyendo', updated: Date.now(), hasPdf: true } },
    }))
    stage.current?.scrollTo({ top: 0 })
  }

  return (
    <div className="reader" role="dialog" aria-modal="true" aria-label={`Leyendo ${title}`} data-testid="reader">
      <header>
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar el lector"><X size={20} /></button>
        <h2>{title}</h2>
        <span className="pg">{doc ? `${page}/${doc.numPages}` : ''}</span>
      </header>
      <div className="stage" ref={stage}>
        {error ? <p className="empty">{error}</p> : <canvas ref={canvas} aria-label={`Página ${page}`} />}
      </div>
      <footer>
        <button className="btn sm" onClick={() => go(-1)} disabled={!doc || page <= 1} aria-label="Página anterior"><CaretLeft size={18} /></button>
        <p className="pg" style={{ margin: 0 }}>Página {page}</p>
        <button className="btn sm" onClick={() => go(1)} disabled={!doc || page >= (doc?.numPages ?? 1)} aria-label="Página siguiente"><CaretRight size={18} /></button>
      </footer>
    </div>
  )
}
