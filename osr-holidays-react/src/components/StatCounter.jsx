import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

const StatCounter = ({ value, suffix = '', label }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 1200
    const increment = Math.max(1, Math.floor(value / 60))
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, duration / 60)

    return () => clearInterval(timer)
  }, [isInView, value])

  return (
    <div ref={ref} className="rounded-2xl bg-white/10 p-5 text-center backdrop-blur-sm">
      <div className="text-3xl font-extrabold text-white">
        {count}
        {suffix}
      </div>
      <p className="mt-1 text-sm text-blue-100">{label}</p>
    </div>
  )
}

export default StatCounter
