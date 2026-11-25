import { useState, type CSSProperties } from 'react'

interface Props {
  srcs: string[]
  alt: string
  className?: string
  /** Enlarge the image to at most this × its natural size (keeps low-res GIFs from getting blocky). */
  maxScale?: number
}

/** Tries each URL in turn until one loads. */
export function Sprite({ srcs, alt, className = '', maxScale }: Props) {
  const [i, setI] = useState(0)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)

  if (i >= srcs.length)
    return (
      <div className={`${className} grid place-items-center text-slate-600`}>
        ?
      </div>
    )

  // With maxScale: size = natural × maxScale; CSS max-w/max-h on className still caps it to the box
  const style: CSSProperties | undefined =
    maxScale && natural
      ? { width: natural.w * maxScale, height: natural.h * maxScale }
      : undefined

  return (
    <img
      key={srcs[i]}
      src={srcs[i]}
      alt={alt}
      loading="lazy"
      draggable={false}
      style={style}
      onLoad={
        maxScale
          ? (e) =>
              setNatural({
                w: e.currentTarget.naturalWidth,
                h: e.currentTarget.naturalHeight,
              })
          : undefined
      }
      onError={() => {
        setNatural(null)
        setI(i + 1)
      }}
      className={`${className} object-contain`}
    />
  )
}
