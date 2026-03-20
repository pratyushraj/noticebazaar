import { motion } from 'framer-motion'
import SafeImage from './SafeImage'

const CityCard = ({ city, image }) => {
  return (
    <motion.article
      whileHover={{ scale: 1.03 }}
      className="min-w-[200px] snap-start overflow-hidden rounded-2xl bg-white shadow-soft"
    >
      <SafeImage src={image} alt={city} className="h-28 w-full object-cover" />
      <div className="p-3 text-center text-sm font-semibold text-slate-800">{city}</div>
    </motion.article>
  )
}

export default CityCard
