import { motion } from 'framer-motion'
import SafeImage from './SafeImage'

const BlogCard = ({ image, title, date }) => {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="overflow-hidden rounded-2xl bg-white shadow-soft"
    >
      <div className="group h-48 overflow-hidden">
        <SafeImage
          src={image}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
      </div>
      <div className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{date}</p>
        <h3 className="text-lg font-semibold">{title}</h3>
        <a href="#blog" className="text-sm font-semibold text-brand-700 hover:text-brand-800">Read More</a>
      </div>
    </motion.article>
  )
}

export default BlogCard
