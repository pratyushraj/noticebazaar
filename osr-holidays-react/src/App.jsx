import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Menu,
  X,
  CalendarDays,
  MapPin,
  Wallet,
  Search,
  ArrowRight,
  Phone,
  Utensils,
  UserRound,
  FileCheck2,
  CarFront,
  Building2,
  PlaneTakeoff,
  Facebook,
  Instagram,
  Linkedin,
  Map,
} from 'lucide-react'

import TourCard from './components/TourCard'
import PackageCard from './components/PackageCard'
import CityCard from './components/CityCard'
import StatCounter from './components/StatCounter'
import ServiceIcon from './components/ServiceIcon'
import BlogCard from './components/BlogCard'
import SafeImage from './components/SafeImage'

import {
  topTours,
  summerSpecials,
  domesticPackages,
  cities,
  countryTours,
  europePackages,
  blogPosts,
} from './data/travelData'

const sectionMotion = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: 'easeOut' },
}

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Destinations', href: '#destinations' },
  { label: 'Tours', href: '#tours' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
]

const destinationCards = [
  {
    title: 'Gujarat Tour Packages',
    tours: '460+ Tours',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'India Tour Packages',
    tours: '1580+ Tours',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'International Tour Packages',
    tours: '3040+ Tours',
    image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?auto=format&fit=crop&w=1200&q=80',
  },
]

const inclusiveFeatures = [
  { icon: UserRound, label: 'Go with communities' },
  { icon: Utensils, label: 'Chef-prepared meals' },
  { icon: Map, label: 'Curated Itinerary' },
  { icon: Building2, label: 'Unforgettable stays' },
  { icon: CarFront, label: 'On Tour Transport' },
  { icon: PlaneTakeoff, label: 'To & From Airfare' },
]

