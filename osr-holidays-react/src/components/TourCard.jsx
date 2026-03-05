import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import SafeImage from './SafeImage'

const TourCard = ({ title, image, duration, price }) => {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="min-w-[280px] snap-start overflow-hidden rounded-2xl bg-white shadow-soft"
    >
      <div className="group relative h-48 overflow-hidden">
        <SafeImage
          src={image}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
      </div>
      <div className="border-y border-slate-100 bg-white px-4 py-1.5 text-sm font-semibold text-slate-800">
        {duration ?? '5 Days'} • {price ?? '₹24,999'}
      </div>
      <div className="flex items-center justify-between bg-brand-700 px-4 py-3 text-white">
        <h3 className="text-xl font-medium">{title}</h3>
        <a href="#contact" aria-label={`Enquire for ${title}`} className="rounded-full border border-white/50 p-2 transition hover:bg-white/10">
          <ArrowRight size={18} />
        </a>
      </div>
    </motion.article>
  )
}

export default TourCard
