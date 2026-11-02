import { useEffect, useRef, useState } from 'react'
import {
  Barbell, ChatsCircle, Crown, Brain, Eye, Translate, MusicNotes, IconProps,
} from '@phosphor-icons/react'
import type { AttrId } from '../data/attrs'

export function Panel({ title, live, tone, float = true, className = '', children, testId }: {
  title?: string; live?: boolean; tone?: 'gold' | 'danger'; float?: boolean; className?: string; children: React.ReactNode; testId?: string
}) {
  return (
    <section className={`${float ? 'float' : ''} ${className}`} data-testid={testId}>
      <div className={`holo ${live ? 'live' : ''} ${tone ?? ''}`}>
        <div className="holo-in">
          {title && <header className="ptitle"><span>{title}</span></header>}
          {children}
        </div>
      </div>
    </section>
  )
}

export function Bar({ value, max, tone, seg = 20, label }: { value: number; max: number; tone?: 'gold'; seg?: number; label: string }) {
  const filled = max > 0 ? Math.round(Math.max(0, Math.min(1, value / max)) * seg) : 0
  return (
    <div className={`bar ${tone ?? ''}`} style={{ ['--seg' as string]: seg }} role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
      {Array.from({ length: seg }, (_, i) => <i key={i} className={i < filled ? 'on' : ''} />)}
    </div>
  )
}

const ICONS: Record<AttrId, React.ComponentType<IconProps>> = {
  FUERZA: Barbell,
  CARISMA: ChatsCircle,
  PODER: Crown,
  MENTE: Brain,
  SABIDURIA: Eye,
  LENGUA: Translate,
  CREACION: MusicNotes,
}
export function AttrIcon({ id, size = 26 }: { id: AttrId; size?: number }) {
  const I = ICONS[id]
  return <I size={size} weight="duotone" aria-hidden />
}

export function Check({ checked, onChange, label, disabled }: { checked: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <label className="check-wrap">
      <input type="checkbox" className="check" checked={checked} onChange={onChange} aria-label={label} disabled={disabled} />
    </label>
  )
}

/** Texto que se "descifra" al aparecer, como una ventana del Sistema. */
export function Decode({ text, className }: { text: string; className?: string }) {
  const [out, setOut] = useState(text)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setOut(text)
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&'
    let frame = 0
    const total = 16
    const id = setInterval(() => {
      frame++
      const reveal = Math.floor((frame / total) * text.length)
      setOut(text.split('').map((c, i) => (i < reveal || c === ' ' ? c : glyphs[(i * 7 + frame) % glyphs.length])).join(''))
      if (frame >= total) {
        clearInterval(id)
        setOut(text)
      }
    }, 28)
    return () => clearInterval(id)
  }, [text])
  return <span className={className} aria-label={text}><span aria-hidden>{out}</span></span>
}

/** Partículas de luz que suben despacio. Canvas fijo y sin eventos. */
export function Particles() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, raf = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      w = c.clientWidth; h = c.clientHeight
      c.width = w * dpr; c.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const dots = Array.from({ length: 46 }, (_, i) => ({ x: ((i * 97) % 100) / 100, y: ((i * 61) % 100) / 100, r: 0.6 + ((i * 13) % 10) / 9, v: 0.00012 + ((i * 7) % 10) / 60000 }))
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const color = getComputedStyle(document.documentElement).getPropertyValue('--particle') || '60, 200, 255'
      for (const d of dots) {
        if (!reduce) { d.y -= d.v * 16; if (d.y < -0.02) d.y = 1.02 }
        const a = 0.25 + 0.5 * Math.abs(Math.sin(d.y * 9 + d.x * 5))
        ctx.beginPath()
        ctx.fillStyle = `rgba(${color}, ${a})`
        ctx.shadowColor = `rgba(${color}, 0.9)`
        ctx.shadowBlur = 8
        ctx.arc(d.x * w, d.y * h, d.r, 0, Math.PI * 2)
        ctx.fill()
      }
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} aria-hidden />
}

/** Radar de atributos: forma heptagonal con el nivel de cada uno. */
export function Radar({ values, max, labels }: { values: number[]; max: number; labels: string[] }) {
  const n = values.length
  const size = 300, cx = size / 2, cy = size / 2 + 6, R = 104
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const
  }
  const ring = (f: number) => values.map((_, i) => pt(i, R * f).join(',')).join(' ')
  const shape = values.map((v, i) => pt(i, R * Math.max(0.06, Math.min(1, v / max))).join(',')).join(' ')
  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: 340 }} role="img" aria-label={`Atributos: ${labels.map((l, i) => `${l} nivel ${values[i]}`).join(', ')}`}>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={ring(f)} fill="none" stroke="rgba(var(--rgb), 0.2)" />)}
      {values.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(var(--rgb), 0.15)" /> })}
      <polygon points={shape} fill="rgba(var(--rgb), 0.22)" stroke="var(--accent)" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 6px rgba(var(--rgb), 0.9))' }} />
      {values.map((v, i) => { const [x, y] = pt(i, R * Math.max(0.06, Math.min(1, v / max))); return <circle key={i} cx={x} cy={y} r="3.5" fill="#fff" /> })}
      {labels.map((l, i) => {
        const [x, y] = pt(i, R + 26)
        return (
          <g key={l}>
            <text x={x} y={y - 2} textAnchor="middle">{l}</text>
            <text x={x} y={y + 13} textAnchor="middle" className="lv">{values[i]}</text>
          </g>
        )
      })}
    </svg>
  )
}

export const fmtDate = (d: Date) => {
  const t = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}
