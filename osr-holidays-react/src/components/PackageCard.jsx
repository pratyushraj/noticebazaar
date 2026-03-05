import { motion } from 'framer-motion'
import SafeImage from './SafeImage'

const PackageCard = ({ image, title, price, duration }) => {
  return (
    <motion.article
      whileHover={{ y: -5 }}
      className="overflow-hidden rounded-2xl bg-white shadow-soft transition"
    >
      <div className="group h-48 overflow-hidden">
        <SafeImage
          src={image}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
      </div>
      <div className="space-y-3 p-5">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-brand-700">Starting from {price}</span>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">{duration}</span>
        </div>
        <p className="text-xs font-medium text-slate-600">Stay included: {duration}</p>
        <a href="#contact" className="block w-full rounded-full bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700">
          View Details
        </a>
      </div>
    </motion.article>
  )
}

export default PackageCard