const parsePriceToNumber = (price) => Number(String(price).replace(/[^\d]/g, ''))

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchDestination, setSearchDestination] = useState('')
  const [searchMonth, setSearchMonth] = useState('')
  const [searchBudget, setSearchBudget] = useState('all')
  const [tourTab, setTourTab] = useState('domestic')
  const [spotlightIndex, setSpotlightIndex] = useState(0)
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false)

  const filteredDomestic = useMemo(() => {
    return domesticPackages.filter((pkg) => {
      const titleMatch = pkg.title.toLowerCase().includes(searchDestination.toLowerCase())
      const price = parsePriceToNumber(pkg.price)
      const budgetMatch =
        searchBudget === 'all' ||
        (searchBudget === 'under25' && price <= 25000) ||
        (searchBudget === '25to50' && price > 25000 && price <= 50000) ||
        (searchBudget === '50to100' && price > 50000 && price <= 100000) ||
        (searchBudget === '100plus' && price > 100000)

      return titleMatch && budgetMatch
    })
  }, [searchBudget, searchDestination])

  const visiblePackages = tourTab === 'domestic' ? filteredDomestic : europePackages
  const spotlightPackages = domesticPackages.slice(0, 4)
  const currentSpotlight = spotlightPackages[spotlightIndex]

  useEffect(() => {
    const timer = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % spotlightPackages.length)
    }, 3800)

    return () => clearInterval(timer)
  }, [spotlightPackages.length])

  return (
    <div className="min-h-screen bg-[#dbe2ef]" id="home">
      <header className="sticky top-0 z-50 bg-brand-700 text-white shadow-soft">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
          <a href="#home" className="flex items-center gap-2">
            <img src="https://osrholidays.in/images/logo-osr1.jpeg" alt="OSR Holidays" className="h-12 w-12 rounded-full border border-white/30 object-cover" />
            <div>
              <p className="text-2xl font-semibold leading-none">OSR</p>
              <p className="text-lg leading-none text-blue-100">Holidays</p>
            </div>
          </a>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-sm font-semibold text-blue-100 transition hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 md:flex">
            <Search size={16} className="text-slate-500" />
            <input
              placeholder='Search "Goa"'
              value={searchDestination}
              onChange={(e) => setSearchDestination(e.target.value)}
              className="w-44 border-0 bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>

          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex rounded-lg border border-blue-300 p-2 md:hidden"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-blue-500 bg-brand-700 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} className="font-semibold text-blue-100" onClick={() => setIsMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="mx-auto mt-4 max-w-7xl px-4 lg:px-6" id="destinations">
          <div className="relative overflow-hidden rounded-2xl">
            <SafeImage
              src="https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=2200&q=80"
              alt="Discover India"
              className="h-[46vh] w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-900/65 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-between px-6 md:px-10">
              <div className="max-w-xl text-white">
                <h1 className="text-4xl font-semibold md:text-6xl">Discover India</h1>
                <p className="mt-3 text-lg text-blue-100">Book Flights, Hotels, VISA, MICE and Domestic-first holiday packages.</p>
              </div>
            </div>
          </div>

          <motion.div
            {...sectionMotion}
            className="mt-5 grid gap-3 rounded-2xl bg-white/95 p-4 shadow-soft md:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <label className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-bold uppercase text-slate-500">Destination</p>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MapPin size={15} />
                <input
                  value={searchDestination}
                  onChange={(e) => setSearchDestination(e.target.value)}
                  placeholder="Goa, Manali, Kerala"
                  className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-slate-700 outline-none"
                />
              </div>
            </label>

            <label className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-bold uppercase text-slate-500">Dates / Month</p>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalendarDays size={15} />
                <input
                  value={searchMonth}
                  onChange={(e) => setSearchMonth(e.target.value)}
                  placeholder="July 2026"
                  className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-slate-700 outline-none"
                />
              </div>
            </label>

            <label className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-bold uppercase text-slate-500">Budget</p>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Wallet size={15} />
                <select
                  value={searchBudget}
                  onChange={(e) => setSearchBudget(e.target.value)}
                  className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-slate-700 outline-none"
                >
                  <option value="all">All Budgets</option>
                  <option value="under25">Under ₹25,000</option>
                  <option value="25to50">₹25,000 - ₹50,000</option>
                  <option value="50to100">₹50,000 - ₹1,00,000</option>
                  <option value="100plus">Above ₹1,00,000</option>
                </select>
              </div>
            </label>

            <a href="#tours" className="rounded-xl bg-brand-700 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-brand-800">
              Search
            </a>
          </motion.div>

          <motion.div {...sectionMotion} className="mt-8 grid gap-4 md:grid-cols-3">
            {destinationCards.map((card) => (
              <article key={card.title} className="overflow-hidden rounded-xl bg-white shadow-soft">
                <div className="relative h-48 overflow-hidden">
                  <SafeImage src={card.image} alt={card.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                  <h3 className="absolute bottom-4 left-4 max-w-[85%] text-4xl font-semibold leading-tight text-white md:text-3xl">{card.title}</h3>
                </div>
                <a href="#tours" className="flex items-center justify-between bg-brand-700 px-5 py-3 text-xl font-semibold text-white transition hover:bg-brand-800">
                  <span>{card.tours}</span>
                  <ArrowRight size={22} />
                </a>
              </article>
            ))}
          </motion.div>
        </section>

        <motion.section {...sectionMotion} className="mx-auto mt-14 max-w-7xl px-4 lg:px-6">
          <h2 className="text-3xl font-semibold md:text-5xl">Book Tour Packages - Flights, Hotels, Visa, Cruise, and Holiday Packages</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-700 md:text-2xl">
            We are a full-service travel company focused on personalized planning, transparent pricing, and reliable support from enquiry to return.
            Our team handles flights, stays, visa documentation, MICE events, and curated honeymoon experiences across India and international destinations.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-slate-700 md:text-2xl">
            Whether you want a budget-friendly domestic break or a premium global vacation, OSR Holidays creates itineraries that stay practical,
            comfortable, and memorable.
          </p>
        </motion.section>

        <motion.section {...sectionMotion} className="mx-auto mt-14 max-w-7xl px-4 lg:px-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-4xl font-semibold md:text-6xl">Top Tours</h2>
              <p className="mt-2 text-lg text-slate-600 md:text-2xl">Amazing destinations, best getaways.</p>
            </div>
            <a href="#tours" className="rounded-lg border border-brand-700 px-5 py-2.5 text-lg font-semibold text-brand-700 transition hover:bg-brand-700 hover:text-white">
              View All Tours
            </a>
          </div>
          <div className="snap-x-scroll flex snap-x gap-5 overflow-x-auto pb-2">
            {topTours.map((tour) => (
              <TourCard key={tour.title} {...tour} />
            ))}
          </div>
        </motion.section>

        <motion.section {...sectionMotion} className="mx-auto mt-16 max-w-7xl px-4 lg:px-6">
          <h2 className="mb-6 text-4xl font-medium md:text-5xl">Summer Special</h2>
          <div className="grid gap-4 lg:grid-cols-4">
            <article className="group relative overflow-hidden rounded-xl lg:col-span-1 lg:row-span-2">
              <SafeImage src={summerSpecials[0].image} alt={summerSpecials[0].title} className="h-full min-h-[480px] w-full object-cover transition duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <span className="absolute left-4 top-4 rounded-md bg-orange-500 px-3 py-1 text-sm font-medium text-white">Most loved</span>
              <h3 className="absolute bottom-16 left-4 text-3xl font-medium text-white md:text-4xl">{summerSpecials[0].title}</h3>
              <p className="absolute bottom-4 left-4 rounded-md bg-white/95 px-3 py-2 text-lg font-medium text-slate-800 md:text-2xl">Starting from ₹74,000</p>
            </article>

            {summerSpecials.slice(1, 7).map((item, idx) => (
              <article key={item.title} className="group relative overflow-hidden rounded-xl">
                <SafeImage src={item.image} alt={item.title} className="h-56 w-full object-cover transition duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <h3 className="absolute bottom-14 left-4 text-3xl font-medium text-white md:text-4xl">{item.title}</h3>
                <p className="absolute bottom-4 left-4 rounded-md bg-white/95 px-3 py-2 text-lg font-medium text-slate-800 md:text-2xl">Starting from ₹{(32000 + idx * 4200).toLocaleString('en-IN')}</p>
              </article>
            ))}
          </div>
        </motion.section>

        <motion.section {...sectionMotion} className="mx-auto mt-16 max-w-7xl px-4 lg:px-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-4xl font-semibold md:text-6xl">Featured Spotlight</h2>
            <div className="flex gap-2">
              {spotlightPackages.map((pkg, idx) => (
                <button
                  key={pkg.title}
                  onClick={() => setSpotlightIndex(idx)}
                  aria-label={`Show ${pkg.title}`}
                  className={`h-2.5 w-8 rounded-full ${idx === spotlightIndex ? 'bg-brand-700' : 'bg-slate-300'}`}
                />
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl shadow-soft">
            <SafeImage src={currentSpotlight.image} alt={currentSpotlight.title} className="h-[380px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-900/70 via-brand-900/25 to-brand-900/15" />
            <div className="absolute inset-0 flex flex-col justify-between p-6 text-white md:p-8">
              <div>
                <p className="text-lg font-semibold text-blue-100">Best of Domestic Tours</p>
                <h3 className="mt-1 text-3xl font-semibold md:text-6xl">{currentSpotlight.title}</h3>
                <p className="mt-2 text-base text-blue-100 md:text-2xl">{currentSpotlight.duration}</p>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-bold md:text-6xl">{currentSpotlight.price}</p>
                  <p className="text-base text-blue-100 md:text-2xl">Per person • All Inclusive</p>
                </div>
                <button onClick={() => setIsEnquiryOpen(true)} className="rounded-lg bg-white px-6 py-3 text-xl font-semibold text-brand-800 transition hover:bg-blue-100">
                  View Tour
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section {...sectionMotion} className="mx-auto mt-16 max-w-7xl px-4 lg:px-6">
          <div className="rounded-2xl bg-[#cbd9ef] p-6 lg:p-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <article className="group relative overflow-hidden rounded-xl">
                <SafeImage
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80"
                  alt="All inclusive tours"
                  className="h-[440px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-black/35 p-3 backdrop-blur-[1px] sm:bottom-5 sm:left-5 sm:right-5 sm:p-4">
                  <h3 className="text-2xl font-semibold leading-tight text-white sm:text-3xl md:text-5xl">Go with communities</h3>
                  <p className="mt-2 max-w-xl text-base leading-snug text-white/90 sm:text-lg md:text-2xl">
                    Enjoy travelling with like-minded people and make lifetime memories.
                  </p>
                </div>
              </article>

              <article>
                <h2 className="text-4xl font-semibold md:text-7xl">All Inclusive Tours</h2>
                <p className="mt-3 text-lg text-slate-700 md:text-3xl">With our special tours, leave the hassle of planning and organising to us.</p>
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  {inclusiveFeatures.map((feature) => (
                    <div key={feature.label} className="flex items-center gap-3 text-slate-700">
                      <feature.icon size={32} className="text-slate-700" />
                      <p className="text-lg font-medium md:text-2xl">{feature.label}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </motion.section>

        <motion.section {...sectionMotion} className="mx-auto mt-16 max-w-7xl px-4 lg:px-6" id="tours">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-3xl font-semibold md:text-5xl">Travel Packages</h2>
            <div className="inline-flex rounded-full bg-slate-200 p-1 text-sm font-semibold">
              <button
                onClick={() => setTourTab('domestic')}
                className={`rounded-full px-4 py-2 ${tourTab === 'domestic' ? 'bg-white text-brand-700 shadow' : 'text-slate-600'}`}
              >
                Domestic
              </button>
              <button
                onClick={() => setTourTab('international')}
                className={`rounded-full px-4 py-2 ${tourTab === 'international' ? 'bg-white text-brand-700 shadow' : 'text-slate-600'}`}
              >
                International
              </button>
            </div>
          </div>

          <div className="mb-5 text-base text-slate-600 md:text-xl">
            {tourTab === 'domestic' ? `Showing ${visiblePackages.length} domestic packages` : `Showing ${visiblePackages.length} international packages`}
            {searchMonth ? ` • Travel month: ${searchMonth}` : ''}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visiblePackages.map((pkg) => (
              <PackageCard key={pkg.title} {...pkg} />
            ))}
          </div>
        </motion.section>

        <motion.section {...sectionMotion} className="mx-auto mt-14 max-w-7xl px-4 lg:px-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-semibold md:text-5xl">Top International Destinations</h2>
            <a href="#tours" className="rounded-lg border border-brand-700 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-700 hover:text-white md:text-base">
              View All International
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {countryTours.map((pkg) => (
              <PackageCard key={pkg.title} {...pkg} />
            ))}
          </div>
        </motion.section>

        <motion.section {...sectionMotion} className="mx-auto mt-16 max-w-7xl px-4 lg:px-6">
          <h2 className="mb-6 text-3xl font-semibold md:text-5xl">Explore By Indian City</h2>
          <div className="snap-x-scroll flex snap-x gap-4 overflow-x-auto pb-2">
            {cities.map((city) => (
              <CityCard key={city.city} {...city} />
            ))}
          </div>
        </motion.section>

        <motion.section {...sectionMotion} className="mx-auto mt-16 max-w-7xl px-4 lg:px-6">
          <h2 className="mb-6 text-3xl font-semibold md:text-5xl">Services</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ServiceIcon icon={FileCheck2} title="Visa Services" description="Documentation and visa assistance end to end." />
            <ServiceIcon icon={CarFront} title="Car Rental" description="Comfortable local and intercity transport options." />
            <ServiceIcon icon={Building2} title="Hotels" description="Premium and boutique stays at best rates." />
            <ServiceIcon icon={PlaneTakeoff} title="Flights" description="Domestic and international flights managed for you." />
          </div>
        </motion.section>

        <motion.section
          {...sectionMotion}
          className="mx-auto mt-16 max-w-7xl overflow-hidden rounded-2xl bg-brand-900 lg:px-0"
        >
          <div className="px-6 py-10 text-white md:px-10">
            <h2 className="text-4xl font-semibold md:text-7xl">We connect people through joy of travel</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCounter value={29} suffix="+" label="Years of Industry Expertise" />
              <StatCounter value={5280} suffix="+" label="Tours completed" />
              <StatCounter value={880} suffix="k+" label="Happy Customers" />
              <StatCounter value={2500} suffix="+" label="Destinations to choose from" />
            </div>
          </div>
          <div className="flex items-center justify-between bg-brand-700 px-6 py-8 md:px-10">
            <div>
              <p className="text-3xl font-medium text-white md:text-5xl">Gujarat's only National Award Winning Travel Company</p>
              <a href="#contact" className="mt-4 inline-block rounded-md border border-white/70 px-4 py-2 text-lg text-white transition hover:bg-white/10">
                About Us
              </a>
            </div>
            <p className="hidden text-8xl font-bold text-white/30 md:block">No.1</p>
          </div>
        </motion.section>

        <motion.section {...sectionMotion} className="mx-auto mt-16 max-w-7xl px-4 pb-20 lg:px-6" id="blog">
          <h2 className="mb-6 text-3xl font-semibold md:text-5xl">Travel Journal</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {blogPosts.map((post) => (
              <BlogCard key={post.title} {...post} />
            ))}
          </div>
        </motion.section>
      </main>

      <footer className="bg-brand-900 text-blue-100" id="contact">
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
          <div className="grid gap-8 rounded-2xl bg-[#0d1f57] p-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h4 className="text-3xl font-semibold text-white">Our Offices</h4>
              <p className="mt-2 text-lg">Find an OSR office near you and walk in to plan your vacation.</p>
              <a href="#contact" className="mt-2 inline-block text-xl font-semibold text-white">Locate Us →</a>
            </div>
            <div>
              <h4 className="text-3xl font-semibold text-white">Write to Us</h4>
              <p className="mt-2 text-lg">Send enquiries, feedback and suggestions.</p>
              <a href="mailto:hello@osrholidays.com" className="mt-2 inline-block text-xl font-semibold text-white">Email Us →</a>
            </div>
            <div>
              <h4 className="text-3xl font-semibold text-white">Call us</h4>
              <p className="mt-2 text-lg">Need a quote or planning help? We're a call away.</p>
              <a href="tel:+919725425001" className="mt-2 inline-block text-2xl font-semibold text-white">+91 97254 25001 →</a>
            </div>
            <div>
              <h4 className="text-3xl font-semibold text-white">Connect With Us</h4>
              <p className="mt-2 text-lg">Reviews, podcasts, blogs and more.</p>
              <div className="mt-4 flex gap-3">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="rounded-full bg-white/10 p-2 hover:bg-white/20"><Facebook size={18} /></a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="rounded-full bg-white/10 p-2 hover:bg-white/20"><Instagram size={18} /></a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="rounded-full bg-white/10 p-2 hover:bg-white/20"><Linkedin size={18} /></a>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <h5 className="text-xl font-semibold text-white">Discover</h5>
              <ul className="mt-3 space-y-2 text-lg">
                <li><a href="#home">About Us</a></li>
                <li><a href="#contact">Terms and Condition</a></li>
                <li><a href="#contact">Privacy Policy</a></li>
                <li><a href="#blog">Travel Journal</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xl font-semibold text-white">Services</h5>
              <ul className="mt-3 space-y-2 text-lg">
                <li><a href="#contact">Car Rental</a></li>
                <li><a href="#contact">Flight Booking</a></li>
                <li><a href="#contact">Hotel Booking</a></li>
                <li><a href="#contact">Visa Services</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xl font-semibold text-white">Destinations</h5>
              <ul className="mt-3 space-y-2 text-lg">
                <li><a href="#tours">India Tours</a></li>
                <li><a href="#tours">International Tours</a></li>
                <li><a href="#tours">Honeymoon Packages</a></li>
                <li><a href="#tours">MICE Packages</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xl font-semibold text-white">Connect</h5>
              <ul className="mt-3 space-y-2 text-lg">
                <li><a href="#contact">Contact Us</a></li>
                <li><a href="#blog">Blogs</a></li>
                <li><a href="#contact">FAQs</a></li>
              </ul>
            </div>
            <div className="flex items-center justify-start md:justify-end">
              <a href="#home" className="flex items-center gap-3">
                <img src="https://osrholidays.in/images/logo-osr1.jpeg" alt="OSR Holidays logo" className="h-14 w-14 rounded-full object-cover" />
                <p className="text-3xl font-semibold text-white">OSR Holidays</p>
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-white/20 pt-4 text-sm text-blue-200">
            © {new Date().getFullYear()} OSR Holidays. All rights reserved.
          </div>
        </div>
      </footer>

      <button
        onClick={() => setIsEnquiryOpen(true)}
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-lg bg-brand-700 px-3 py-6 text-lg font-semibold text-white shadow-lg"
      >
        <span className="[writing-mode:vertical-rl]">Inquiry Now</span>
      </button>

      <a
        href="tel:+919725425001"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-orange-600"
      >
        <Phone size={18} /> Quick Call
      </a>

      {isEnquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-3xl font-semibold text-slate-900">Enquire Now</h3>
              <button onClick={() => setIsEnquiryOpen(false)} className="rounded-full border border-slate-300 p-1 text-slate-600">
                <X size={16} />
              </button>
            </div>
            <form className="grid gap-3" onSubmit={(e) => e.preventDefault()}>
              <input required placeholder="Full name" className="rounded-lg border border-slate-300 px-3 py-2 text-lg outline-none focus:border-brand-700" />
              <input required placeholder="Phone number" className="rounded-lg border border-slate-300 px-3 py-2 text-lg outline-none focus:border-brand-700" />
              <input placeholder="Preferred destination" className="rounded-lg border border-slate-300 px-3 py-2 text-lg outline-none focus:border-brand-700" />
              <textarea rows={3} placeholder="Your travel requirement" className="rounded-lg border border-slate-300 px-3 py-2 text-lg outline-none focus:border-brand-700" />
              <button type="submit" className="rounded-lg bg-brand-700 px-4 py-3 text-xl font-semibold text-white transition hover:bg-brand-800">
                Submit Enquiry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
