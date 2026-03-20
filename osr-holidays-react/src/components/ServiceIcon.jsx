const ServiceIcon = ({ icon: Icon, title, description }) => {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-soft transition hover:-translate-y-1">
      <div className="mb-3 inline-flex rounded-xl bg-brand-50 p-3 text-brand-700">
        <Icon size={22} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </article>
  )
}

export default ServiceIcon
