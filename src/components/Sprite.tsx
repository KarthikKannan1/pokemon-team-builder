import { useState } from 'react'

/** Tries each URL in turn until one loads. */
export function Sprite({
  srcs,
  alt,
  className,
}: {
  srcs: string[]
  alt: string
  className?: string
}) {
  const [i, setI] = useState(0)
  if (i >= srcs.length)
    return (
      <div className={`${className} grid place-items-center text-slate-600`}>
        ?
      </div>
    )
  return (
    <img
      key={srcs[i]}
      src={srcs[i]}
      alt={alt}
      loading="lazy"
      draggable={false}
      onError={() => setI(i + 1)}
      className={`${className} object-contain`}
    />
  )
}
