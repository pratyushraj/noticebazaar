import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Edit,
  Plus,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Rocket,
  Target,
  IndianRupee,
  Package,
  MapPin,
  FileText,
  Wallet,
  Calendar,
  TrendingUp,
  Lock,
  Clapperboard,
  Send,
  FileCheck,
  BadgeCheck,
  Clock,
  PenLine,
  Zap,
  ArrowRight,
  ChevronRight,
  Sparkles,
  X,
  Check,
  Link2,
  Briefcase,
  Upload,
  Camera,
  Star,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics'
import { trackEvent } from '@/lib/utils/analytics'
import { SEOHead } from '@/components/seo/SEOHead'
import { BreadcrumbSchema } from '@/components/seo/SchemaMarkup'
import { getApiBaseUrl } from '@/lib/utils/api'
import { getCollabReadiness } from '@/lib/collab/readiness'
import { useSession } from '@/contexts/SessionContext'

import { useUpdateProfile } from '@/lib/hooks/useProfiles'
import { useSignOut } from '@/lib/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { normalizeLogoUrl } from '@/lib/deals/format'
import { optimizeImage, safeAvatarSrc } from '@/lib/utils/image'
import type { PortfolioItem } from '@/types'

// Generic JSON-LD injector for page-specific schema markup
const JsonLdSchema = ({ schema, schemaKey }: { schema: any; schemaKey: string }) => {
  useEffect(() => {
    const existingScript = document.querySelector(`script[data-schema="${schemaKey}"]`)
    if (existingScript) {
      existingScript.remove()
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-schema', schemaKey)
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)

    return () => {
      const scriptToRemove = document.querySelector(`script[data-schema="${schemaKey}"]`)
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [schema, schemaKey])

  return null
}

interface Creator {
  id: string
  name: string
  username: string
  is_registered?: boolean
  profile_type?: 'verified' | 'public'
  profile_label?: string
  submission_flow?: 'direct_request' | 'lead_capture'
  category: string | null
  profile_photo?: string | null
  followers?: number | null
  last_instagram_sync?: string | null
  platforms: Array<{ name: string; handle: string; followers?: number }>
  bio: string | null
  open_to_collabs?: boolean
  content_niches?: string[]
  media_kit_url?: string | null
  past_brands?: string[]
  portfolio_links?: string[]
  recent_campaign_types?: string[]
  avg_reel_views?: number | null
  avg_likes?: number | null
  past_brand_count?: number | null
  audience_gender_split?: string | null
  top_cities?: string[]
  audience_age_range?: string | null
  primary_audience_language?: string | null
  posting_frequency?: string | null
  active_brand_collabs_month?: number | null
  campaign_slot_note?: string | null
  collab_brands_count_override?: number | null
  collab_response_hours_override?: number | null
  collab_cancellations_percent_override?: number | null
  collab_region_label?: string | null
  collab_intro_line?: string | null
  collab_audience_fit_note?: string | null
  collab_recent_activity_note?: string | null
  collab_audience_relevance_note?: string | null
  collab_delivery_reliability_note?: string | null
  collab_engagement_confidence_note?: string | null
  collab_response_behavior_note?: string | null
  collab_cta_trust_note?: string | null
  collab_cta_dm_note?: string | null
  collab_cta_platform_note?: string | null
  collab_show_packages?: boolean | null
  collab_show_trust_signals?: boolean | null
  collab_show_audience_snapshot?: boolean | null
  collab_show_past_work?: boolean | null
  collab_past_work_items?: PortfolioItem[] | null
  portfolio_items?: PortfolioItem[] | null
  discovery_video_url?: string | null
  portfolio_videos?: string[] | null
  performance_proof?: {
    median_reel_views?: number | null
    avg_likes?: number | null
    captured_at?: string | null
  } | null
  suggested_reel_rate?: number | null
  suggested_paid_range_min?: number | null
  suggested_paid_range_max?: number | null
  suggested_barter_value_min?: number | null
  suggested_barter_value_max?: number | null
  trust_stats?: {
    brands_count: number
    completed_deals: number
    total_deals: number
    completion_rate: number | null
    avg_response_hours: number | null
  }
  // NEW: Qualification & Deal Rules
  min_deal_value?: number | null
  min_lead_time_days?: number | null
  typical_story_rate?: number | null
  typical_post_rate?: number | null
  premium_production_multiplier?: number | null
  brand_type_preferences?: string[] | null
  campaign_type_support?: string[] | null
  revision_policy?: string | null
  allow_negotiation?: boolean | null
  allow_counter_offer?: boolean | null
  onboarding_complete?: boolean | null
  // Deal preference: 'paid_only' | 'barter_only' | 'open_to_both'
  collab_deal_preference?: 'paid_only' | 'barter_only' | 'open_to_both' | null
  deal_templates?: DealTemplate[] | null
}

interface DealTemplate {
  id: string
  label: string
  icon: string
  budget: number // For paid: ₹ amount, for barter: ₹ product value
  type: 'paid' | 'barter'
  category: string
  description: string
  deliverables: string[]
  quantities: Record<string, number>
  deadlineDays: number
  notes?: string
  isPopular?: boolean
  addons?: { id: string; label: string; price: number }[]
}

type CollabType = 'paid' | 'barter' | 'hybrid' | 'both' | 'affiliate'

const isHybridCollab = (value: CollabType) => value === 'hybrid' || value === 'both'

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => {
      const codePoint = Number.parseInt(hex, 16)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : _
    })
    .replace(/&#(\d+);?/g, (_, dec) => {
      const codePoint = Number.parseInt(dec, 10)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : _
    })

const sanitizeDisplayName = (value: string) =>
  decodeHtmlEntities(String(value || ''))
    .replace(/\s+/g, ' ')
    .trim()

const toTitleCaseName = (value: string) =>
  sanitizeDisplayName(value)
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')

interface FormErrors {
  brandName?: string
  brandEmail?: string
  campaignDescription?: string
  deliverables?: string
  budget?: string
  barterProductImageUrl?: string
  brandLogoUrl?: string
}

// Reserved usernames that should not be used for collab links
const RESERVED_USERNAMES = [
  'admin',
  'api',
  'blog',
  'login',
  'signup',
  'reset-password',
  'about',
  'careers',
  'pricing-comparison',
  'privacy-policy',
  'terms-of-service',
  'refund-policy',
  'delete-data',
  'sitemap',
  'free-legal-check',
  'thank-you',
  'free-influencer-contract',
  'collaboration-agreement-generator',
  'plan',
  'creators',
  'creator',
  'collab',
  'dashboard-white-preview',
  'dashboard-preview',
  'p',
  'old-home',
  'home',
  'consumer-complaints',
  'creator-dashboard',
  'creator-profile',
  'creator-analytics',
  'creator-contracts',
  'creator-payments',
  'creator-tax',
  'creator-onboarding',
  'brand-directory',
  'brand-opportunities',
  'partner-program',
  'ai-pitch-generator',
  'documents-vault',
  'insights',
  'messages',
  'notifications',
  'client-dashboard',
  'client-profile',
  'client-subscription',
  'client-cases',
  'client-documents',
  'client-consultations',
  'admin-dashboard',
  'admin-documents',
  'admin-cases',
  'admin-clients',
  'admin-consultations',
  'admin-subscriptions',
  'admin-activity-log',
  'admin-profile',
  'admin-influencers',
  'admin-discovery',
  'ca-dashboard',
]

const isGeneratedCreatorHandle = (value?: string | null) =>
  Boolean(value && /^creator-[a-z0-9]{6,}$/i.test(value.trim()))

const getPreferredPublicHandle = (...candidates: Array<string | null | undefined>) => {
  for (const candidate of candidates) {
    const normalized = (candidate || '').replace(/^@/, '').trim()
    if (!normalized) continue
    if (isGeneratedCreatorHandle(normalized)) continue
    return normalized
  }
  return ''
}

const CAMPAIGN_GOALS = [
  'App / Website Promotion',
  'Product Review / Unboxing',
  'Brand Awareness',
  'Performance Campaign',
  'Content Creation (UGC)',
  'Event / Launch Promotion',
  'Custom Collaboration',
]

const BARTER_OPTIONS = [
  { id: 'product', label: '📦 Physical Product' },
  { id: 'access', label: '🔓 Free Access / Subscription' },
  { id: 'commission', label: '💸 Commission / Affiliate Earnings' },
  { id: 'experience', label: '🎟️ Experience / Event Access' },
  { id: 'custom', label: '✍️ Custom Offer' },
]

const DELIVERABLE_OPTIONS = [
  { label: 'Reel', value: 'Instagram Reel', icon: <span className="mr-1.5">🎬</span> },
  { label: 'Story', value: 'Story', icon: <span className="mr-1.5">📱</span> },
  { label: 'Post', value: 'Post', icon: <span className="mr-1.5">📷</span> },
  { label: 'Unboxing', value: 'Unboxing Video', icon: <span className="mr-1.5">📦</span> },
  { label: 'Review', value: 'Review Post', icon: <span className="mr-1.5">⭐</span> },
  { label: 'Giveaway', value: 'Giveaway', icon: <span className="mr-1.5">🎁</span> },
  { label: 'YouTube', value: 'YouTube Video', icon: <span className="mr-1.5">▶</span> },
  {
    label: 'Custom',
    value: 'Custom',
    icon: <Target className="h-3.5 w-3.5 text-slate-400 inline-block" />,
  },
]

const getYoutubeEmbedUrl = (href: string) => {
  try {
    const url = new URL(href)
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace('/', '').trim()
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0` : ''
    }
    if (url.hostname.includes('youtube.com')) {
      const shortsMatch = url.pathname.match(/\/shorts\/([^/?]+)/i)
      if (shortsMatch?.[1])
        return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&mute=1&playsinline=1&rel=0`
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0` : ''
    }
  } catch {
    return ''
  }
  return ''
}

const getInstagramEmbedUrl = (href: string) => {
  try {
    const url = new URL(href)
    if (!url.hostname.includes('instagram.com')) return ''
    const cleanedPath = url.pathname.replace(/\/+$/, '')
    if (/\/(reel|reels|p)\//i.test(cleanedPath)) {
      return `https://www.instagram.com${cleanedPath}/embed`
    }
  } catch {
    return ''
  }
  return ''
}

const isPortfolioVideoUrl = (value: string) =>
  /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(String(value || '').trim())

const inferPortfolioPlatform = (value: string) => {
  const href = String(value || '')
    .trim()
    .toLowerCase()
  if (!href) return 'external'
  if (isPortfolioVideoUrl(href)) return 'upload'
  if (href.includes('instagram.com')) return 'instagram'
  if (href.includes('youtube.com') || href.includes('youtu.be')) return 'youtube'
  return 'external'
}

const normalizePortfolioItems = (rawItems: any, legacyLinks?: string[] | null): PortfolioItem[] => {
  const normalizedFromItems = Array.isArray(rawItems)
    ? (rawItems
        .map((item: any, index: number) => {
          const sourceUrl = String(item?.sourceUrl || item?.url || item?.link || '').trim()
          if (!sourceUrl) return null
          const mediaType =
            item?.mediaType === 'video' || isPortfolioVideoUrl(sourceUrl) ? 'video' : 'link'
          
          // Optimize URLs if they are images
          const optimizedSource = mediaType === 'link' ? (optimizeImage(sourceUrl, { width: 800, quality: 80 }) || sourceUrl) : sourceUrl
          const optimizedPoster = optimizeImage(String(item?.posterUrl || item?.thumbnailUrl || '').trim(), { width: 600, quality: 75 }) || null

          return {
            id: String(item?.id || `portfolio-item-${index + 1}`),
            sourceUrl: optimizedSource,
            posterUrl: optimizedPoster,
            title: String(item?.title || '').trim() || null,
            mediaType,
            platform: String(item?.platform || inferPortfolioPlatform(sourceUrl)).trim() || null,
            brand: item?.brand,
            campaignType: item?.campaignType,
            outcome: item?.outcome,
            proofLabel: item?.proofLabel,
          } satisfies PortfolioItem
        })
        .filter(Boolean) as PortfolioItem[])
    : []

  if (normalizedFromItems.length > 0) return normalizedFromItems.slice(0, 4)

  return (Array.isArray(legacyLinks) ? legacyLinks : [])
    .map((value, index) => {
      const sourceUrl = String(value || '').trim()
      if (!sourceUrl) return null
      const mediaType = isPortfolioVideoUrl(sourceUrl) ? 'video' : 'link'
      const optimizedSource = mediaType === 'link' ? (optimizeImage(sourceUrl, { width: 800, quality: 80 }) || sourceUrl) : sourceUrl
      
      return {
        id: `portfolio-link-${index + 1}`,
        sourceUrl: optimizedSource,
        posterUrl: null,
        title: null,
        mediaType,
        platform: inferPortfolioPlatform(sourceUrl),
      } satisfies PortfolioItem
    })
    .filter(Boolean)
    .slice(0, 4) as PortfolioItem[]
}

const PRODUCT_CATEGORY_OPTIONS = [
  { value: 'fashion', label: '👗 Fashion & Clothing' },
  { value: 'beauty', label: '💄 Beauty & Skincare' },
  { value: 'food', label: '🍕 Food & Beverage' },
  { value: 'tech', label: '📱 Tech & Gadgets' },
  { value: 'app', label: '💻 App / Software' },
  { value: 'fitness', label: '💪 Fitness & Health' },
  { value: 'home', label: '🏠 Home & Living' },
  { value: 'travel', label: '✈️ Travel & Hospitality' },
  { value: 'finance', label: '💰 Finance & BFSI' },
  { value: 'gaming', label: '🎮 Gaming' },
  { value: 'kids', label: '🧸 Kids & Parenting' },
  { value: 'other', label: '📦 Other' },
]

// const CAMPAIGN_CATEGORY_OPTIONS = [
//   'Fashion',
//   'Beauty',
//   'Tech',
//   'Food',
//   'Travel',
//   'Fitness',
//   'Finance',
//   'Lifestyle',
//   'Education',
//   'Entertainment',
//   'Gaming',
//   'Parenting',
//   'General',
// ];

const getEngagementRange = (followers?: number | null, avgReelViews?: number | null) => {
  if (!followers || followers <= 0 || !avgReelViews || avgReelViews < 0) {
    return 'Growing Audience'
  }
  const engagementRate = avgReelViews / followers
  if (engagementRate < 0.1) return 'Growing Audience'
  if (engagementRate <= 0.25) return 'Engaged Audience'
  return 'High Viewer Interaction'
}

const formatAudienceGender = (value?: string | null) => {
  if (!value) return null
  const normalized = value.trim()
  if (!normalized) return null

  const womenMatch = normalized.match(/(\d+)\s*%?\s*women?/i)
  const menMatch = normalized.match(/(\d+)\s*%?\s*men?/i)
  const women = womenMatch ? Number(womenMatch[1]) : null
  const men = menMatch ? Number(menMatch[1]) : null

  if (women !== null && men !== null) {
    return [`${women}% Women`, `${men}% Men`]
  }
  if (women !== null) {
    const inferredMen = Math.max(0, 100 - women)
    return [`${women}% Women`, `${inferredMen}% Men`]
  }
  if (men !== null) {
    const inferredWomen = Math.max(0, 100 - men)
    return [`${inferredWomen}% Women`, `${men}% Men`]
  }
  return [normalized]
}

const toTitleCase = (value: string) => {
  return value
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const formatAudienceLanguage = (value?: string | null) => {
  if (!value) return null
  const normalized = value.trim()
  if (!normalized) return null
  return normalized
    .split(/[,/]+/)
    .map(part => toTitleCase(part.trim()))
    .filter(Boolean)
    .join(' / ')
}

const formatAudienceCities = (cities?: string[] | null) => {
  if (!Array.isArray(cities)) return []
  return cities.map(city => toTitleCase((city || '').trim())).filter(Boolean)
}

const buildLocalPreviewCreator = (handle: string): Creator => ({
  id: 'local-preview-creator',
  name: 'Pratyush',
  username: handle,
  is_registered: true,
  profile_type: 'verified',
  profile_label: 'Verified Creator Profile',
  submission_flow: 'direct_request',
  category: 'Lifestyle',
  profile_photo: null,
  followers: 10200,
  platforms: [{ name: 'Instagram', handle, followers: 10200 }],
  bio: 'Creator profile preview mode (local only)',
  open_to_collabs: true,
  content_niches: ['Food', 'Lifestyle', 'Gaming'],
  media_kit_url: 'https://example.com/media-kit',
  past_brands: ['Sample Brand'],
  recent_campaign_types: ['Product Launch'],
  avg_reel_views: 12200,
  avg_likes: 800,
  past_brand_count: 11,
  audience_gender_split: '70 women',
  top_cities: ['noida', 'delhi', 'ghaziabad'],
  audience_age_range: '18-24',
  primary_audience_language: 'hindi',
  posting_frequency: '3-4 times/week',
  active_brand_collabs_month: 2,
  campaign_slot_note: 'Limited slots this month',
  collab_brands_count_override: 11,
  collab_response_hours_override: 3,
  collab_cancellations_percent_override: 0,
  collab_region_label: 'NCR (Delhi Region)',
  collab_intro_line:
    'Lifestyle creator with clear package options for launches, reviews, and campaign bursts.',
  collab_audience_fit_note: 'Works best for targeted audience campaigns.',
  collab_recent_activity_note: 'Posting consistently',
  collab_audience_relevance_note: 'Strong relevance for North India audience',
  collab_delivery_reliability_note: 'Proven delivery across past campaigns',
  collab_engagement_confidence_note: 'Above-average engagement for creator size',
  collab_response_behavior_note: 'Most brands receive response same day',
  collab_cta_trust_note: 'Creator notified instantly — no DM required.',
  collab_cta_dm_note: 'No DMs required — creator replies here.',
  collab_cta_platform_note: 'Direct collaboration — no agency middle layer',
  trust_stats: {
    brands_count: 11,
    completed_deals: 11,
    total_deals: 11,
    completion_rate: 98,
    avg_response_hours: 3,
  },
})

const getAudienceRegionLabel = (cities: string[]) => {
  if (!cities.length) return null
  const normalized = cities.map(city => city.toLowerCase())
  const hasNcr = normalized.some(city =>
    ['delhi', 'new delhi', 'noida', 'gurgaon', 'gurugram', 'ghaziabad', 'faridabad'].some(key =>
      city.includes(key)
    )
  )
  const hasTier1 = normalized.some(city =>
    [
      'mumbai',
      'bengaluru',
      'bangalore',
      'chennai',
      'hyderabad',
      'pune',
      'kolkata',
      'ahmedabad',
    ].some(key => city.includes(key))
  )

  if (hasNcr && hasTier1) return 'NCR (Delhi Region) / Tier 1'
  if (hasNcr) return 'NCR (Delhi Region)'
  if (hasTier1) return 'Tier 1'
  return null
}

const isScrapedInstagramBio = (bio?: string | null) => {
  if (!bio) return false
  const normalized = bio.toLowerCase()
  return (
    (normalized.includes('followers') &&
      normalized.includes('following') &&
      normalized.includes('posts')) ||
    normalized.includes('see instagram photos and videos')
  )
}

const withNeutralPrefix = (text: string, prefix: string) => {
  const normalized = text.trim()
  if (!normalized) return normalized
  if (/^(currently|works with|typically|open to|reviewing|prefer)/i.test(normalized)) {
    return normalized
  }
  return `${prefix}${normalized}`
}

const CollabLinkLanding = () => {
  const { user, profile } = useSession()
  const updateProfileMutation = useUpdateProfile()
  const signOutMutation = useSignOut()

  const [searchParams, setSearchParams] = useSearchParams()
  const [editMode, setEditMode] = useState(() => searchParams.get('edit') === 'true')
  const [aboutCreatorOpen, setAboutCreatorOpen] = useState(false)

  useEffect(() => {
    if (editMode && searchParams.get('edit') !== 'true') {
      setSearchParams(
        prev => {
          prev.set('edit', 'true')
          return prev
        },
        { replace: true }
      )
    } else if (!editMode && searchParams.get('edit') === 'true') {
      setSearchParams(
        prev => {
          prev.delete('edit')
          return prev
        },
        { replace: true }
      )
    }
  }, [editMode, setSearchParams, searchParams])

  useEffect(() => {
    // In edit mode we should never hide profile fields behind a collapsed panel.
    if (editMode) setAboutCreatorOpen(true)
  }, [editMode])

  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)
  const [isWarmingUp, setIsWarmingUp] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [submitChecklistStep, setSubmitChecklistStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  // ── Force light mode while this page is mounted ──────────────────────────
  // The creator dashboard may set `dark` on <html> via class-based dark mode.
  // CollabLinkLanding is a light-only page. Remove dark class on mount and
  // restore it (if the system prefers dark) when navigating away.
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const hadDark = html.classList.contains('dark')
    const previousHtmlOverflow = html.style.overflow
    const previousHtmlOverflowY = html.style.overflowY
    const previousHtmlHeight = html.style.height
    const previousHtmlMinHeight = html.style.minHeight
    const previousBodyOverflow = body.style.overflow
    const previousBodyOverflowY = body.style.overflowY
    const previousBodyHeight = body.style.height
    const previousBodyMinHeight = body.style.minHeight
    const previousBodyPosition = body.style.position
    const hadLight = html.classList.contains('light')
    html.classList.remove('dark')
    html.classList.add('light')

    // Safety check: ensure no prior screens left the document scroll-locked.
    html.style.overflow = ''
    html.style.overflowY = ''
    html.style.height = ''
    html.style.minHeight = '100dvh'
    body.style.overflow = ''
    body.style.overflowY = ''
    body.style.height = ''
    body.style.minHeight = '100dvh'
    body.style.position = 'static'

    return () => {
      // Restore classes if they were set before entering this page
      if (hadDark) html.classList.add('dark')
      if (!hadLight) html.classList.remove('light')
      html.style.overflow = previousHtmlOverflow
      html.style.overflowY = previousHtmlOverflowY
      html.style.height = previousHtmlHeight
      html.style.minHeight = previousHtmlMinHeight
      body.style.overflow = previousBodyOverflow
      body.style.overflowY = previousBodyOverflowY
      body.style.height = previousBodyHeight
      body.style.minHeight = previousBodyMinHeight
      body.style.position = previousBodyPosition
    }
  }, [])

  // Check if username is reserved (redirect to 404 if so)
  useEffect(() => {
    if (username && RESERVED_USERNAMES.includes(username.toLowerCase())) {
      navigate('/404', { replace: true })
    }
  }, [username, navigate])

  // Form state
  const [paymentType, setPaymentType] = useState<'paid' | 'barter'>('paid')
  const [campaignGoal, setCampaignGoal] = useState<string>('')
  const [barterTypes, setBarterTypes] = useState<string[]>([])
  const [includesProduct, setIncludesProduct] = useState<boolean>(false)

  const collabType: CollabType = paymentType === 'paid' ? (includesProduct ? 'hybrid' : 'paid') : 'barter'
  const setCollabType = (type: string) => {
    if (type === 'barter') {
      setPaymentType('barter')
      setIncludesProduct(true)
    } else if (type === 'hybrid' || type === 'both') {
      setPaymentType('paid')
      setIncludesProduct(true)
    } else {
      setPaymentType('paid')
      setIncludesProduct(false)
    }
  }
  const [brandName, setBrandName] = useState('')
  const [brandEmail, setBrandEmail] = useState('')
  const [brandInstagram, setBrandInstagram] = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [exactBudget, setExactBudget] = useState('')
  const [barterValue, setBarterValue] = useState('')
  const [barterProductName, setBarterProductName] = useState('')
  const [barterProductCategory, setBarterProductCategory] = useState('')
  const [campaignCategory, setCampaignCategory] = useState('General')
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>(
    'idle'
  )
  const [lookupData, setLookupData] = useState<{
    brand_name?: string
    logo?: string
    instagram?: string
  } | null>(null)
  const [useBrandProfile, setUseBrandProfile] = useState(false)

  const [campaignDescription, setCampaignDescription] = useState('')
  const [deliverables, setDeliverables] = useState<string[]>([])
  const [deliverableQuantities, setDeliverableQuantities] = useState<Record<string, number>>({})
  const [contentQuantity, setContentQuantity] = useState<number | '3+'>(1)
  const [contentDuration, setContentDuration] = useState<string>('30s')
  const [contentRequirements, setContentRequirements] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')
  const [hasStartedOffer, setHasStartedOffer] = useState(false)
  const [showMobileAudienceDetails, setShowMobileAudienceDetails] = useState(false)
  const [openAccordionValue, setOpenAccordionValue] = useState<string | undefined>('item-1')
  const [errors, setErrors] = useState<FormErrors>({})
  const [readinessBadgeSparkle, setReadinessBadgeSparkle] = useState(false)
  const [profilePhotoError, setProfilePhotoError] = useState(false)
  const [profileSaveStatus, setProfileSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  )
  const [lastProfileSaveAt, setLastProfileSaveAt] = useState<Date | null>(null)
  const [previewAsBrand, setPreviewAsBrand] = useState(false)
  const [barterProductImageUrl, setBarterProductImageUrl] = useState<string>('')
  const [barterImageUploading, setBarterImageUploading] = useState(false)
  const [brandLogoUrl, setBrandLogoUrl] = useState<string>('')
  const [brandLogoUploading, setBrandLogoUploading] = useState(false)
  const [isLogoUserUploaded, setIsLogoUserUploaded] = useState(false)
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set())
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false)
  const [draftEmail, setDraftEmail] = useState('')
  const [saveDraftSubmitting, setSaveDraftSubmitting] = useState(false)
  const [newNicheInput, setNewNicheInput] = useState('')
  const [showCustomFlow, setShowCustomFlow] = useState(() => searchParams.get('type') === 'barter' ? true : false)
  const [templateContinueNudge, setTemplateContinueNudge] = useState(0)
  const [localDealTemplates, setLocalDealTemplates] = useState<DealTemplate[]>([])
  const [isEditingTemplates, setIsEditingTemplates] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DealTemplate | null>(null)
  const [showSubmittingTrust, setShowSubmittingTrust] = useState(false)
  const submittingChecklist = [
    'Authenticating Brand Profile...',
    'Verifying Terms of Collaboration...',
    'Sending Direct Notification...',
    'Securing Deal Proposal...',
  ]
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const isBudgetProvided =
    collabType === 'affiliate'
      ? true
      : collabType === 'paid'
        ? Number(exactBudget) > 0
        : collabType === 'barter'
          ? Number(barterValue) > 0
          : collabType === 'hybrid'
            ? Number(exactBudget) > 0 && Number(barterValue) > 0
            : true
  const isBarterLikeCollab = (type: string | null | undefined) =>
    type === 'barter' || type === 'hybrid' || type === 'both'

  const isStep1Ready = Boolean(
    collabType &&
    campaignGoal &&
    (paymentType === 'barter' ? barterTypes.length > 0 : true) &&
    (selectedTemplateId ? deliverables.length > 0 : campaignDescription.trim().length >= 10)
  )
  const isValidBrandEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brandEmail)
  const isProductImageRequired = Boolean(selectedTemplateId) || isBarterLikeCollab(collabType)
  const isProductImageReady = isProductImageRequired
    ? Boolean(String(barterProductImageUrl || '').trim())
    : true
  const isLogoReady = Boolean(String(brandLogoUrl || '').trim())
  const isStep2Ready = Boolean(brandEmail.trim() && isValidBrandEmail && isProductImageReady)

  const completionChecks = useMemo(
    () => [
      { label: 'Collab type', complete: isStep1Ready },
      { label: 'Contact', complete: isStep2Ready },
    ],
    [isStep1Ready, isStep2Ready]
  )

  const barterProductImageInputRef = useRef<HTMLInputElement | null>(null)
  const openBarterImagePicker = () => {
    console.log('[CollabLinkLanding] Opening barter image picker...')
    const input = barterProductImageInputRef.current
    if (!input) {
      console.error('[CollabLinkLanding] Image input ref is missing!')
      toast.error('Image upload is currently unavailable. Please refresh.')
      return
    }
    if (barterImageUploading) {
      console.warn('[CollabLinkLanding] Upload already in progress.')
      return
    }

    input.click()
  }

  // --- NEW: BARTER AUTO-FILL & RESTRICTION ---
  const isBarterRestricted = searchParams.get('type') === 'barter'

  useEffect(() => {
    if (isBarterRestricted) {
      setPaymentType('barter')
      setIncludesProduct(true)
      setBarterTypes(['product'])
      setCampaignGoal('Product Review / Unboxing')
      setDeliverables(['Instagram Reel'])
      setDeliverableQuantities({ 'Instagram Reel': 1 })
      setContentQuantity(1)
      setContentDuration('15s')
      setHasStartedOffer(true)
      setShowCustomFlow(true)
      setCurrentStep(1)
    }
  }, [isBarterRestricted])

  // --- NEW: PASTE IMAGE SUPPORT ---
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only handle paste if the form is already deep enough
      if (!hasStartedOffer || currentStep !== 2) return

      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            handleBarterImageChange({ target: { files: [file] } } as any)
            toast.success('Image pasted from clipboard!')
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [hasStartedOffer, currentStep])

  // If the visitor is already logged in as a brand, prefill the form from their profile.
  // We only fill blanks so we never overwrite what the user already typed.
  useEffect(() => {
    if (!profile || profile.role !== 'brand') return

    const inferredBrandName =
      (profile.business_name || '').trim() ||
      [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
      'Brand'

    const inferredEmail = (profile.email || user?.email || '').trim()
    const inferredLogo =
      (profile as any).business_logo_url || (profile as any).logo_url || profile.avatar_url || ''

    setBrandName(prev => (prev.trim() ? prev : inferredBrandName))
    setBrandEmail(prev => (prev.trim() ? prev : inferredEmail))
    setBrandLogoUrl(prev => (prev.trim() ? prev : inferredLogo))
    setUseBrandProfile(true)
  }, [profile?.id, profile?.role, user?.email])

  // --- NEW: DRAFT PERSISTENCE ---
  const STORAGE_KEY = `collab_draft_${username}`

  // Restore on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.collabType) setCollabType(data.collabType)
        if (data.brandName && !brandName) setBrandName(data.brandName)
        if (data.brandEmail && !brandEmail) setBrandEmail(data.brandEmail)
        if (data.brandInstagram && !brandInstagram) setBrandInstagram(data.brandInstagram)
        if (data.campaignDescription) setCampaignDescription(data.campaignDescription)
        if (data.exactBudget) setExactBudget(data.exactBudget)
        if (data.deadline) setDeadline(data.deadline)

        // Only show toast if there's significant progress
        if (data.brandName || data.campaignDescription || data.exactBudget) {
          toast('Welcome back! Draft restored.', {
            icon: '📝',
            duration: 3000,
          })
        }

        // If we filled anything, mark as having started offer
        setHasStartedOffer(true)
      }
    } catch (e) {
      console.warn('[Draft] Failed to restore:', e)
    }
  }, [username])

  // Persist on change
  useEffect(() => {
    const timer = setTimeout(() => {
      const data = {
        collabType,
        brandName,
        brandEmail,
        brandInstagram,
        campaignDescription,
        exactBudget,
        deadline,
        timestamp: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }, 1000)
    return () => clearTimeout(timer)
  }, [
    collabType,
    brandName,
    brandEmail,
    brandInstagram,
    campaignDescription,
    exactBudget,
    deadline,
    STORAGE_KEY,
  ])

  // --- NEW: SMART EMAIL LOOKUP ---
  useEffect(() => {
    const email = brandEmail.trim().toLowerCase()
    if (!email || !email.includes('@') || email.length < 5) {
      setLookupStatus('idle')
      return
    }

    // Skip if already found / logged in with this email
    if (useBrandProfile && email === (profile?.email || user?.email || '').toLowerCase()) return

    const timer = setTimeout(async () => {
      setLookupStatus('loading')
      try {
        const apiBase = getApiBaseUrl()
        const url = `${apiBase}/api/collab/lookup-brand?email=${encodeURIComponent(email)}`

        let res: Response | null = null
        let attempts = 0
        const maxAttempts = 2

        while (attempts <= maxAttempts) {
          try {
            res = await fetch(url)
            break
          } catch (e: any) {
            attempts++
            if (attempts > maxAttempts) throw e
            console.warn(
              `[CollabLinkLanding] Brand lookup failed (attempt ${attempts}), retrying...`,
              e
            )
            await new Promise(r => setTimeout(r, 500 * attempts))
          }
        }

        if (!res) throw new Error('Fetch failed after retries')
        const json = await res.json()

        if (res.ok && json.success && json.data) {
          setLookupStatus('found')
          setLookupData(json.data)

          if (!brandName.trim() && json.data.brand_name) setBrandName(json.data.brand_name)

          const backendLogo = json.data.logo
          if (!isLogoUserUploaded && backendLogo) {
            setBrandLogoUrl(backendLogo)
          }
          if (!brandInstagram.trim() && json.data.instagram) setBrandInstagram(json.data.instagram)

          setUseBrandProfile(true)
        } else {
          setLookupStatus('not_found')
          setLookupData(null)
        }
      } catch (e) {
        console.error('[CollabLinkLanding] Brand lookup final failure:', e)
        setLookupStatus('idle')
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [
    brandEmail,
    profile,
    user,
    useBrandProfile,
    brandName,
    brandLogoUrl,
    brandInstagram,
    failedLogos,
  ])



  const jumpToOfferForm = (options?: { openCustom?: boolean }) => {
    setHasStartedOffer(true)
    if (options?.openCustom && !showCustomFlow) {
      setShowCustomFlow(true)
      setCurrentStep(1)
      setSelectedTemplateId(null)
    }
    window.setTimeout(() => {
      document
        .getElementById('core-offer-form')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  // If the brand came here via "Send offer", auto-open the offer flow.
  useEffect(() => {
    const offerParam = (searchParams.get('offer') || '').toLowerCase()
    const shouldStartOffer = offerParam === 'true' || offerParam === '1' || offerParam === 'yes'
    if (!shouldStartOffer) return
    if (hasStartedOffer) return

    jumpToOfferForm()
  }, [searchParams, hasStartedOffer])

  // Save and continue later
  const formRef = useRef<HTMLFormElement | null>(null)
  const readinessBadgeRef = useRef<HTMLDivElement | null>(null)
  const headerSectionRef = useRef<HTMLDivElement | null>(null)
  const overviewSectionRef = useRef<HTMLDivElement | null>(null)
  const packagesSectionRef = useRef<HTMLDivElement | null>(null)
  const nichesSectionRef = useRef<HTMLDivElement | null>(null)

  // Entering the form implies the brand has started an offer.
  useEffect(() => {
    if (showCustomFlow) {
      setHasStartedOffer(true)
    }
  }, [showCustomFlow])

  useEffect(() => {
    if (creator) {
      if (creator.deal_templates && creator.deal_templates.length > 0) {
        const fallbackRate = (creator as any).avg_rate_reel || creator.suggested_reel_rate || 5000
        const validatedTemplates = creator.deal_templates.slice(0, 4).map((t, i) => {
          // If it's a barter deal or has a price, keep it
          if (t.budget > 0 || t.type === 'barter') return t

          // Otherwise use sensible defaults based on reel rate
          const fallbackBudgets = [
            fallbackRate,
            Math.round(fallbackRate * 2),
            Math.round(fallbackRate * 4),
            0, // Barter
          ]
          return { ...t, budget: fallbackBudgets[i] ?? 0 }
        })
        setLocalDealTemplates(validatedTemplates)
      } else {
        // Generate Default Templates based on reel rate
        const reelRate = (creator as any).avg_rate_reel || creator.suggested_reel_rate || 5000

        const defaultTemplates: DealTemplate[] = [
          {
            id: 'basic',
            label: '🚀 Starter Collab',
            icon: '🚀',
            budget: reelRate,
            type: 'paid',
            category: creator.category || 'Lifestyle',
            description:
              'High-performing Reel optimized for organic reach. Best for first-time brand discovery.',
            deliverables: ['1 Reel (15-30s)', 'Organic reach focus', 'Basic editing'],
            quantities: { 'Instagram Reel': 1 },
            deadlineDays: 3,
          },
          {
            id: 'standard',
            label: '⭐ Growth Campaign',
            icon: '⭐',
            budget: Math.round(reelRate * 2),
            type: 'paid',
            category: creator.category || 'Lifestyle',
            description:
              'Includes 30-day usage rights so brands can run ads and drive conversions.',
            deliverables: [
              '1 Premium Reel (30-60s)',
              '30-day usage rights (for ads)',
              'Script + hook optimization',
              '1 Story shoutout',
            ],
            quantities: { 'Instagram Reel': 1, 'Instagram Stories': 2 },
            deadlineDays: 5,
            isPopular: true,
            notes: 'Most chosen by brands',
          },
          {
            id: 'product_review',
            label: '🎁 Product Exchange',
            icon: '🎁',
            budget: 0,
            type: 'barter',
            category: creator.category || 'Lifestyle',
            description:
              'Product unboxing or review with no paid usage rights. Best for authentic product proof.',
            deliverables: ['Product unboxing / review', '1 Story mention', 'No paid usage rights'],
            quantities: { 'Unboxing Video': 1, Story: 1 },
            deadlineDays: 14,
            notes: 'Product must be shipped before shoot. Honest review only.',
          },
        ]
        setLocalDealTemplates(defaultTemplates)
      }
    }
  }, [creator])

  const isOwner = useMemo(() => {
    return Boolean(user?.id && creator?.id && user.id === creator.id)
  }, [user?.id, creator?.id])

  // Keep owner preview aligned with latest profile edits even if public API fields lag behind.
  useEffect(() => {
    if (!creator || !user?.id || creator.id !== user.id) return

    const latestHandle = getPreferredPublicHandle(
      profile?.instagram_handle,
      profile?.username,
      creator.username
    )
    const latestName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
    const latestFollowers = Number((profile as any)?.instagram_followers || 0) || null
    const latestProfilePhoto =
      profile?.avatar_url ||
      (profile as any)?.instagram_profile_photo ||
      creator.profile_photo ||
      null
    const latestReelRate = Number((profile as any)?.avg_rate_reel || 0) || null
    const latestTemplates = (profile as any)?.deal_templates || []

    const nextPlatforms = Array.isArray(creator.platforms)
      ? creator.platforms.map(platform =>
          platform.name.toLowerCase() === 'instagram'
            ? {
                ...platform,
                handle: latestHandle || platform.handle,
                followers: latestFollowers || platform.followers || undefined,
              }
            : platform
        )
      : []

    const hasInstagramPlatform = nextPlatforms.some(
      platform => platform.name.toLowerCase() === 'instagram'
    )
    if (!hasInstagramPlatform && latestHandle) {
      nextPlatforms.unshift({
        name: 'Instagram',
        handle: latestHandle,
        followers: latestFollowers || undefined,
      })
    }

    const nextName = sanitizeDisplayName(latestName || creator.name)
    const nextUsername = sanitizeDisplayName(latestHandle || creator.username)
    const nextFollowers = latestFollowers || creator.followers || null
    const nextProfilePhoto = latestProfilePhoto

    const instagramHandle =
      nextPlatforms.find(platform => platform.name.toLowerCase() === 'instagram')?.handle || ''
    const isSameName = nextName === sanitizeDisplayName(creator.name)
    const isSameUsername = nextUsername === sanitizeDisplayName(creator.username)
    const isSameInstagramHandle =
      instagramHandle ===
      (creator.platforms.find(platform => platform.name.toLowerCase() === 'instagram')?.handle ||
        '')
    const isSameFollowers = nextFollowers === creator.followers
    const isSamePhoto = nextProfilePhoto === creator.profile_photo
    const isSameRate = latestReelRate === (creator as any).avg_rate_reel
    const isSameTemplates =
      JSON.stringify(latestTemplates) === JSON.stringify(creator.deal_templates)

    if (
      isSameName &&
      isSameUsername &&
      isSameInstagramHandle &&
      isSameFollowers &&
      isSamePhoto &&
      isSameRate &&
      isSameTemplates
    )
      return

    setCreator(prev =>
      prev
        ? {
            ...prev,
            name: nextName,
            username: nextUsername,
            followers: nextFollowers,
            profile_photo: nextProfilePhoto,
            platforms: nextPlatforms,
            avg_rate_reel: latestReelRate,
            deal_templates: latestTemplates,
          }
        : null
    )
  }, [profile, user?.id, creator])

  const isDeadlineProvided = Boolean(deadline)

  const typeSectionTitle =
    'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent'
  const typeLabel = 'bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent'
  const ctaStepStatus = !hasStartedOffer ? 'create' : currentStep < 2 ? 'next' : 'send'
  const ctaLabel =
    ctaStepStatus === 'create'
      ? 'Choose a Service'
      : ctaStepStatus === 'next'
        ? 'Continue to Offer'
        : 'Send Offer'
  const ctaIcon =
    ctaStepStatus === 'send' ? <Send className="h-4 w-4" /> : <Rocket className="h-4 w-4" />
  const ctaHelper =
    ctaStepStatus === 'send' ? 'Creator will be notified instantly' : 'Takes less than 1 minute'
  const inputClass =
    'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-400 transition-all rounded-xl'

  const isContactReady = isStep2Ready
  const isCoreReady = isStep1Ready && isStep2Ready

  const typePageTitle =
    'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent'

  useEffect(() => {
    if (!showSubmittingTrust) {
      setSubmitChecklistStep(0)
      return
    }
    setSubmitChecklistStep(0)
    const interval = window.setInterval(() => {
      setSubmitChecklistStep(prev => (prev < submittingChecklist.length - 1 ? prev + 1 : prev))
    }, 220)
    return () => window.clearInterval(interval)
  }, [showSubmittingTrust])

  // Readiness badge animation (must run before any conditional returns to preserve hook order)
  useEffect(() => {
    if (!creator || !readinessBadgeRef.current || typeof window === 'undefined') return

    const badgeEl = readinessBadgeRef.current
    const keyId = creator.username || creator.id
    if (!keyId) return

    const previewAvgReelViews =
      creator.avg_reel_views ?? creator.performance_proof?.median_reel_views ?? null
    const previewAvgLikes = creator.avg_likes ?? creator.performance_proof?.avg_likes ?? null
    const previewAudienceCities = creator.top_cities || []
    const previewAudienceRegionLabel =
      creator.collab_region_label?.trim() ||
      getAudienceRegionLabel(formatAudienceCities(previewAudienceCities))
    const previewTrustStats = creator.trust_stats

    const readiness = getCollabReadiness({
      instagramHandle: getPreferredPublicHandle(
        creator.platforms.find(p => p.name.toLowerCase() === 'instagram')?.handle,
        creator.username
      ),
      instagramLinked: Boolean(creator.last_instagram_sync),
      category: creator.category,
      niches: creator.content_niches,
      topCities: creator.top_cities,
      audienceGenderSplit: creator.audience_gender_split,
      primaryAudienceLanguage: creator.primary_audience_language,
      postingFrequency: creator.posting_frequency,
      avgReelViews: previewAvgReelViews,
      avgLikes: previewAvgLikes,
      openToCollabs: creator.open_to_collabs,
      avgRateReel: (creator as any).avg_rate_reel || (creator as any).avg_reel_rate,
      suggestedReelRate: creator.suggested_reel_rate,
      suggestedBarterValueMin: creator.suggested_barter_value_min,
      suggestedBarterValueMax: creator.suggested_barter_value_max,
      regionLabel: creator.collab_region_label || previewAudienceRegionLabel,
      mediaKitUrl: creator.media_kit_url,
      firstDealCount:
        creator.past_brand_count ||
        creator.collab_brands_count_override ||
        previewTrustStats?.completed_deals ||
        0,
    })

    const currentRank = readiness.rank
    const lastRankKey = `ca:readiness:last:${keyId}`
    const seenStateKey = `ca:readiness:seen:${keyId}:${readiness.stageKey}`
    const storedRank = Number(window.localStorage.getItem(lastRankKey) || '0')
    const seenCurrentState = window.localStorage.getItem(seenStateKey) === '1'
    const shouldAnimate = currentRank > storedRank || !seenCurrentState

    if (!shouldAnimate) return

    if (storedRank >= 3 && currentRank === 4) {
      setReadinessBadgeSparkle(true)
      window.setTimeout(() => setReadinessBadgeSparkle(false), 800)
      badgeEl.animate(
        [
          {
            opacity: 0.4,
            transform: 'translateY(8px) scale(0.97)',
            boxShadow: '0 0 0 rgba(0,0,0,0)',
          },
          {
            opacity: 1,
            transform: 'translateY(0) scale(1.02)',
            boxShadow: '0 0 30px rgba(139,92,246,0.35)',
          },
          { opacity: 1, transform: 'translateY(0) scale(1)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
        ],
        { duration: 560, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      )
    } else if (storedRank >= 2 && currentRank === 3) {
      badgeEl.animate(
        [
          { opacity: 0.5, transform: 'translateY(6px) scale(0.98)' },
          { opacity: 1, transform: 'translateY(-1px) scale(1.03)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' },
        ],
        { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      )
    } else {
      badgeEl.animate(
        [
          { opacity: 0.3, transform: 'scale(0.97)' },
          { opacity: 1, transform: 'scale(1.03)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        { duration: 360, easing: 'ease-out' }
      )
    }

    window.localStorage.setItem(lastRankKey, String(Math.max(storedRank, currentRank)))
    window.localStorage.setItem(seenStateKey, '1')
  }, [creator])

  const handleInlineProfileUpdate = async (field: string, value: any) => {
    if (!creator?.id) return

    // Update local state for immediate feedback
    setCreator(prev => (prev ? { ...prev, [field]: value } : null))
    setProfileSaveStatus('saving')

    try {
      let updatePayload: any = { id: creator.id }

      if (field === 'name') {
        const nameStr = toTitleCaseName(String(value || ''))
        setCreator(prev => (prev ? { ...prev, name: nameStr } : null))
        const spaceIndex = nameStr.indexOf(' ')
        if (spaceIndex === -1) {
          updatePayload.first_name = nameStr
          updatePayload.last_name = ''
        } else {
          updatePayload.first_name = nameStr.substring(0, spaceIndex)
          updatePayload.last_name = nameStr.substring(spaceIndex + 1)
        }
      } else {
        updatePayload[field] = value
      }

      await updateProfileMutation.mutateAsync(updatePayload)
      setProfileSaveStatus('saved')
      setLastProfileSaveAt(new Date())
      window.setTimeout(() => {
        setProfileSaveStatus(prev => (prev === 'saved' ? 'idle' : prev))
      }, 2200)
      toast.success('Field updated successfully')
    } catch (error) {
      console.error(`Failed to update ${field}:`, error)
      setProfileSaveStatus('error')
      toast.error(`Failed to update ${field}`)
    }
  }

  const scrollToSetupSection = (key?: string) => {
    const lookupKey = key || firstIncompleteSetupKey
    const targetRef =
      lookupKey === 'instagram' || lookupKey === 'photo' || lookupKey === 'followers'
        ? headerSectionRef
        : lookupKey === 'niches'
          ? nichesSectionRef
          : lookupKey === 'rates'
            ? overviewSectionRef
            : packagesSectionRef

    targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleEditModeToggle = () => {
    if (!editMode) {
      setPreviewAsBrand(false)
      setEditMode(true)
      return
    }

    if (hasIncompleteSetup) {
      const proceed = window.confirm(
        'Your setup is incomplete. Brands may see missing profile details. Finish editing anyway?'
      )
      if (!proceed) {
        scrollToSetupSection()
        return
      }
    }

    setEditMode(false)
  }

  // Build form payload for save-draft / resume
  const getDraftFormData = () => ({
    collabType,
    brandName,
    brandEmail,
    brandInstagram,
    budgetRange,
    exactBudget,
    barterValue,
    barterProductName,
    barterProductCategory,
    barterProductImageUrl,
    campaignCategory,
    campaignDescription,
    deliverables,
    deadline,
  })

  const applyDraftFormData = (data: Record<string, unknown>) => {
    if (
      typeof data.collabType === 'string' &&
      ['paid', 'barter', 'hybrid', 'both'].includes(data.collabType)
    ) {
      setCollabType(data.collabType as CollabType)
    }
    if (typeof data.brandName === 'string') setBrandName(data.brandName)
    if (typeof data.brandEmail === 'string') setBrandEmail(data.brandEmail)
    if (typeof data.brandInstagram === 'string') setBrandInstagram(data.brandInstagram)
    if (typeof data.budgetRange === 'string') setBudgetRange(data.budgetRange)
    if (typeof data.exactBudget === 'string') setExactBudget(data.exactBudget)
    if (typeof data.barterValue === 'string') setBarterValue(data.barterValue)
    if (typeof data.barterProductName === 'string') setBarterProductName(data.barterProductName)
    if (typeof data.barterProductCategory === 'string')
      setBarterProductCategory(data.barterProductCategory)
    if (typeof data.barterProductImageUrl === 'string')
      setBarterProductImageUrl(data.barterProductImageUrl)
    if (typeof data.campaignCategory === 'string') setCampaignCategory(data.campaignCategory)
    if (typeof data.campaignDescription === 'string')
      setCampaignDescription(data.campaignDescription)
    if (Array.isArray(data.deliverables))
      setDeliverables(data.deliverables.filter((d): d is string => typeof d === 'string'))
    if (typeof data.deadline === 'string') setDeadline(data.deadline)
  }

  // Demo data prefill function
  const fillDemoData = () => {
    setBrandName('Demo Brand Co.')
    setBrandEmail('demo@brandco.com')
    setBrandInstagram('@demobrandco')
    setCollabType('paid')
    setCampaignCategory('Lifestyle')
    setBudgetRange('10000-25000')
    setExactBudget('15000')
    setCampaignDescription(
      'We are launching a new sustainable fashion line and would love to collaborate with you on creating authentic content that showcases our eco-friendly products. Our campaign focuses on promoting conscious consumerism and we believe your content style aligns perfectly with our brand values.'
    )
    setDeliverables(['Instagram Reel', 'Post', 'Story'])
    // Set deadline to 2 weeks from now
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 14)
    setDeadline(futureDate.toISOString().split('T')[0])
    // Set a placeholder image for demo purposes so the flow can be completed
    setBarterProductImageUrl(
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60'
    )
    setErrors({})
    toast.success('Demo data filled!')
  }

  // Auto-fill demo data for preview/design mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const normalizedUsername = (username || '').toLowerCase().trim()
    const isPreviewRoute = normalizedUsername === 'preview' || urlParams.get('preview') === '1'
    if (urlParams.get('demo') === 'true' || isPreviewRoute) {
      fillDemoData()
    }
  }, [username])

  // No longer need local getApiBaseUrl helper as it's imported from @/lib/utils/api

  // Upload barter product image and store public URL
  const handleBarterImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('[CollabLinkLanding] Image file selected:', file?.name, file?.type, file?.size)
    if (file) {
      toast.info(`Uploading ${file.name}...`)
    } else {
      console.warn('[CollabLinkLanding] No file selected or cancelled.')
      return
    }
    if (!username) {
      console.warn('[CollabLinkLanding] Missing username')
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, WebP, or GIF image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.')
      return
    }
    setBarterImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const apiBaseUrl = getApiBaseUrl()
      const res = await fetch(
        `${apiBaseUrl}/api/collab/${encodeURIComponent(username)}/upload-barter-image`,
        {
          method: 'POST',
          body: formData,
        }
      )
      const data = await res.json().catch(() => ({}))
      if (data.success && data.url) {
        setBarterProductImageUrl(data.url)
        toast.success('Product image uploaded.')
      } else {
        toast.error(data.error || 'Failed to upload image.')
      }
    } catch {
      toast.error('Failed to upload image.')
    } finally {
      setBarterImageUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !username) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, WebP, SVG, or GIF).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB.')
      return
    }
    setBrandLogoUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const apiBaseUrl = getApiBaseUrl()
      const res = await fetch(
        `${apiBaseUrl}/api/collab/${encodeURIComponent(username)}/upload-brand-logo`,
        {
          method: 'POST',
          body: formData,
        }
      )
      const data = await res.json().catch(() => ({}))
      if (data.success && data.url) {
        setBrandLogoUrl(data.url)
        setIsLogoUserUploaded(true)
        toast.success('Brand logo uploaded.')
      } else {
        toast.error(data.error || 'Failed to upload logo.')
      }
    } catch {
      toast.error('Failed to upload logo.')
    } finally {
      setBrandLogoUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  // Fetch creator profile (with timeout so page doesn't stay stuck on spinner)
  const CREATOR_FETCH_TIMEOUT_MS = 55000

  useEffect(() => {
    if (!username) return

    const normalizedUsername = decodeURIComponent(username).trim().toLowerCase()
    const previewMode = searchParams.get('preview') === '1' || normalizedUsername === 'preview'
    if (previewMode) {
      setCreator(buildLocalPreviewCreator(normalizedUsername || 'preview'))
      setError(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CREATOR_FETCH_TIMEOUT_MS)

    // Track if it's taking unusually long (typical for Render cold starts)
    const warmingTimer = setTimeout(() => {
      setIsWarmingUp(true)
    }, 10000)

    const fetchCreator = async () => {
      const normalizedUsername = decodeURIComponent(username).trim()
      const primaryApiBaseUrl = getApiBaseUrl()
      const fallbackApiBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
        primaryApiBaseUrl
      )
        ? 'https://creatorarmour-api.onrender.com'
        : null
      const candidateApiBaseUrls = [primaryApiBaseUrl, fallbackApiBaseUrl].filter(
        (value, index, all): value is string => Boolean(value) && all.indexOf(value) === index
      )

      console.log('[CollabLinkLanding] Fetching creator:', {
        originalUsername: username,
        normalizedUsername,
        apiBaseUrls: candidateApiBaseUrls,
        currentUrl: window.location.href,
        hash: window.location.hash,
      })

      try {
        let response: Response | null = null
        let activeApiBaseUrl = primaryApiBaseUrl
        let lastFetchError: any = null

        for (const candidateApiBaseUrl of candidateApiBaseUrls) {
          const candidateApiUrl = `${candidateApiBaseUrl}/api/collab/${encodeURIComponent(normalizedUsername)}`
          activeApiBaseUrl = candidateApiBaseUrl

          try {
            response = await fetch(candidateApiUrl, { signal: controller.signal })
            if (response.ok || response.status === 404) {
              break
            }

            if (candidateApiBaseUrl === fallbackApiBaseUrl && !response.ok) {
              break
            }
          } catch (fetchError: any) {
            lastFetchError = fetchError
            if (candidateApiBaseUrl === fallbackApiBaseUrl || fetchError?.name === 'AbortError') {
              throw fetchError
            }
            continue
          }
        }

        if (!response) {
          throw lastFetchError || new Error('Failed to fetch creator profile')
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('[CollabLinkLanding] API error:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            username: normalizedUsername,
            apiBaseUrl: activeApiBaseUrl,
          })

          if (response.status === 404) {
            // Don't redirect immediately - show error state instead
            setLoading(false)
            setError(
              `Creator "${normalizedUsername}" not found. Please check the username and try again.`
            )
            toast.error(
              `Creator "${normalizedUsername}" not found. Please check the username and try again.`
            )
            return
          }

          // For other errors, show error but don't redirect
          let errorMessage = errorData.error || 'Failed to load creator profile'
          if (response.status === 503 || errorData?.code === 'UPSTREAM_CONNECTIVITY_ISSUE') {
            errorMessage =
              'Profile service is temporarily unreachable. Please retry in a minute, or switch DNS/VPN.'
          }
          console.error('[CollabLinkLanding] Error:', errorMessage)
          setLoading(false)
          setError(errorMessage)
          toast.error(errorMessage)
          return
        }

        const data = await response.json()

        if (data.success && data.creator) {
          console.log('[CollabLinkLanding] Creator loaded successfully:', data.creator)
          const baseCreator = {
            ...data.creator,
            name: sanitizeDisplayName(data.creator.name || ''),
            username: sanitizeDisplayName(data.creator.username || ''),
          }
          setCreator(baseCreator)

          // Supplement with portfolio fields not returned by the backend API
          // We query by username (not ID) because RLS on profiles may block unauthenticated id-based reads
          if (data.creator.id || data.creator.username || data.creator.handle) {
            try {
              const handle = (data.creator.username || data.creator.handle || '')
                .toLowerCase()
                .trim()
              let portfolioRow: any = null

              // Try by username first
              if (handle) {
                const { data: rowByUsername, error: errByUsername } = await (supabase as any)
                  .from('profiles')
                  .select('portfolio_links, media_kit_url, discovery_video_url, portfolio_videos')
                  .eq('username', handle)
                  .maybeSingle()
                if (!errByUsername && rowByUsername) {
                  portfolioRow = rowByUsername
                } else if (errByUsername) {
                  console.warn(
                    '[CollabLinkLanding] portfolio fetch by username failed:',
                    errByUsername?.message
                  )
                }
              }

              // Fallback: try by ID — only if it looks like a UUID (not instagram:handle)
              const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                data.creator.id || ''
              )
              if (!portfolioRow && isUuid) {
                const { data: rowById, error: errById } = await (supabase as any)
                  .from('profiles')
                  .select('portfolio_links, media_kit_url, discovery_video_url, portfolio_videos')
                  .eq('id', data.creator.id)
                  .maybeSingle()
                if (!errById && rowById) {
                  portfolioRow = rowById
                } else if (errById) {
                  console.warn(
                    '[CollabLinkLanding] portfolio fetch by id failed:',
                    errById?.message
                  )
                }
              }

              if (portfolioRow) {
                const links = Array.isArray(portfolioRow.portfolio_links)
                  ? portfolioRow.portfolio_links.filter((l: string) => l && l.trim())
                  : []
                console.log('[CollabLinkLanding] Portfolio loaded:', {
                  links,
                  media_kit_url: portfolioRow.media_kit_url,
                })
                setCreator((prev: any) => ({
                  ...prev,
                  portfolio_links: links.length > 0 ? links : prev.portfolio_links || [],
                  media_kit_url: portfolioRow.media_kit_url || prev.media_kit_url || null,
                  discovery_video_url:
                    portfolioRow.discovery_video_url || prev.discovery_video_url || null,
                  portfolio_videos: portfolioRow.portfolio_videos || prev.portfolio_videos || [],
                }))
              } else {
                console.warn('[CollabLinkLanding] No portfolio row found for creator')
              }
            } catch (_e) {
              console.warn(
                '[CollabLinkLanding] Portfolio supplement fetch failed (non-critical):',
                _e
              )
            }
          }

          trackEvent('collab_link_viewed', { username: normalizedUsername })

          // Direct recording to collab_link_events for the real-time dashboard
          if (data.creator?.id) {
            const searchParams = new URLSearchParams(window.location.search)
            supabase
              .from('collab_link_events')
              .insert({
                creator_id: data.creator.id,
                event_type: 'view',
                utm_source: searchParams.get('utm_source') || 'direct',
                utm_medium: searchParams.get('utm_medium') || null,
                utm_campaign: searchParams.get('utm_campaign') || null,
                device_type: /mobile|android|iphone/i.test(navigator.userAgent)
                  ? 'mobile'
                  : /tablet|ipad/i.test(navigator.userAgent)
                    ? 'tablet'
                    : 'desktop',
              })
              .then(({ error }) => {
                if (error) {
                  // If this fails, it might be due to RLS or schema mismatch.
                  console.warn('[CollabLinkLanding] Direct event recording skipped:', error.message)
                }
              })
          }

          // Track page view event (anonymous, no auth required) via analytics service
          try {
            // Extract UTM parameters from URL
            const urlParams = new URLSearchParams(window.location.search)
            const utmSource = urlParams.get('utm_source')
            const utmMedium = urlParams.get('utm_medium')
            const utmCampaign = urlParams.get('utm_campaign')

            const analyticsApiBaseUrl = candidateApiBaseUrls[0]
            const trackResponse = await fetch(`${analyticsApiBaseUrl}/api/collab-analytics/track`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                creator_username: normalizedUsername,
                event_type: 'view',
                utm_source: utmSource || null,
                utm_medium: utmMedium || null,
                utm_campaign: utmCampaign || null,
              }),
            })

            if (!trackResponse.ok) {
              const trackErrorData = await trackResponse
                .json()
                .catch(() => ({ error: 'Unknown error' }))
              console.error(
                '[CollabLinkLanding] View tracking failed:',
                trackResponse.status,
                trackErrorData
              )
            } else {
              const trackData = await trackResponse.json().catch(() => null)
              if (import.meta.env.DEV) {
                console.log('[CollabLinkLanding] View tracked successfully:', trackData)
              }
            }
          } catch (trackError) {
            // Log error but don't break the user experience
            console.error('[CollabLinkLanding] Failed to track view:', trackError)
          }
        } else {
          console.error('[CollabLinkLanding] Invalid response:', data)
          setLoading(false)
          const errorMsg = data.error || 'Creator not found'
          setError(errorMsg)
          toast.error(errorMsg)
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          setError(
            'Request timed out. Make sure the server is running at ' +
              primaryApiBaseUrl +
              ' and try again.'
          )
          toast.error('Request timed out. Check that the API server is running.')
        } else {
          console.error('[CollabLinkLanding] Fetch error:', {
            error,
            message: error?.message,
            username: normalizedUsername,
            apiBaseUrls: candidateApiBaseUrls,
          })
          let errorMsg = 'Failed to load creator profile. Please try again later.'
          if (
            error?.message?.includes('Failed to fetch') ||
            error?.message?.includes('NetworkError')
          ) {
            errorMsg = 'Unable to connect. Is the server running at ' + primaryApiBaseUrl + '?'
          }
          setError(errorMsg)
          toast.error(errorMsg)
        }
      } finally {
        clearTimeout(timeoutId)
        clearTimeout(warmingTimer)
        setLoading(false)
      }
    }

    fetchCreator()
    return () => {
      controller.abort()
      clearTimeout(timeoutId)
      clearTimeout(warmingTimer)
    }
  }, [username, searchParams])

  // Resume draft from ?resume= token (after creator is loaded)
  useEffect(() => {
    const resumeToken = searchParams.get('resume')
    const normalizedUsername = username?.toLowerCase().trim()
    if (!resumeToken || !normalizedUsername || !creator) return

    const loadDraft = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl()
        const res = await fetch(
          `${apiBaseUrl}/api/collab/${encodeURIComponent(normalizedUsername)}/resume?token=${encodeURIComponent(resumeToken)}`
        )
        const data = await res.json()
        if (data.success && data.formData && typeof data.formData === 'object') {
          applyDraftFormData(data.formData)
          toast.success('Form restored. You can continue where you left off.')
          setSearchParams(
            prev => {
              const next = new URLSearchParams(prev)
              next.delete('resume')
              return next
            },
            { replace: true }
          )
        } else if (res.status === 410) {
          toast.error('This link has expired.')
          setSearchParams(
            prev => {
              const next = new URLSearchParams(prev)
              next.delete('resume')
              return next
            },
            { replace: true }
          )
        } else if (!res.ok) {
          toast.error(data.error || 'Could not load saved draft.')
        }
      } catch {
        toast.error('Could not load saved draft.')
      }
    }
    loadDraft()
  }, [creator, username, searchParams, setSearchParams])

  const handleSaveDraftSubmit = async () => {
    const emailStr = draftEmail.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      toast.error('Please enter a valid email address.')
      return
    }
    if (!username?.trim()) return
    setSaveDraftSubmitting(true)
    try {
      const apiBaseUrl = getApiBaseUrl()
      const res = await fetch(
        `${apiBaseUrl}/api/collab/${encodeURIComponent(username.toLowerCase().trim())}/save-draft`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailStr, formData: getDraftFormData() }),
        }
      )
      const data = await res.json()
      if (data.success) {
        toast.success('Check your email for a link to continue your request.')
        setShowSaveDraftModal(false)
        setDraftEmail('')
      } else {
        toast.error(data.error || 'Failed to save draft.')
      }
    } catch {
      toast.error('Failed to save draft. Please try again.')
    } finally {
      setSaveDraftSubmitting(false)
    }
  }

  const handleDeliverableToggle = (deliverable: string) => {
    setDeliverables(prev => {
      const isSelected = prev.includes(deliverable)
      if (isSelected) {
        const next = prev.filter(d => d !== deliverable)
        const nextQuantities = { ...deliverableQuantities }
        delete nextQuantities[deliverable]
        setDeliverableQuantities(nextQuantities)
        return next
      } else {
        setDeliverableQuantities(prev => ({ ...prev, [deliverable]: 1 }))
        return [...prev, deliverable]
      }
    })
  }

  const updateDeliverableQuantity = (deliverable: string, quantity: number) => {
    setDeliverableQuantities(prev => ({
      ...prev,
      [deliverable]: Math.max(1, quantity),
    }))
  }

  const handleCreateOfferClick = () => {
    setHasStartedOffer(true)
    window.setTimeout(() => {
      document
        .getElementById('core-offer-form')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const scrollOfferFormIntoView = () => {
    window.setTimeout(() => {
      document
        .getElementById('core-offer-form')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 40)
  }

  const handleStickySubmit = () => {
    if (!hasStartedOffer) {
      handleCreateOfferClick()
      return
    }

    if (currentStep === 1) {
      if (!collabType) {
        toast.error('Please select collaboration type first')
        return
      }
      if (selectedTemplateId) {
        if (deliverables.length === 0) {
          toast.error('Please select at least one deliverable')
          return
        }
      } else {
        if (campaignDescription.trim().length < 10) {
          toast.error('Please describe your idea (min 10 characters)')
          return
        }
      }
      setCurrentStep(2)
      scrollOfferFormIntoView()
      return
    }

    if (currentStep === 2) {
      if (!isStep2Ready) {
        if (!brandEmail.trim() || !isValidBrandEmail) {
          toast.error('Please add your email')
          return
        }
        if (isProductImageRequired && !String(barterProductImageUrl || '').trim()) {
          void openBarterImagePicker()
          return
        }
        toast.error('Please complete the required fields')
        return
      }
      formRef.current?.requestSubmit()
    }
  }

  const validateForm = (): { valid: boolean; firstErrorMessage?: string } => {
    const newErrors: FormErrors = {}

    if (!brandName.trim()) {
      newErrors.brandName = 'Enter your brand name'
    }

    if (!brandEmail.trim()) {
      newErrors.brandEmail = 'Enter your email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brandEmail)) {
      newErrors.brandEmail = 'Enter a valid email'
    }

    if (!campaignGoal) {
      newErrors.campaignGoal =
        paymentType === 'barter'
          ? 'Choose a campaign goal too. Barter only sets the payment type.'
          : 'Please select a campaign goal'
    }

    if (paymentType === 'barter' && barterTypes.length === 0) {
      newErrors.barterTypes = 'Please specify what you are offering'
    }

    if (!String(barterProductName || '').trim()) {
      newErrors.barterProductName = 'Please specify the product name'
    }

    // Conditional: Product Review requires Physical Product
    if (campaignGoal === 'Product Review / Unboxing' && paymentType === 'barter' && !barterTypes.includes('product')) {
      newErrors.barterTypes = 'Product Review requires a Physical Product'
    }

    if (!campaignDescription.trim()) {
      newErrors.campaignDescription = 'Describe what you want'
    } else if (campaignDescription.trim().length < 10) {
      newErrors.campaignDescription = 'Add a bit more detail'
    }

    if (deliverables.length === 0) {
      newErrors.deliverables = 'Please select at least one thing'
    }

    if (collabType === 'paid' && !budgetRange && !exactBudget) {
      newErrors.budget = 'Enter your budget'
    }

    if (collabType === 'barter' && !barterValue) {
      newErrors.budget = 'Enter estimated product value'
    }

    if (isProductImageRequired && !String(barterProductImageUrl || '').trim()) {
      newErrors.barterProductImageUrl = 'Please upload a product image'
    }

    setErrors(newErrors)
    
    // Auto-scroll to first error
    const errorKeys = Object.keys(newErrors)
    if (errorKeys.length > 0) {
      const firstErrorId = errorKeys[0] === 'budget' ? 'budget-input' : 
                          errorKeys[0] === 'brandName' ? 'brand-name-input' :
                          errorKeys[0] === 'brandEmail' ? 'brand-email-input' :
                          errorKeys[0] === 'campaignGoal' ? 'campaign-goal-section' :
                          errorKeys[0] === 'barterTypes' ? 'barter-types-section' :
                          errorKeys[0] === 'campaignDescription' ? 'campaign-description-input' :
                          errorKeys[0] === 'barterProductName' ? 'barter-product-name-input' :
                          errorKeys[0] === 'barterProductImageUrl' ? 'barter-product-image-upload' : null
      
      if (firstErrorId) {
        document.getElementById(firstErrorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    return {
      valid: Object.keys(newErrors).length === 0,
      firstErrorMessage: errorKeys.length > 0 ? newErrors[errorKeys[0] as keyof FormErrors] : undefined,
    }
  }

  // Normalize website URL - add https:// if missing
  const normalizeWebsiteUrl = (url: string): string => {
    if (!url || !url.trim()) return url
    const trimmed = url.trim()
    // If it already has http:// or https://, return as is
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed
    }
    // Otherwise, add https://
    return `https://${trimmed}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateForm()
    if (!validation.valid) {
      toast.error(validation.firstErrorMessage || 'Please fix the errors above')
      return
    }

    setSubmitting(true)

    try {
      const apiBaseUrl = getApiBaseUrl()
      const response = await fetch(`${apiBaseUrl}/api/collab/${username}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand_name: brandName,
          brand_email: brandEmail,
          brand_address: null,
          brand_gstin: null,
          brand_phone: null,
          brand_website: null,
          brand_instagram: brandInstagram || null,
          brand_logo_url: brandLogoUrl ? String(brandLogoUrl).trim() : null,
          collab_type: collabType,
          budget_range: budgetRange || null,
          exact_budget: exactBudget ? parseFloat(exactBudget) : null,
          campaign_category: campaignCategory || 'General',
          campaign_goal: campaignGoal || null,
          barter_value: barterValue ? parseFloat(barterValue) : null,
          barter_description: barterProductName || (paymentType === 'barter' 
            ? `Barter: ${barterTypes.map(t => BARTER_OPTIONS.find(o => o.id === t)?.label || t).join(', ')}`
            : 'Paid Collaboration'),
          barter_product_name: barterProductName || null,
          barter_product_category: barterProductCategory || null,
          barter_product_image_url: barterProductImageUrl
            ? String(barterProductImageUrl).trim()
            : null,
          campaign_description: [
            campaignDescription,
            contentRequirements.length > 0 ? `\nRequirements: ${contentRequirements.map(r => ({ hook: 'Hook in first 3 sec', voiceover: 'Voiceover included', cta: 'Strong Call to Action', tag: 'Brand Tagging' } as Record<string,string>)[r] || r).join(', ')}` : '',
            contentQuantity !== 1 ? `\nQuantity: ${contentQuantity}` : '',
            contentDuration ? `\nDuration: ${contentDuration}` : '',
          ].filter(Boolean).join(''),
          deliverables: selectedTemplate
            ? deliverables.map(
                d => `${d}${deliverableQuantities[d] > 1 ? ` (x${deliverableQuantities[d]})` : ''}`
              )
            : deliverables.length > 0 ? deliverables : ['Custom collaboration deliverables'],
          usage_rights: false,
          deadline: deadline || null,
          offer_expires_at: null,
          authorized_signer_name: null,
          authorized_signer_role: null,
          usage_duration: null,
          payment_terms: null,
          approval_sla_hours: null,
          requires_shipping: false,
          shipping_timeline_days: null,
          cancellation_policy: null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        trackEvent('collab_link_form_submitted', {
          username: username || '',
          collab_type: collabType,
        })
        toast.success('Offer sent! Check your email to track it.')
        const requestId = String(data?.request?.id || data?.lead?.id || '').trim() || null
        const successParams = new URLSearchParams({
          type: collabType,
          brand: brandName,
        })
        if (deadline) successParams.set('deadline', deadline)
        if (requestId) successParams.set('requestId', requestId)
        navigate(`/${username}/success?${successParams.toString()}`)
      } else {
        toast.error(data.error || 'Failed to submit request')
      }
    } catch (error: any) {
      toast.error('Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getPlatformIcon = (platformName: string) => {
    switch (platformName.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />
      case 'youtube':
        return <Youtube className="h-4 w-4" />
      case 'twitter':
        return <Twitter className="h-4 w-4" />
      case 'facebook':
        return <Facebook className="h-4 w-4" />
      default:
        return null
    }
  }

  const elevationLevel1 = 'bg-white/[0.05] border border-white/10 shadow-none'
  const elevationLevel2 =
    'bg-white/[0.08] border border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
  const elevationLevel3 =
    'bg-white/[0.12] border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.08)]'

  // Readiness badge animation (must run before any conditional returns to preserve hook order)

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600 mb-6" />
        {isWarmingUp && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-xs">
            <h3 className="text-white font-bold text-lg mb-2">Waking up server...</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our secure server is spinning up to verify this creator's profile. This usually takes
              30-40 seconds on the first load.
            </p>
          </div>
        )}
      </div>
    )
  }

  if (error) {
    const isNotFoundError = /not found/i.test(error)
    const errorTitle = isNotFoundError ? 'Creator Not Found' : 'Unable to Load Profile'
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8">
            <div className="mb-5">
              <div className="text-4xl mb-3">⚠️</div>
              <h1 className="text-3xl font-black text-white mb-3">{errorTitle}</h1>
            </div>
            <p className="text-slate-300 mb-6 leading-relaxed text-sm">
              {error.toLowerCase().includes('timeout')
                ? "The profile server is taking unusually long to wake up. This is common on the first load—clicking 'Try Again' usually works immediately."
                : error}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Go to Homepage
              </Button>
              <Button
                onClick={() => {
                  setError(null)
                  setLoading(true)
                  window.location.reload()
                }}
                className="bg-white text-black hover:bg-slate-200"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!creator) {
    return null
  }

  // Generate SEO meta tags
  const creatorName = toTitleCaseName(creator.name || 'Creator')
  const displayCreatorName = creatorName || 'Creator'
  const normalizedHandle = getPreferredPublicHandle(
    creator.platforms?.find(p => p.name.toLowerCase() === 'instagram')?.handle,
    creator.username,
    username
  )
  const creatorHandle = normalizedHandle ? `@${normalizedHandle}` : ''
  const metaTitle = `${creatorName}${creatorHandle ? ` (${creatorHandle})` : ''} Collab Link | CreatorArmour`
  // const platformNames = platforms.map(p => p.name).join(', ');
  const followerCount = creator.platforms.reduce((sum, p) => sum + (p.followers || 0), 0)
  const trustStats = creator.trust_stats
  const pastBrands = Array.isArray(creator.past_brands)
    ? creator.past_brands.map(b => (typeof b === 'string' ? b.trim() : '')).filter(Boolean)
    : []
  const trustedBrands = trustStats?.brands_count ?? 0
  const avgResponseHours = trustStats?.avg_response_hours ?? 3
  const completionRate = trustStats?.completion_rate ?? 98
  const recentCampaignTypes = Array.isArray(creator.recent_campaign_types)
    ? creator.recent_campaign_types
        .map(t => (typeof t === 'string' ? t.trim() : ''))
        .filter(Boolean)
    : []
  // const completedDeals = creator.past_brand_count || 0;(trustedBrands > 0 ? trustedBrands : pastBrands.length);
  const pastBrandCount =
    creator.past_brand_count ?? (trustedBrands > 0 ? trustedBrands : pastBrands.length)

  // Creator analytics (demo-to-real bridge)
  // Null means we don't yet have real analytics values for this creator.
  // When the API starts providing these, only this object needs to be populated.
  const creatorAnalytics: {
    brandsContactedThisWeek: number | null
    avgResponseTimeHours: number | null
    avgCampaignReach: number | null
  } = {
    brandsContactedThisWeek: null,
    avgResponseTimeHours: null,
    avgCampaignReach: null,
  }

  const demoAnalytics = {
    brandsContactedThisWeek: 12,
    avgResponseTimeHours: 3,
    avgCampaignReach: 76000,
  }

  const displayAnalytics = {
    brandsContactedThisWeek:
      creatorAnalytics.brandsContactedThisWeek ?? demoAnalytics.brandsContactedThisWeek,
    avgResponseTimeHours:
      creatorAnalytics.avgResponseTimeHours ?? demoAnalytics.avgResponseTimeHours,
    avgCampaignReach: creatorAnalytics.avgCampaignReach ?? demoAnalytics.avgCampaignReach,
  }

  const estimatedAnalyticsTooltip =
    'Estimated metric — real data will appear as the creator completes campaigns on CreatorArmour.'

  const isDemoAnalytics = {
    brandsContactedThisWeek: creatorAnalytics.brandsContactedThisWeek === null,
    avgResponseTimeHours: creatorAnalytics.avgResponseTimeHours === null,
    avgCampaignReach: creatorAnalytics.avgCampaignReach === null,
  }

  // Backwards-compatible formatting for existing UI copy (keep layout unchanged).
  const displayResponseLine = `~${displayAnalytics.avgResponseTimeHours} hrs`
  const followerText =
    followerCount > 0
      ? `${followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}K` : followerCount} followers`
      : ''
  const metaDescription =
    `Book ${creatorName}${creatorHandle ? ` (${creatorHandle})` : ''}${creator.category ? `, ${creator.category} creator` : ''}${followerText ? ` • ${followerText}` : ''}. Share paid, barter, or hybrid briefs with contract-first protection via CreatorArmour.`.substring(
      0,
      158
    )

  // Use clean URL for SEO (no hash)
  const canonicalUrl = `https://creatorarmour.com/${encodeURIComponent(normalizedHandle)}`
  const pageImage =
    creator.profile_photo && /^https?:\/\//i.test(creator.profile_photo)
      ? creator.profile_photo
      : 'https://creatorarmour.com/og-preview.png'
  const imageAlt = `Collaborate with ${creatorName}${creatorHandle ? ` (${creatorHandle})` : ''}`
  const seoKeywords = Array.from(
    new Set(
      [
        `collaborate with ${creatorName}`,
        creatorHandle,
        `${creatorName} brand collaboration`,
        creator.category ? `${creator.category} creator` : 'content creator',
        `${creatorName} collab link`,
        'influencer marketing India',
        'creator collaboration',
        'paid barter hybrid collaboration',
        ...pastBrands.slice(0, 4),
      ].filter(Boolean)
    )
  )
  const isSuccessView = location.pathname.endsWith('/success')
  const successBrand = searchParams.get('brand')?.trim()
  const successType = searchParams.get('type')?.trim()
  const successDeadline = searchParams.get('deadline')?.trim()
  const successRequestId = searchParams.get('requestId')?.trim()

  const displayBudget = exactBudget
    ? `₹${Number(exactBudget || 0).toLocaleString('en-IN')}`
    : budgetRange
      ? budgetRange.replace('-', ' – ').replace('under', 'Under ₹').replace('+', '+')
      : collabType === 'barter'
        ? barterValue
          ? `Barter • ₹${Number(barterValue).toLocaleString('en-IN')} value`
          : 'Barter'
        : isHybridCollab(collabType)
          ? `Hybrid${barterValue ? ` • ₹${Number(barterValue).toLocaleString('en-IN')} barter value` : ''}${exactBudget ? ` • ₹${Number(exactBudget).toLocaleString('en-IN')} paid` : ''}`
          : 'Not set'
  const displayDeadline = deadline
    ? new Date(deadline).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Not set'
  const formatFollowers = (n?: number | null) => {
    if (n === null || n === undefined || Number.isNaN(n) || n === 0) return 'Verified Account'
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return `${n}`
  }
  const primaryFollowers = creator.followers ?? followerCount
  const setupChecklist = [
    {
      key: 'instagram',
      label: 'Instagram handle set',
      complete: Boolean(normalizedHandle && normalizedHandle.length >= 3),
    },
    {
      key: 'followers',
      label: 'Followers added',
      complete: Number(primaryFollowers || (creator as any)?.instagram_followers || 0) > 0,
    },
    {
      key: 'niches',
      label: 'Content niches selected',
      complete: Boolean(creator.content_niches && creator.content_niches.length > 0),
    },
    {
      key: 'audience',
      label: 'Audience signals added',
      complete: Boolean(
        (creator.audience_gender_split &&
          String(creator.audience_gender_split).trim().length > 0) ||
        (creator.primary_audience_language &&
          String(creator.primary_audience_language).trim().length > 0)
      ),
    },
    {
      key: 'rates',
      label: 'Typical rate added',
      complete: Boolean((creator as any).avg_rate_reel || creator.suggested_reel_rate),
    },
    {
      key: 'packages',
      label: '3 packages configured',
      complete: (localDealTemplates?.length || 0) >= 3,
    },
  ]
  const onboardingAlreadyCompleted = Boolean(
    (isOwner && profile?.onboarding_complete === true) || creator.onboarding_complete === true
  )
  const effectiveSetupChecklist = onboardingAlreadyCompleted
    ? setupChecklist.map(item => ({ ...item, complete: true }))
    : setupChecklist
  const setupCompletedCount = effectiveSetupChecklist.filter(item => item.complete).length
  const hasIncompleteSetup = setupCompletedCount < effectiveSetupChecklist.length
  const firstIncompleteSetupKey = effectiveSetupChecklist.find(item => !item.complete)?.key
  const profileSaveStatusLabel =
    profileSaveStatus === 'saving'
      ? 'Saving...'
      : profileSaveStatus === 'saved'
        ? `Saved${lastProfileSaveAt ? ` ${lastProfileSaveAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}`
        : profileSaveStatus === 'error'
          ? 'Save failed'
          : ''
  const avgReelViews =
    creator.avg_reel_views ?? creator.performance_proof?.median_reel_views ?? null
  const avgLikes = creator.avg_likes ?? creator.performance_proof?.avg_likes ?? null

  const isViewsVerified = Boolean(
    creator.performance_proof?.median_reel_views &&
    Number(avgReelViews) === Number(creator.performance_proof.median_reel_views)
  )
  const isLikesVerified = Boolean(
    creator.performance_proof?.avg_likes &&
    Number(avgLikes) === Number(creator.performance_proof.avg_likes)
  )

  // Qualification Warnings
  const minDeadlineDate = new Date()
  if (creator.min_lead_time_days)
    minDeadlineDate.setDate(minDeadlineDate.getDate() + creator.min_lead_time_days)
  const isDeadlineTooSoon = Boolean(
    creator.min_lead_time_days && deadline && new Date(deadline) < minDeadlineDate
  )

  const engagementRange = getEngagementRange(primaryFollowers, avgReelViews)
  const genderRows = formatAudienceGender(creator.audience_gender_split)
  const audienceCities = formatAudienceCities(creator.top_cities)
  const audienceLanguage = formatAudienceLanguage(creator.primary_audience_language)
  const audienceRegionLabel =
    creator.collab_region_label?.trim() || getAudienceRegionLabel(audienceCities)
  const audienceRelevanceNote =
    creator.collab_audience_relevance_note?.trim() || 'Strong relevance for North India audience'
  const creatorBio = isScrapedInstagramBio(creator.bio) ? null : creator.bio
  const collabIntroLine =
    creator.collab_intro_line?.trim() ||
    creatorBio ||
    'Structured brand deals with upfront payment protection — no more chasing payments.'
  const audienceFitLine =
    creator.collab_audience_fit_note?.trim() || 'Works best for targeted audience campaigns.'
  const sameDayResponseLine =
    avgResponseHours && avgResponseHours <= 20
      ? `~${Math.round(avgResponseHours)} hr${Math.round(avgResponseHours) > 1 ? 's' : ''}`
      : '~3 hrs'
  const showEngagementConfidence =
    engagementRange !== 'Growing Audience' ||
    Boolean(creator.collab_engagement_confidence_note?.trim())
  const engagementConfidenceNote =
    creator.collab_engagement_confidence_note?.trim() || 'Above-average engagement for creator size'
  const recentActivityNoteRaw =
    creator.past_brand_count === 0
      ? 'New Creator on CreatorArmour'
      : creator.collab_recent_activity_note?.trim() || 'Posting consistently'
  const recentActivityNote = withNeutralPrefix(recentActivityNoteRaw, 'Currently ')
  const campaignSlotNoteRaw =
    creator.past_brand_count === 0
      ? 'Actively accepting collaborations'
      : creator.campaign_slot_note?.trim() || 'Selective partnerships'
  const campaignSlotNoteText = withNeutralPrefix(campaignSlotNoteRaw, 'Works with ')
  const deliveryReliabilityNote =
    creator.collab_delivery_reliability_note?.trim() ||
    'Reliable delivery across past collaborations.' // const responseCtaLine = collabResponseBehaviorPreset
  //   ? `Usually responds ${collabResponseBehaviorPreset.toLowerCase()}`
  //   : `Ready to review offers`;
  const responseBehaviorNoteRaw =
    creator.collab_response_behavior_note?.trim() || 'Most brands receive response within same day'
  const responseBehaviorNote = withNeutralPrefix(responseBehaviorNoteRaw, 'Typically ')
  const ctaTrustNote =
    creator.collab_cta_trust_note?.trim() || 'Creator notified instantly — no DM required.'
  // const ctaTrustNote = creator.collab_cta_trust_note;
  const ctaDmNote = creator.collab_cta_dm_note?.trim() || 'No DMs required — creator replies here.'
  const ctaPlatformNote =
    creator.collab_cta_platform_note?.trim() || 'Direct collaboration — no agency middle layer'
  const mobileEngagementLabel =
    engagementRange === 'Growing Audience' ? 'Consistent viewer engagement' : engagementRange

  const collabReadiness = getCollabReadiness({
    instagramHandle: getPreferredPublicHandle(
      creator.platforms.find(p => p.name.toLowerCase() === 'instagram')?.handle,
      creator.username
    ),
    instagramLinked: Boolean(creator.last_instagram_sync),
    category: creator.category,
    niches: creator.content_niches,
    topCities: creator.top_cities,
    audienceGenderSplit: creator.audience_gender_split,
    primaryAudienceLanguage: creator.primary_audience_language,
    postingFrequency: creator.posting_frequency,
    avgReelViews,
    avgLikes,
    openToCollabs: creator.open_to_collabs,
    avgRateReel: (creator as any).avg_rate_reel || (creator as any).avg_reel_rate,
    suggestedReelRate: creator.suggested_reel_rate,
    suggestedBarterValueMin: creator.suggested_barter_value_min,
    suggestedBarterValueMax: creator.suggested_barter_value_max,
    regionLabel: creator.collab_region_label || audienceRegionLabel,
    mediaKitUrl: creator.media_kit_url,
    firstDealCount:
      creator.past_brand_count ||
      creator.collab_brands_count_override ||
      trustStats?.completed_deals ||
      0,
  })

  const isBudgetTooLow = Boolean(
    creator.min_deal_value &&
    ((collabType === 'paid' &&
      Number(exactBudget) > 0 &&
      Number(exactBudget) < creator.min_deal_value) ||
      (collabType === 'barter' &&
        Number(barterValue) > 0 &&
        Number(barterValue) < creator.min_deal_value))
  )

  const handleTemplateSelect = (template: DealTemplate) => {
    setCollabType(template.type || 'paid')
    if (template.type === 'paid') {
      setExactBudget(template.budget.toString())
    } else {
      setBarterValue(template.budget.toString())
    }

    if (template.category) setCampaignCategory(template.category)
    setCampaignGoal(template.label)
    setCampaignDescription(template.description)
    setDeliverables(template.deliverables)
    setDeliverableQuantities(template.quantities)

    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + (template.deadlineDays || 7))
    setDeadline(targetDate.toISOString().split('T')[0])

    setSelectedTemplateId(template.id)
    toast.success(`${template.label} selected`)
    triggerHaptic(HapticPatterns.success)

    // Keep the user on the current step so they can review the selected template
    // and complete the campaign goal/details before moving on.
    setShowCustomFlow(true)

    // Bring the offer panel into view so the selected template is visible.
    setTemplateContinueNudge(Date.now())
    requestAnimationFrame(() => {
      document
        .getElementById('core-offer-form')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleUpdateTemplate = (updated: DealTemplate) => {
    let updatedList = localDealTemplates.map(t => (t.id === updated.id ? updated : t))

    // Ensure only one package has the "isPopular" badge
    if (updated.isPopular) {
      updatedList = updatedList.map(t => (t.id === updated.id ? t : { ...t, isPopular: false }))
    }

    setLocalDealTemplates(updatedList)
    setEditingTemplate(null)

    // PERSIST: Save the updated template list to the database
    handleInlineProfileUpdate('deal_templates', updatedList)

    triggerHaptic(HapticPatterns.success)
  }

  const dealTemplates = localDealTemplates
  const selectedTemplate =
    dealTemplates.find(template => template.id === selectedTemplateId) || null
  const portfolioItems = normalizePortfolioItems(
    creator.portfolio_items || creator.collab_past_work_items,
    creator.portfolio_links
  )
  const pastWorkItems = Array.isArray(creator.collab_past_work_items)
    ? creator.collab_past_work_items
        .map((item, index) => ({
          id: String(item?.id || `past-work-${index}`),
          brand: String(item?.brand || '').trim(),
          campaignType: String(item?.campaignType || '').trim(),
          outcome: String(item?.outcome || '').trim(),
          proofLabel: String(item?.proofLabel || '').trim(),
        }))
        .filter(item => item.brand || item.campaignType || item.outcome || item.proofLabel)
    : []
  const recentCollaborations =
    pastWorkItems.length > 0
      ? pastWorkItems.slice(0, 3).map(item => ({
          id: item.id,
          name: item.brand || 'Brand collaboration',
          type: item.campaignType || 'Campaign',
          outcome: item.outcome || 'Shared campaign proof',
          proofLabel: item.proofLabel || 'Past Work',
        }))
      : []
  const showPackagesSection = creator.collab_show_packages !== false
  const showTrustSections = creator.collab_show_trust_signals !== false
  const showAudienceSections = creator.collab_show_audience_snapshot !== false
  const showPastWorkSection = creator.collab_show_past_work !== false
  const creatorCollabSchema = (() => {
    const creatorId =
      creator.id || normalizedHandle || creatorName.toLowerCase().replace(/\s+/g, '-')
    const profilePageId = `${canonicalUrl}#profile-page`
    const personId = `${canonicalUrl}#creator`
    const serviceId = `${canonicalUrl}#collab-service`
    const orgId = 'https://creatorarmour.com/#organization'

    const sameAs = creator.platforms
      .map(p => {
        const handle = (p.handle || '').replace(/^@/, '')
        switch (p.name.toLowerCase()) {
          case 'instagram':
            return handle ? `https://instagram.com/${handle}` : null
          case 'youtube':
            return handle ? `https://youtube.com/${handle}` : null
          case 'twitter':
          case 'x':
            return handle ? `https://x.com/${handle}` : null
          case 'facebook':
            return p.handle || null
          default:
            return null
        }
      })
      .filter(Boolean)

    const offerItems = (dealTemplates || []).slice(0, 8).map((template, index) => {
      const isPaid = template.type === 'paid'
      const offerDescriptionParts = [
        template.description?.trim(),
        Array.isArray(template.deliverables) && template.deliverables.length > 0
          ? `Includes: ${template.deliverables.join(', ')}`
          : null,
      ].filter(Boolean)

      return {
        '@type': 'Offer',
        '@id': `${canonicalUrl}#offer-${template.id || index + 1}`,
        name: template.label || `Creator package ${index + 1}`,
        category: template.category || 'Creator Collaboration',
        description: offerDescriptionParts.join(' • '),
        priceCurrency: 'INR',
        price: isPaid ? String(template.budget || 0) : '0',
        availability: 'https://schema.org/InStock',
        url: canonicalUrl,
        eligibleRegion: 'IN',
      }
    })

    const audienceDescriptionParts = [
      creator.category ? `${creator.category} creator` : null,
      followerText || null,
      audienceRegionLabel || null,
      audienceLanguage ? `Language: ${audienceLanguage}` : null,
    ].filter(Boolean)

    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': orgId,
          name: 'CreatorArmour',
          alternateName: 'CreatorArmour',
          url: 'https://creatorarmour.com',
          logo: 'https://creatorarmour.com/logo.png',
        },
        {
          '@type': 'ProfilePage',
          '@id': profilePageId,
          url: canonicalUrl,
          name: `${creatorName}${creatorHandle ? ` (${creatorHandle})` : ''} Collab Profile`,
          isPartOf: { '@id': 'https://creatorarmour.com/#website' },
          about: { '@id': personId },
          mainEntity: { '@id': personId },
        },
        {
          '@type': 'Person',
          '@id': personId,
          identifier: creatorId,
          name: creatorName,
          alternateName: creatorHandle || creator.username || creatorName,
          description: metaDescription,
          image: pageImage,
          url: canonicalUrl,
          jobTitle: creator.category ? `${creator.category} Creator` : 'Content Creator',
          knowsAbout: creator.content_niches?.length
            ? creator.content_niches
            : [creator.category || 'Content Creation'],
          sameAs,
          worksFor: { '@id': orgId },
          interactionStatistic: primaryFollowers
            ? {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/FollowAction',
                userInteractionCount: Number(primaryFollowers),
              }
            : undefined,
        },
        {
          '@type': 'Service',
          '@id': serviceId,
          name: `${creatorName} Collaboration Services`,
          description: audienceDescriptionParts.join(' • ') || metaDescription,
          provider: { '@id': personId },
          serviceType: 'Creator Brand Collaboration',
          areaServed: audienceRegionLabel || 'India',
          offers: offerItems,
          termsOfService: 'https://creatorarmour.com/terms-of-service',
        },
      ],
    }
  })()

  if (isSuccessView) {
    return (
      <>
        <SEOHead
          title={`Offer Sent to ${creatorName} | CreatorArmour`}
          description={`Your offer for ${creatorName} has been sent. The creator has been notified and can now accept, counter, or decline.`}
          keywords={['creator offer sent', creatorName, creatorHandle].filter(Boolean)}
          image={pageImage}
          imageAlt={imageAlt}
          type="website"
          canonicalUrl={`https://creatorarmour.com/${encodeURIComponent(normalizedHandle)}/success`}
        />

        <div className="light min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#eef8f5_100%)] text-slate-900">
          <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-12 sm:px-8">
            <div className="rounded-[32px] border border-emerald-200/80 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,118,110,0.12)] sm:p-10">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.28em] text-emerald-700">
                Offer Sent
              </p>
              <h1 className="mb-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                {creatorName} has your offer.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                {successBrand ? `${successBrand}'s` : 'Your'} offer has been delivered. The creator
                can now review it, accept it, counter it, or decline it.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Creator
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-900">{creatorName}</p>
                  <p className="text-sm text-slate-500">
                    {creatorHandle || creator.category || 'Brand collaborations'}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Offer Type
                  </p>
                  <p className="mt-2 text-lg font-black capitalize text-slate-900">
                    {successType || collabType}
                  </p>
                  <p className="text-sm text-slate-500">Shared through CreatorArmour</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Deadline
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {successDeadline || 'Shared with creator'}
                  </p>
                  <p className="text-sm text-slate-500">
                    Legal details come later if they are interested
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-[28px] border border-teal-100 bg-teal-50/70 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-teal-700">
                  What Happens Next
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-sm font-black text-slate-900">1. Creator reviews</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      They see your brief, budget or product value, and timeline.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-sm font-black text-slate-900">2. They respond</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      They can accept, counter, or decline based on fit and availability.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-sm font-black text-slate-900">3. Details follow</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Contract, shipping, and payment details are collected only after interest is
                      confirmed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                  Track This Offer
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  We emailed you a link to track replies and manage the deal. If you already have a
                  brand account, you can also open your dashboard.
                </p>
                {successRequestId && (
                  <p className="mt-3 text-xs font-bold text-slate-500">
                    Reference ID:{' '}
                    <span className="font-black text-slate-700">{successRequestId}</span>
                  </p>
                )}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => navigate('/brand-dashboard')}
                    className="h-12 rounded-full bg-slate-900 px-6 text-sm font-black text-white hover:bg-black"
                  >
                    Open Brand Dashboard
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/login')}
                    className="h-12 rounded-full border-slate-300 px-6 text-sm font-black text-slate-700 hover:bg-white"
                  >
                    Log In
                  </Button>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => navigate(`/${username}`)}
                  className="h-12 rounded-full bg-teal-600 px-6 text-sm font-black text-white hover:bg-teal-700"
                >
                  Send Another Offer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="h-12 rounded-full border-slate-300 px-6 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Go to Homepage
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <SEOHead
        title={metaTitle}
        description={metaDescription}
        keywords={seoKeywords}
        image={pageImage}
        imageAlt={imageAlt}
        type="website"
        canonicalUrl={canonicalUrl}
      />

      <BreadcrumbSchema
        items={[
          { name: 'CreatorArmour', url: 'https://creatorarmour.com' },
          { name: creatorHandle || creatorName, url: canonicalUrl },
        ]}
      />

      <JsonLdSchema schemaKey="creator-collab-graph" schema={creatorCollabSchema} />

      <style>{`
        @keyframes nbPulse {
          0% { transform: scale(1); box-shadow: 0 14px 30px rgba(15,164,127,0.16); }
          45% { transform: scale(1.012); box-shadow: 0 18px 44px rgba(15,164,127,0.22); }
          100% { transform: scale(1); box-shadow: 0 14px 30px rgba(15,164,127,0.16); }
        }
      `}</style>

      {/* NOTE: `overflow-x-clip` breaks `position: sticky` in Chromium when applied on an ancestor.
          Keep it on mobile to avoid horizontal scroll, but disable it on desktop so the right panel can stick. */}
      <div className="min-h-screen selection:bg-emerald-500/30 text-slate-900 relative overflow-x-hidden bg-[#F8FAFC]">
        {/* Premium Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-emerald-100/40 to-teal-100/20 blur-[120px]"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute top-[20%] -right-[5%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-blue-100/30 to-indigo-100/10 blur-[100px]"
          />
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            }}
          />
        </div>

        <div className="container mx-auto px-4 md:px-6 pt-4 pb-36 md:pb-10 md:pt-10 max-w-lg md:max-w-4xl lg:max-w-[1280px] relative z-10">
          <div className="flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_380px] items-start gap-7 md:gap-8 w-full">
            {/* LEFT COLUMN - Creator Context */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="w-full shrink-0"
            >
              <div className="flex flex-col items-center justify-center pt-8 pb-4">
                <div className="relative group mb-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="w-[120px] h-[120px] rounded-[40px] overflow-hidden p-1 bg-gradient-to-tr from-emerald-400 to-blue-500 shadow-2xl relative"
                  >
                    <div className="w-full h-full rounded-[38px] overflow-hidden border-4 border-white bg-white">
                      <Avatar className="w-full h-full rounded-none">
                        <AvatarImage
                          src={safeAvatarSrc(creator.profile_photo)}
                          alt={displayCreatorName}
                          className="w-full h-full object-cover"
                        />
                        <AvatarFallback className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 font-bold text-4xl">
                          {displayCreatorName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </motion.div>

                </div>

                <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight text-center">
                  {displayCreatorName}
                </h1>
                <div className="flex items-center gap-2 mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                  </span>
                  <h2 className="text-sm font-bold text-slate-500 tracking-wide lowercase">
                    @{normalizedHandle}
                  </h2>
                </div>

                <div className="flex justify-center flex-wrap gap-3 mt-2">
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-white bg-white/60 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.03)] border-b-slate-200/50 transition-all whitespace-nowrap"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                    <span className="text-[10px] md:text-[11px] font-black tracking-[0.06em] text-slate-700 uppercase leading-none">
                      Typical collab: {creator.collab_deal_preference === 'barter_only' ? 'Barter' : 'Paid'}
                    </span>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-amber-100 bg-amber-50/60 backdrop-blur-md shadow-[0_4px_12px_rgba(245,158,11,0.05)] border-b-amber-200/50 transition-all whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                    <span className="text-[10px] md:text-[11px] font-black tracking-[0.06em] text-amber-700 uppercase leading-none">
                      Fast Response
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* NEW: Discovery Reel / Featured Video Section */}
              {creator.discovery_video_url && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="mt-8 mb-12 w-full max-w-[500px] mx-auto px-4 sm:px-0"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                        Featured Work
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-1 w-8 rounded-full bg-emerald-500" />
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em]">
                          Verified Content Style
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative group rounded-[40px] overflow-hidden border-[6px] border-white shadow-2xl bg-slate-100 aspect-[9/16] max-h-[550px] mx-auto transition-transform duration-500 hover:scale-[1.02]">
                    <video
                      src={creator.discovery_video_url}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                      autoPlay
                      muted
                      loop
                      poster={creator.profile_photo || undefined}
                    />
                    <div className="absolute top-6 right-6 z-10">
                      <div className="bg-black/60 backdrop-blur-xl text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-white/20 flex items-center gap-2.5 shadow-xl">
                        <div className="w-2 h-2 rounded-full bg-emerald-400">
                          <div className="w-full h-full rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        Sample Style
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>
                  <div className="mt-5 p-4 rounded-3xl bg-white/40 border border-white backdrop-blur-sm shadow-sm">
                    <p className="text-center text-xs font-bold text-slate-500 leading-relaxed italic px-2">
                      "This is a verified sample of my content style and production quality. I focus
                      on creating high-engagement reels for lifestyle brands."
                    </p>
                  </div>
                </motion.div>
              )}

              {showPackagesSection && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="mt-8 mb-16 w-full max-w-[500px] mx-auto px-4 sm:px-0"
                >
                  <div className="mb-8 px-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                      Services
                    </h3>
                    <div className="flex items-center gap-2 mt-2.5">
                      <div className="h-1 w-6 rounded-full bg-slate-300" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Select a package to start
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    {dealTemplates.map((template, idx) => {
                      const isBarter = template.type === 'barter'
                      const formatPrice = p => '₹' + p.toLocaleString('en-IN')

                      return (
                        <motion.div
                          key={template.id}
                          whileHover={{ y: -4, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            'rounded-[32px] p-6 sm:p-7 relative transition-all duration-300',
                            template.isPopular
                              ? 'bg-white border-2 border-emerald-500 shadow-[0_20px_40px_rgba(16,185,129,0.12)]'
                              : 'bg-white/70 backdrop-blur-md border border-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]'
                          )}
                        >
                          {template.isPopular && (
                            <div className="absolute -top-3.5 left-8 z-10">
                              <div className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.15em] px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/20">
                                Most Popular
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-xl font-black text-slate-900 tracking-tight">
                                {template.label}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  {isBarter ? 'Product Only' : 'Standard Delivery'}
                                </span>
                              </div>
                            </div>
                            <div
                              className={cn(
                                'w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner border transition-transform group-hover:rotate-6',
                                template.isPopular
                                  ? 'bg-emerald-50 border-emerald-100'
                                  : 'bg-slate-50 border-slate-100'
                              )}
                            >
                              {template.icon || '📦'}
                            </div>
                          </div>

                          <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed">
                            {template.description}
                          </p>

                          <div className="mb-8 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
                              What the brand gets
                            </p>
                            <ul className="space-y-1.5">
                              {template.deliverables.map((item) => (
                                <li key={item} className="flex items-start gap-2 text-[12px] font-semibold text-slate-700 leading-snug">
                                  <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex justify-between items-center mt-auto">
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Total Value
                              </p>
                              <span
                                className={cn(
                                  'text-2xl sm:text-3xl font-black tracking-tight',
                                  template.isPopular ? 'text-emerald-500' : 'text-slate-900'
                                )}
                              >
                                {isBarter ? 'Barter' : formatPrice(template.budget)}
                              </span>
                            </div>

                            <Button
                              onClick={() => {
                                handleTemplateSelect(template)
                                if (template.type !== 'barter') {
                                  setCurrentStep(2)
                                  window.scrollTo({ top: 0, behavior: 'smooth' })
                                } else {
                                  setCurrentStep(1)
                                  // Scroll to form if on mobile
                                  requestAnimationFrame(() => {
                                    document
                                      .getElementById('core-offer-form')
                                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                  })
                                }
                              }}
                              className={cn(
                                'h-12 px-8 rounded-2xl font-black text-sm transition-all shadow-lg',
                                template.isPopular
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/25'
                                  : 'bg-slate-900 text-white hover:bg-black shadow-slate-900/10'
                              )}
                            >
                              Select
                            </Button>
                          </div>
                        </motion.div>
                      )
                    })}

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setCollabType('paid')
                        setExactBudget('')
                        setSelectedTemplateId(null)
                        setShowCustomFlow(true)
                        setHasStartedOffer(true)
                        setCurrentStep(1)
                        requestAnimationFrame(() => {
                          document
                            .getElementById('core-offer-form')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        })
                        triggerHaptic(HapticPatterns.success)
                      }}
                      className="w-full py-6 mt-4 rounded-[32px] border-2 border-dashed border-slate-200 text-slate-400 font-black text-xs uppercase tracking-[0.2em] hover:border-slate-300 hover:text-slate-500 transition-all bg-white/40 backdrop-blur-sm shadow-sm"
                    >
                      + Propose Custom Service
                    </motion.button>
                  </div>

                  <div className="mt-16 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-5">
                      About Creator
                    </p>
                    <div className="inline-block p-1 rounded-[24px] bg-white/30 backdrop-blur-sm border border-white">
                      <div className="px-6 py-4 rounded-[20px] bg-white shadow-sm border border-slate-100">
                        <p className="text-[13px] font-black text-slate-900 leading-relaxed">
                          {formatFollowers(primaryFollowers)}{' '}
                          <span className="text-slate-400 font-bold ml-1 uppercase tracking-tighter">
                            Followers
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-20 text-center pb-12 border-t border-slate-100/50 pt-10">
                    <div className="flex items-center justify-center gap-2.5 mb-4 group cursor-default">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                        Secured by CreatorArmour
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                      Payments are held in escrow until content is delivered. Verified creator
                      identity.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
            {/* RIGHT COLUMN - Offer Form */}
            <div className="w-full md:w-[380px] md:max-w-[380px] md:justify-self-end md:pb-32 md:sticky md:top-24 self-start">
              {/* 4. The main offer formation form (Unified for desktop/mobile) */}
              <div
                id="core-offer-form"
                className={`mt-2 lg:mt-0 w-full rounded-[28px] p-5 md:p-8 lg:p-10 mb-6 text-slate-900 bg-white relative transition-all duration-200 ease-out`}
                style={{
                  border: '1.5px solid #E2EAE8',
                  boxShadow: '0 18px 42px rgba(0,77,64,0.10),0 4px 12px rgba(0,0,0,0.06)',
                }}
              >
                {!showCustomFlow && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                        Start here
                      </p>
                      <p className="mt-2 text-[15px] font-black text-slate-900">
                        Choose a ready-made service first
                      </p>
                      <p className="mt-2 text-[12px] font-medium leading-relaxed text-slate-600">
                        The quick offer form asks only for your brand name, work email, brief,
                        budget or product value, and deadline.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        type="button"
                        onClick={() => {
                          document
                            .getElementById('packages-section')
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }}
                        className="w-full min-w-0 h-12 rounded-2xl bg-[#0FA47F] text-white hover:bg-emerald-600 font-black text-[11px] uppercase tracking-widest shadow-[0_10px_26px_rgba(15,164,127,0.20)]"
                      >
                        Choose a Service
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step indicator (Now shows 5 steps) */}
                {showCustomFlow && (
                  <>
                    {selectedTemplate && (
                      <div
                        className="mb-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 shadow-[0_14px_30px_rgba(15,164,127,0.16)]"
                        style={{
                          transform: templateContinueNudge ? 'translateZ(0)' : undefined,
                          animation: templateContinueNudge ? 'nbPulse 900ms ease-out 1' : undefined,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700/80 mb-1">
                              Selected service
                            </p>
                            <p className="text-[15px] font-black text-slate-900 truncate">
                              {selectedTemplate.label}
                            </p>
                            <p className="text-[12px] font-semibold text-slate-600 mt-0.5">
                              {selectedTemplate.type === 'barter'
                                ? 'Free products as payment'
                                : `₹${selectedTemplate.budget.toLocaleString('en-IN')}`}{' '}
                              • {selectedTemplate.deliverables.length} deliverable
                              {selectedTemplate.deliverables.length === 1 ? '' : 's'} •{' '}
                              {selectedTemplate.deadlineDays || 7} days to make content
                            </p>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <div className="bg-[#0FA47F] text-white rounded-full p-1 shadow-sm">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowCustomFlow(false)
                                setCurrentStep(1)
                                triggerHaptic(HapticPatterns.selection)
                                requestAnimationFrame(() => {
                                  document
                                    .getElementById('packages-section')
                                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                })
                              }}
                              className="h-9 px-3 rounded-2xl border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-black text-[10px] uppercase tracking-widest"
                            >
                              Change service
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Step {currentStep} of 2
                        </p>
                        <h2
                          className={`mt-1 text-[17px] font-black tracking-tight text-slate-900 leading-tight ${typeSectionTitle}`}
                        >
                          {currentStep === 1
                            ? !selectedTemplate
                              ? 'Describe your idea'
                              : 'What you want'
                            : 'Your contact details'}
                        </h2>
                      </div>
                      <div className="flex gap-1.5">
                        {[1, 2].map(step => (
                          <div
                            key={step}
                            className={`h-1.5 rounded-full transition-all duration-300 ${step === currentStep ? 'w-8 bg-slate-900 shadow-[0_0_10px_rgba(0,0,0,0.1)]' : step < currentStep ? 'w-3 bg-emerald-500/40' : 'w-1.5 bg-slate-100'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {showCustomFlow && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[300px] pb-40 md:pb-0">
                    {/* Step 1: Custom Description or Standard Selection */}
                    {currentStep === 1 && (
                      <div className="space-y-5">
                        {/* Section 1: The Mode (Primary Weight) */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs">01</div>
                            <label className="text-[16px] font-black text-slate-900 tracking-tight">
                              Collaboration Type
                            </label>
                          </div>
                          
                          <div className={cn("grid gap-4", isBarterRestricted ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
                            {!isBarterRestricted && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentType('paid')
                                  triggerHaptic(HapticPatterns.selection)
                                }}
                                className={cn(
                                  'relative flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left group overflow-hidden',
                                  paymentType === 'paid'
                                    ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.01]'
                                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 text-slate-600 hover:bg-white'
                                )}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={cn(
                                    "p-2.5 rounded-xl transition-colors shadow-sm",
                                    paymentType === 'paid' ? "bg-white/10 text-emerald-400" : "bg-white text-slate-400"
                                  )}>
                                    <Wallet className="h-5 w-5" />
                                  </div>
                                  <span className="text-[15px] font-black tracking-tight">Paid Collaboration</span>
                                </div>
                                <p className={cn("text-[12px] font-medium leading-snug", paymentType === 'paid' ? 'text-white/70' : 'text-slate-500')}>Direct payment for your deliverables.</p>
                                <div className={cn("mt-4 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5", paymentType === 'paid' ? 'bg-white/10 text-emerald-300' : 'bg-emerald-50 text-emerald-600')}>
                                  <ShieldCheck className="h-3.5 w-3.5" /> High creator interest
                                </div>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setPaymentType('barter')
                                triggerHaptic(HapticPatterns.selection)
                              }}
                              className={cn(
                                'relative flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left group overflow-hidden',
                                paymentType === 'barter'
                                  ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.01]'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                              )}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <div className={cn(
                                  "p-2.5 rounded-xl transition-colors shadow-sm",
                                  paymentType === 'barter' ? "bg-white/10 text-amber-400" : "bg-slate-50 text-slate-600"
                                )}>
                                  <Package className="h-5 w-5" />
                                </div>
                                <span className="text-[15px] font-black tracking-tight">Barter (No Cash)</span>
                              </div>
                              <p className={cn("text-[12px] font-medium leading-snug", paymentType === 'barter' ? 'text-white/70' : 'text-slate-500')}>Offer products or value in exchange.</p>
                              <div className={cn("mt-4 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5", paymentType === 'barter' ? 'bg-white/10 text-amber-300' : 'bg-amber-50 text-amber-700')}>
                                <Zap className="h-3.5 w-3.5" /> Value Based
                              </div>
                            </button>
                          </div>

                          {/* Nested Options within Mode Card - ONLY for Paid */}
                          {paymentType === 'paid' && (
                            <div className="pt-3 animate-in fade-in slide-in-from-top-1 duration-300">
                              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-slate-400" />
                                    <span className="text-[13px] font-bold text-slate-800">Do you want to include a product?</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { val: false, label: 'Cash Only', sub: 'Services only' },
                                    { val: true, label: 'Cash + Product', sub: 'Item included' }
                                  ].map(opt => (
                                    <button
                                      key={String(opt.val)}
                                      type="button"
                                      onClick={() => setIncludesProduct(opt.val)}
                                      className={cn(
                                        "flex flex-col items-center p-2 rounded-xl border-2 transition-all",
                                        includesProduct === opt.val 
                                          ? "bg-white border-slate-900 text-slate-900 shadow-sm" 
                                          : "border-transparent text-slate-400 hover:text-slate-600"
                                      )}
                                    >
                                      <span className="text-[11px] font-black uppercase tracking-wider">{opt.label}</span>
                                      <span className="text-[9px] font-medium opacity-60">{opt.sub}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section 2: The Goal (High Interaction Cards) */}
                        <div id="campaign-goal-section" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs">02</div>
                              <label className="text-[16px] font-black text-slate-900 tracking-tight">
                                Campaign Goal
                              </label>
                            </div>
                          </div>
                          
                          {paymentType === 'barter' && !campaignGoal && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                              <p className="text-[12px] font-bold text-amber-900">
                                Barter is the payment type. You still need to choose what the campaign is for.
                              </p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                              { id: 'App / Website Promotion', icon: <Rocket />, label: 'App / Website', sub: 'Promote installs or usage' },
                              { id: 'Product Review / Unboxing', icon: <Package />, label: 'Product Review', sub: 'Unboxing & item review' },
                              { id: 'Brand Awareness', icon: <Target />, label: 'Brand Awareness', sub: 'Reach new audiences' },
                              { id: 'Performance Campaign', icon: <TrendingUp />, label: 'Sales / Leads', sub: 'Focus on conversions' },
                              { id: 'Content Creation (UGC)', icon: <Camera />, label: 'Content for Ads', sub: 'High-quality UGC ads' },
                              { id: 'Custom Collaboration', icon: <Sparkles />, label: 'Custom', sub: 'Tailored partnership' },
                            ]
                            .filter(goal => !isBarterRestricted || goal.id === 'Product Review / Unboxing')
                            .map((goal) => (
                              <button
                                type="button"
                                key={goal.id}
                                onClick={() => {
                                  setCampaignGoal(goal.id)
                                  triggerHaptic(HapticPatterns.selection)
                                }}
                                className={cn(
                                  'flex flex-col items-start p-4 rounded-2xl border-2 transition-all gap-1 text-left group relative overflow-hidden',
                                  campaignGoal === goal.id
                                    ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.02]'
                                    : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:border-slate-200 hover:bg-white'
                                )}
                              >
                                <div className={cn(
                                  "p-2 rounded-xl transition-colors mb-2 shadow-sm",
                                  campaignGoal === goal.id ? "bg-white/20 text-white" : "bg-white text-slate-400 group-hover:text-slate-600"
                                )}>
                                  {React.cloneElement(goal.icon as React.ReactElement, { className: "h-5 w-5" })}
                                </div>
                                <span className="text-[13px] font-black tracking-tight leading-tight">{goal.label}</span>
                                <span className={cn(
                                  "text-[10px] font-medium leading-tight",
                                  campaignGoal === goal.id ? "text-white/60" : "text-slate-400"
                                )}>{goal.sub}</span>
                              </button>
                            ))}
                          </div>

                          {/* SMART UX LAYER: Contextual Hint */}
                          {campaignGoal && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                              {campaignGoal === 'Product Review / Unboxing' ? (
                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3">
                                  <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                                    <Package className="h-4 w-4" />
                                  </div>
                                  <p className="text-[12px] font-bold text-amber-900">
                                    Physical product must be shipped before creator starts.
                                  </p>
                                </div>
                              ) : (campaignGoal === 'App / Website Promotion' || campaignGoal === 'Performance Campaign') ? (
                                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                                  <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                                    <Rocket className="h-4 w-4" />
                                  </div>
                                  <p className="text-[12px] font-bold text-blue-900">
                                    Digital-first campaign. No physical product required.
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          )}

                          {errors.campaignGoal && (
                            <p className="mt-2 text-[11px] font-bold text-destructive animate-pulse">
                              {errors.campaignGoal}
                            </p>
                          )}
                        </div>

                        {/* Section 3: Barter Definition (Conditional Card) */}
                        {paymentType === 'barter' && (
                          <div id="barter-types-section" className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-xs">!</div>
                              <label className="text-[16px] font-black text-white tracking-tight">
                                Value you are offering
                              </label>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {BARTER_OPTIONS
                                .filter(option => !isBarterRestricted || option.id === 'product')
                                .map((option) => (
                                <button
                                  type="button"
                                  key={option.id}
                                  onClick={() => {
                                    if (barterTypes.includes(option.id)) {
                                      setBarterTypes(barterTypes.filter(t => t !== option.id))
                                    } else {
                                      setBarterTypes([...barterTypes, option.id])
                                    }
                                  }}
                                  className={cn(
                                    'flex items-center p-4 rounded-xl border-2 transition-all text-left group',
                                    barterTypes.includes(option.id)
                                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                                      : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
                                  )}
                                >
                                  <div className={cn(
                                    "w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors",
                                    barterTypes.includes(option.id) ? "bg-emerald-500 border-emerald-500" : "border-slate-600"
                                  )}>
                                    {barterTypes.includes(option.id) && <Check className="w-4 h-4 text-white" />}
                                  </div>
                                  <span className="text-[13px] font-bold">{option.label}</span>
                                </button>
                              ))}
                            </div>
                            
                            {barterTypes.length === 0 && (
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center pt-2">
                                Choose at least one to continue
                              </p>
                            )}
                          </div>
                        )}

                        {/* Section 4: The Brief (The Centerpiece) */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.05)] space-y-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs">03</div>
                              <label className="text-[16px] font-black text-slate-900 tracking-tight">
                                Campaign Brief
                              </label>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                triggerHaptic(HapticPatterns.success);
                                const base = campaignDescription.trim();
                                const isReel = deliverables.some(d => d.toLowerCase().includes('reel'));
                                const enhanced = `1 ${isReel ? 'Instagram Reel' : 'Video'} showcasing the product naturally with brand mention and tagging.\n\n• Length: ${contentDuration}\n• Key Highlights: Show product usage, tag @brand_handle\n• Style: Engaging and authentic\n• CTA: Link in bio / Check out now\n• No competitors in video`;
                                setCampaignDescription(enhanced);
                                toast.success("Brief professionally structured!");
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-tight hover:bg-emerald-100 transition-colors border border-emerald-100"
                            >
                              <Sparkles className="h-3 w-3" /> Improve my brief
                            </button>
                          </div>

                          <div className="relative group">
                            <Textarea
                              id="campaign-description-input"
                              value={campaignDescription}
                              onChange={e => setCampaignDescription(e.target.value)}
                              placeholder="Example:&#10;• 1 Instagram Reel (30–45 sec)&#10;• Show product usage naturally&#10;• Mention brand name in first 5 sec&#10;• Tag @brand_handle"
                              className="min-h-[180px] rounded-2xl border-slate-100 bg-slate-50/50 px-5 py-5 font-semibold text-[15px] text-slate-900 placeholder:text-slate-400 shadow-inner resize-none focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 transition-all leading-relaxed"
                            />
                            <div className="absolute bottom-5 right-5 opacity-20 pointer-events-none">
                              <PenLine className="h-6 w-6 text-slate-900" />
                            </div>
                          </div>
                          
                          {errors.campaignDescription && (
                            <p className="mt-2 text-[11px] font-bold text-destructive">
                              {errors.campaignDescription}
                            </p>
                          )}
                        </div>

                        {/* Section 5: Content Details (Quantities & Specifics) */}
                        <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-200 shadow-inner space-y-6">
                          <label className="block text-base font-black text-slate-800 flex items-center gap-2">
                            <Clapperboard className="h-5 w-5 text-slate-900" />
                            What content do you need?
                          </label>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {DELIVERABLE_OPTIONS.slice(0, 6)
                              .filter(option => !isBarterRestricted || option.label === 'Reel')
                              .map(option => {
                              const isSelected = deliverables.includes(option.value)
                              return (
                                <button
                                  type="button"
                                  key={option.value}
                                  onClick={() => {
                                    handleDeliverableToggle(option.value);
                                    triggerHaptic(HapticPatterns.selection);
                                  }}
                                  className={cn(
                                    "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-[12px] font-black transition-all border-2",
                                    isSelected 
                                      ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]' 
                                      : 'bg-white border-white text-slate-500 hover:border-slate-200 shadow-sm'
                                  )}
                                >
                                  {React.cloneElement(option.icon as React.ReactElement, { className: "h-5 w-5" })}
                                  {option.label}
                                </button>
                              )
                            })}
                          </div>

                          {/* Granular Settings for selected deliverables (e.g., Reel) */}
                          {deliverables.length > 0 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-5">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Content Quantity</span>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Recommended: 1-2</span>
                                  </div>
                                  <div className="flex gap-2">
                                    {(isBarterRestricted ? [1] : [1, 2, '3+'] as (number | '3+')[]).map(num => (
                                      <button 
                                        key={String(num)}
                                        type="button"
                                        onClick={() => { setContentQuantity(num); triggerHaptic(HapticPatterns.selection); }}
                                        className={cn(
                                          "flex-1 h-11 rounded-xl border font-bold text-sm transition-all active:scale-95",
                                          contentQuantity === num
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                            : 'bg-slate-50 border-slate-100 text-slate-900 hover:border-slate-900'
                                        )}
                                      >
                                        {num}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {deliverables.some(d => d.toLowerCase().includes('reel') || d.toLowerCase().includes('video')) && (
                                  <div className="space-y-3">
                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Duration</span>
                                    <div className="flex gap-2">
                                      {(isBarterRestricted ? ['15s'] : ['15s', '30s', '60s']).map(dur => (
                                        <button 
                                          key={dur}
                                          type="button"
                                          onClick={() => { setContentDuration(dur); triggerHaptic(HapticPatterns.selection); }}
                                          className={cn(
                                            "flex-1 h-11 rounded-xl border font-bold text-sm transition-all active:scale-95",
                                            contentDuration === dur
                                              ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                              : 'bg-slate-50 border-slate-100 text-slate-900 hover:border-slate-900'
                                          )}
                                        >
                                          {dur}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-3">
                                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Requirements</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {[
                                      { id: 'hook', label: 'Hook in first 3 sec' },
                                      { id: 'voiceover', label: 'Voiceover included' },
                                      { id: 'cta', label: 'Strong Call to Action' },
                                      { id: 'tag', label: 'Brand Tagging' },
                                    ].map(req => {
                                      const isChecked = contentRequirements.includes(req.id)
                                      return (
                                        <button
                                          key={req.id}
                                          type="button"
                                          onClick={() => {
                                            setContentRequirements(prev =>
                                              prev.includes(req.id) ? prev.filter(r => r !== req.id) : [...prev, req.id]
                                            )
                                            triggerHaptic(HapticPatterns.selection)
                                          }}
                                          className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                                            isChecked
                                              ? 'border-emerald-300 bg-emerald-50 text-slate-900'
                                              : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                                          )}
                                        >
                                          <div className={cn(
                                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                                            isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 bg-white'
                                          )}>
                                            {isChecked && <Check className="h-3.5 w-3.5 text-white" />}
                                          </div>
                                          <span className="text-[12px] font-bold">{req.label}</span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section 6: Deal Strength Indicator (The Intelligent Score) */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-black text-slate-900 tracking-tight">Deal Strength:</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star 
                                    key={star} 
                                    className={cn(
                                      "h-4 w-4 transition-all duration-500", 
                                      star <= (paymentType === 'paid' ? 4 : 3) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                    )} 
                                  />
                                ))}
                              </div>
                              <span className={cn(
                                "text-[12px] font-black ml-1",
                                paymentType === 'paid' ? "text-emerald-600" : "text-amber-600"
                              )}>
                                {paymentType === 'paid' ? 'STRONG OFFER' : 'FAIR VALUE'}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                              <div className={cn(
                                "h-full transition-all duration-1000 ease-out",
                                paymentType === 'paid' ? "bg-emerald-500 w-[85%]" : "bg-amber-500 w-[60%]"
                              )} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-slate-50">
                              {[
                                { cond: true, label: 'Clear deliverables' },
                                { cond: paymentType === 'paid', label: 'Cash payment' },
                                { cond: includesProduct, label: 'Product included' },
                                { cond: campaignDescription.length > 50, label: 'Detailed brief' },
                              ].map((item, idx) => (
                                <div key={idx} className={cn(
                                  "flex items-center gap-2 text-[11px] font-bold transition-all",
                                  item.cond ? "text-slate-700" : "text-slate-300"
                                )}>
                                  {item.cond ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <div className="w-3 h-3 rounded-full border border-slate-200" />
                                  )}
                                  {item.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Contact Details + Quick Info */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        {/* Contact Section */}
                        <div className="bg-slate-50 rounded-[24px] md:rounded-[32px] p-4 md:p-6 border border-slate-200 shadow-inner space-y-4">
                          <div className="flex items-center justify-between gap-1">
                            <p
                              className={`block text-[15px] font-black text-slate-800 ${typeLabel}`}
                            >
                              {useBrandProfile ? 'Using recognized brand' : 'Send your offer'}
                            </p>
                            {useBrandProfile && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider animate-in zoom-in-50 duration-300">
                                <CheckCircle2 className="h-3 w-3" />
                                Brand Recognized
                              </div>
                            )}
                          </div>

                          <div className="space-y-3.5">
                            <div className="relative group">
                              <label htmlFor="brand-email-input" className="sr-only">
                                Work email
                              </label>
                              <Input
                                id="brand-email-input"
                                type="email"
                                value={brandEmail}
                                onChange={e => setBrandEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                                enterKeyHint="done"
                                placeholder="your@company.com"
                                className={cn(
                                  "h-14 px-4 rounded-xl border-white bg-white font-bold text-base text-slate-900 placeholder:text-slate-500 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/30 transition-all",
                                  errors.brandEmail && "border-destructive ring-1 ring-destructive"
                                )}
                              />
                              {errors.brandEmail && (
                                <p className="mt-1 text-[11px] font-bold text-destructive">
                                  {errors.brandEmail}
                                </p>
                              )}
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {lookupStatus === 'loading' && (
                                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                )}
                                {lookupStatus === 'found' && (
                                  <div className="p-1 rounded-full bg-emerald-500 text-white animate-in zoom-in-75">
                                    <Check className="h-3 w-3" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Privacy Trust Badge */}
                            <div className="flex items-center gap-2 px-1">
                              <svg className="h-3 w-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                              <p className="text-[11px] font-bold text-slate-400">Your contact is shared only after creator accepts</p>
                            </div>

                            {lookupStatus === 'found' && lookupData && (
                              <div className="flex items-center gap-2 px-1 text-[11px] font-bold text-emerald-700 animate-in fade-in slide-in-from-top-1">
                                <Sparkles className="h-3 w-3" />
                                Recognized as {lookupData.brand_name}
                              </div>
                            )}

                            <div className="space-y-1">
                              <label htmlFor="brand-name-input" className="sr-only">
                                Brand name
                              </label>
                              <Input
                                id="brand-name-input"
                                value={brandName}
                                onChange={e => setBrandName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                                enterKeyHint="done"
                                placeholder="Brand or company name"
                                className={cn(
                                  "h-14 px-4 rounded-xl border-white bg-white font-bold text-base text-slate-900 placeholder:text-slate-500 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/30 transition-all",
                                  errors.brandName && "border-destructive ring-1 ring-destructive"
                                )}
                              />
                              {errors.brandName && (
                                <p className="mt-1 text-[11px] font-bold text-destructive">
                                  {errors.brandName}
                                </p>
                              )}
                            </div>

                            <label htmlFor="brand-instagram-input" className="sr-only">
                              Brand Instagram
                            </label>
                            <Input
                              id="brand-instagram-input"
                              value={brandInstagram}
                              onChange={e => setBrandInstagram(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                              enterKeyHint="done"
                              placeholder="@brand_instagram (optional)"
                              className="h-12 px-4 rounded-xl border-white bg-white font-semibold text-[14px] text-slate-900 placeholder:text-slate-500 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/30 transition-all"
                            />

                            {(useBrandProfile || lookupStatus === 'found') && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setUseBrandProfile(false)
                                  setLookupStatus('idle')
                                  setBrandName('')
                                  setBrandEmail('')
                                  setBrandLogoUrl('')
                                  setBrandInstagram('')
                                  toast.info('Form cleared')
                                }}
                                className="h-8 rounded-lg border-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-wider px-3 w-full border-dashed hover:bg-slate-100"
                              >
                                Not your brand? Use different details
                              </Button>
                            )}
                            {/* Brand Logo Upload */}
                            <div id="brand-logo-upload" className="pt-2">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                                  Brand Logo
                                </p>
                                {brandLogoUrl &&
                                  !isLogoUserUploaded &&
                                  !failedLogos.has(brandLogoUrl) && (
                                    <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Sparkles className="w-2.5 h-2.5" /> Auto-fetched
                                    </span>
                                  )}
                              </div>
                              {brandLogoUrl ? (
                                <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                                  <Avatar className="h-12 w-12 rounded-[14px] bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                                    <AvatarImage
                                      src={failedLogos.has(brandLogoUrl) ? undefined : brandLogoUrl}
                                      alt="Brand Logo"
                                      className="w-full h-full object-contain"
                                      referrerPolicy="no-referrer"
                                      onLoadingStatusChange={status => {
                                        if (status === 'error') {
                                          console.log(
                                            '[CollabLinkLanding] Logo failed to load:',
                                            brandLogoUrl
                                          )
                                          if (brandLogoUrl) {
                                            setFailedLogos(prev => {
                                              const next = new Set(prev)
                                              next.add(brandLogoUrl)
                                              return next
                                            })
                                          }
                                          // We keep brandLogoUrl as is for a moment so the initials can show,
                                          // but the blacklist will prevent further network attempts.
                                        }
                                      }}
                                    />
                                    <AvatarFallback className="bg-teal-50 text-teal-700 font-black text-xs">
                                      {brandName
                                        ? brandName
                                            .split(' ')
                                            .map(n => n[0])
                                            .join('')
                                            .toUpperCase()
                                            .slice(0, 2)
                                        : 'B'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="text-[13px] font-bold text-slate-900 leading-tight">
                                      Logo Ready
                                    </p>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      onClick={() => {
                                        setBrandLogoUrl('')
                                        setIsLogoUserUploaded(false)
                                      }}
                                      className="h-auto p-0 text-[11px] font-bold text-red-500 hover:text-red-600 hover:bg-transparent mt-1"
                                    >
                                      Change logo
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    disabled={brandLogoUploading}
                                  />
                                  <div
                                    className={cn(
                                      'w-full h-14 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all',
                                      errors.brandLogoUrl
                                        ? 'border-red-300 bg-red-50/50 text-red-600'
                                        : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 text-slate-600'
                                    )}
                                  >
                                    {brandLogoUploading ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <ImageIcon className="w-4 h-4" />
                                    )}
                                    <span className="text-[13px] font-bold">
                                      {brandLogoUploading ? 'Uploading...' : 'Upload brand logo'}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {errors.brandLogoUrl && (
                                <p className="text-red-500 text-[11px] font-bold mt-1.5 ml-1">
                                  {errors.brandLogoUrl}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>


                        {/* Product image / product details */}
                        {isProductImageRequired && (
                          <div id="barter-product-image-upload" className="bg-slate-50 rounded-[32px] p-6 border border-slate-200 shadow-inner space-y-4">
                            {(collabType === 'barter' || collabType === 'hybrid' || collabType === 'paid') && (
                              <>
                                <label
                                  htmlFor="barter-product-name-input"
                                  className={`block text-[15px] font-black text-slate-800 mb-2 ${typeLabel} flex items-center gap-2`}
                                >
                                  <Package className="h-5 w-5 text-slate-900" />
                                  Product name
                                </label>
                                <Input
                                  id="barter-product-name-input"
                                  value={barterProductName}
                                  onChange={e => setBarterProductName(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                                  enterKeyHint="done"
                                  placeholder="Product name you'll send"
                                  className={cn(
                                    "h-12 px-4 rounded-xl border-white bg-white font-bold text-[14px] text-slate-900 placeholder:text-slate-500 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/30",
                                    errors.barterProductName && "border-destructive ring-1 ring-destructive"
                                  )}
                                />
                                {errors.barterProductName && (
                                  <p className="mt-1 text-[11px] font-bold text-destructive">
                                    {errors.barterProductName}
                                  </p>
                                )}

                                <div className="space-y-2 pt-1">
                                  <label
                                    htmlFor="barter-value-input"
                                    className="block text-[11px] font-black uppercase tracking-widest text-slate-500"
                                  >
                                    Product Value (₹)
                                  </label>
                                  <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[14px] group-focus-within:text-slate-900 transition-colors">
                                      ₹
                                    </div>
                                    <Input
                                      id="barter-value-input"
                                      type="number"
                                      value={barterValue}
                                      onChange={e => setBarterValue(e.target.value)}
                                      onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                                      enterKeyHint="done"
                                      placeholder="Product's market price"
                                      className={cn(
                                        "h-12 pl-10 pr-4 rounded-xl border-white bg-white font-black text-[14px] text-slate-900 placeholder:text-slate-500 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/30",
                                        errors.budget && "border-destructive ring-1 ring-destructive"
                                      )}
                                    />
                                  </div>
                                  {errors.budget && paymentType === 'barter' && (
                                    <p className="mt-1 text-[11px] font-bold text-destructive">
                                      {errors.budget}
                                    </p>
                                  )}
                                </div>
                              </>
                            )}

                            <div>
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <p className="text-[12px] font-black uppercase tracking-widest text-slate-500">
                                  Product image
                                </p>
                                {barterProductImageUrl ? (
                                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Ready
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold text-slate-400">
                                    Required
                                  </span>
                                )}
                              </div>
                              <p className="mb-3 text-[12px] font-medium text-slate-500">
                                Upload a clear image or{' '}
                                <span className="font-bold text-slate-700">Paste (Ctrl+V)</span>{' '}
                                from clipboard.
                              </p>

                              {barterProductImageUrl ? (
                                <div className="space-y-3">
                                  <div className="relative group aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                                    <img
                                      src={barterProductImageUrl}
                                      alt="Product"
                                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <label className="flex items-center justify-center h-9 px-4 rounded-full bg-white text-slate-900 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors">
                                        Change
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={handleBarterImageChange}
                                          disabled={barterImageUploading}
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => setBarterProductImageUrl('')}
                                        className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <label
                                  className={cn(
                                    'flex items-center justify-center h-14 w-full rounded-2xl bg-white border-2 border-dashed text-[13px] font-black cursor-pointer active:scale-[0.99] transition-all',
                                    errors.barterProductImageUrl
                                      ? 'border-destructive text-destructive'
                                      : 'border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-slate-50',
                                    barterImageUploading && 'opacity-60 cursor-not-allowed'
                                  )}
                                >
                                  {barterImageUploading ? (
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="flex items-center gap-2">
                                        <Upload className="h-4 w-4" /> Add Product Image
                                      </div>
                                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                                        (Drag & Drop or Paste)
                                      </span>
                                    </div>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleBarterImageChange}
                                    disabled={barterImageUploading}
                                  />
                                </label>
                              )}

                              {errors.barterProductImageUrl && (
                                <p className="mt-2 text-[12px] font-bold text-destructive">
                                  {errors.barterProductImageUrl}
                                </p>
                              )}
                            </div>

                            {collabType === 'hybrid' && (
                              <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[15px] group-focus-within:text-slate-900 transition-colors">
                                  ₹
                                </div>
                                <Input
                                  id="hybrid-cash-amount-input"
                                  type="number"
                                  value={exactBudget}
                                  onChange={e => setExactBudget(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                                  enterKeyHint="done"
                                  placeholder="Plus cash amount"
                                  className="h-14 pl-10 pr-6 rounded-2xl border-white bg-white font-black text-[15px] text-slate-900 placeholder:text-slate-500 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/30 transition-all"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {collabType === 'paid' && (
                          <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-200 shadow-inner">
                            <label
                              htmlFor="budget-input"
                              className={`block text-[15px] font-black text-slate-800 mb-3 ${typeLabel} flex items-center gap-2`}
                            >
                              <Wallet className="h-5 w-5 text-slate-900" />
                              What's your budget?
                            </label>
                            <div className="space-y-4">
                              <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[15px] group-focus-within:text-slate-900 transition-colors">
                                  ₹
                                </div>
                                <Input
                                  id="budget-input"
                                  type="number"
                                  value={exactBudget}
                                  onChange={e => setExactBudget(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                                  enterKeyHint="done"
                                  placeholder="Amount (e.g. 5000)"
                                  className="h-14 pl-10 pr-6 rounded-2xl border-white bg-white font-black text-[15px] text-slate-900 placeholder:text-slate-500 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/30 transition-all"
                                />
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {[1000, 3000, 5000, 10000].map(amt => {
                                  const matchesPackage = localDealTemplates.some(
                                    t => t.budget === amt
                                  )
                                  return (
                                    <button
                                      key={amt}
                                      type="button"
                                      onClick={() => {
                                        setExactBudget(String(amt))
                                        triggerHaptic(HapticPatterns.light)
                                      }}
                                      className={cn(
                                        'px-3 py-1.5 rounded-lg border text-[11px] font-black transition-all active:scale-95',
                                        exactBudget === String(amt)
                                          ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105'
                                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                      )}
                                    >
                                      ₹{amt.toLocaleString('en-IN')}
                                    </button>
                                  )
                                })}
                              </div>
                              {selectedTemplate &&
                                String(selectedTemplate.budget) === exactBudget && (
                                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                                    <Sparkles className="h-3 w-3" />
                                    Matches '{selectedTemplate.label}' package price
                                  </p>
                                )}
                              {/* Budget Guidance Hint */}
                              {exactBudget && Number(exactBudget) > 0 && Number(exactBudget) < 3000 && (
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 animate-in fade-in slide-in-from-top-1 duration-200">
                                  <svg className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  <p className="text-[11px] font-bold text-amber-800">Creators are 4x more likely to accept offers above ₹3,000 — consider increasing your budget for better results.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-200 shadow-inner space-y-4">
                          <div>
                            <label
                              htmlFor="offer-deadline-input"
                              className={`block text-[15px] font-black text-slate-800 mb-3 ${typeLabel} flex items-center gap-2`}
                            >
                              <Calendar className="h-5 w-5 text-slate-900" />
                              Deadline
                            </label>
                            <div className="space-y-4">
                              <Input
                                id="offer-deadline-input"
                                type="date"
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                                className="h-14 rounded-2xl border-white bg-white px-4 font-bold text-[15px] text-slate-900 placeholder:text-slate-500 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                              />
                              <div className="flex items-center gap-2 flex-wrap">
                                {[
                                  { label: '+3 Days', days: 3 },
                                  { label: '+7 Days', days: 7 },
                                  { label: '+14 Days', days: 14 },
                                ].map(opt => (
                                  <button
                                    key={opt.label}
                                    type="button"
                                    onClick={() => {
                                      const d = new Date()
                                      d.setDate(d.getDate() + opt.days)
                                      setDeadline(d.toISOString().split('T')[0])
                                      triggerHaptic(HapticPatterns.light)
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition-all active:scale-95 shadow-sm"
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-[11px] font-bold text-emerald-700">Recommended: 5–7 days for best response rate</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                            <p className="text-[12px] font-semibold text-emerald-800 leading-snug">
                              Smart Suggestion: Creators typically respond 40% faster to offers with
                              product images and verified logos.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mobile sticky bottom CTA for the form */}
                    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white/95 to-transparent md:hidden border-t border-slate-100/50 backdrop-blur-sm">
                      <div className="max-w-lg mx-auto">
                        {currentStep < 2 ? (
                          <>
                            <Button
                              onClick={() => {
                                let canProceed = false
                                if (currentStep === 1) {
                                  if (!collabType) {
                                    toast.error('Please select collaboration type first')
                                    return
                                  }
                                  if (selectedTemplateId) {
                                    if (deliverables.length === 0) {
                                      toast.error('Please select at least one deliverable')
                                      return
                                    }
                                  } else {
                                    if (campaignDescription.trim().length < 10) {
                                      toast.error('Please describe your idea (min 10 characters)')
                                      return
                                    }
                                  }
                                  canProceed = true
                                }

                                if (canProceed) {
                                  setCurrentStep(currentStep + 1)
                                  triggerHaptic(HapticPatterns.success)
                                  window.scrollTo({ top: 0, behavior: 'smooth' })
                                }
                              }}
                              className="h-14 w-full rounded-2xl bg-slate-900 border-2 border-slate-900 text-white hover:bg-slate-800 hover:border-slate-800 font-black text-base shadow-xl active:scale-[0.98] transition-all"
                            >
                              Continue to Details
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <p className="text-center text-[11px] font-bold text-slate-400 tracking-wide">
                              You're creating a{' '}
                              <span className={paymentType === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>
                                {paymentType === 'paid' ? (includesProduct ? 'Paid + Product' : 'Paid') : 'Barter'} collaboration
                              </span>
                            </p>
                          </>
                        ) : (
                          <div className="flex flex-col gap-2.5">
                            {!(selectedTemplate && currentStep === 2) && (
                              <Button
                                onClick={() => {
                                  if (currentStep === 1) {
                                    setShowCustomFlow(false)
                                  } else {
                                    setCurrentStep(currentStep - 1)
                                  }
                                  triggerHaptic(HapticPatterns.light)
                                }}
                                variant="outline"
                                className="h-12 w-full rounded-2xl border-slate-200 text-slate-500 font-black text-base hover:bg-slate-50"
                              >
                                Back
                              </Button>
                            )}
                            <Button
                              onClick={handleSubmit}
                              disabled={submitting}
                              className={cn(
                                'h-14 w-full rounded-2xl font-black text-base shadow-xl active:scale-[0.98] transition-all border-2',
                                isStep2Ready
                                  ? 'bg-[#0FA47F] border-[#0FA47F] text-white hover:bg-emerald-600 hover:border-emerald-600'
                                  : 'bg-slate-200 border-slate-200 text-slate-500 hover:bg-slate-300 hover:border-slate-300'
                              )}
                            >
                              <span className="flex items-center justify-center gap-2">
                                {submitting ? (
                                  <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-5 w-5" />
                                    {isStep2Ready ? 'Send Offer Now' : 'Complete details to send'}
                                  </>
                                )}
                              </span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop navigation only */}
                    <div className="hidden md:block mt-8">
                      {currentStep === 2 && isStep2Ready && (
                        <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-700">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Ready to send
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {!(selectedTemplate && currentStep === 2) && (
                          <Button
                            onClick={() => {
                              if (currentStep === 1) {
                                setShowCustomFlow(false)
                              } else {
                                setCurrentStep(currentStep - 1)
                              }
                              triggerHaptic(HapticPatterns.light)
                            }}
                            variant="outline"
                            className="h-14 rounded-full border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest hover:border-slate-800 hover:text-slate-900 transition-all active:scale-95"
                          >
                            {currentStep === 1 ? 'Go Back' : 'Back'}
                          </Button>
                        )}

                        {currentStep < 2 ? (
                          <Button
                            onClick={() => {
                              let canProceed = false
                              if (currentStep === 1) {
                                if (!collabType) {
                                  toast.error('Please select collaboration type first')
                                  return
                                }
                                if (selectedTemplateId) {
                                  if (deliverables.length === 0) {
                                    toast.error('Please select at least one deliverable')
                                    return
                                  }
                                } else {
                                  if (campaignDescription.trim().length < 10) {
                                    toast.error('Please describe your idea (min 10 characters)')
                                    return
                                  }
                                }
                                canProceed = true
                              }

                              if (canProceed) {
                                setCurrentStep(currentStep + 1)
                                triggerHaptic(HapticPatterns.success)
                                scrollOfferFormIntoView()
                              }
                            }}
                            className="h-14 rounded-full bg-[#0FA47F] border-2 border-[#0FA47F] text-white hover:bg-emerald-600 hover:border-emerald-600 font-black text-xs uppercase tracking-widest transition-all shadow-[0_14px_34px_rgba(15,164,127,0.22)] flex-1 active:scale-98"
                          >
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="flex flex-col gap-3 w-full">
                            <Button
                              onClick={handleSubmit}
                              disabled={submitting}
                              className="h-14 w-full min-w-0 rounded-full bg-[#0FA47F] border-2 border-[#0FA47F] text-white hover:bg-emerald-600 hover:border-emerald-600 font-black text-xs uppercase tracking-widest transition-all shadow-[0_14px_34px_rgba(15,164,127,0.22)] active:scale-95 group relative overflow-hidden"
                            >
                              <span className="flex items-center justify-center gap-2">
                                {submitting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4" />
                                    {isStep2Ready ? 'Send Offer' : 'Add product image'}
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                  </>
                                )}
                              </span>
                            </Button>
                          </div>
                        )}
                      </div>
                      {currentStep === 2 && (
                        <p className="mt-2 text-[11px] font-semibold text-slate-500 text-center">
                          Creator will be notified instantly
                        </p>
                      )}
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
                      <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Lock className="h-3 w-3" />
                        Secure & private
                      </div>

                      {currentStep < 2 && (
                        <Button
                          onClick={handleStickySubmit}
                          className="hidden md:flex w-auto h-12 px-8 rounded-2xl bg-slate-100 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                          Next Step: Step {currentStep + 1}
                        </Button>
                      )}
                    </div>

                    {/* Demo Fill Button */}
                    {/* Demo Fill Button */}
                    {import.meta.env.DEV && (
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={fillDemoData}
                          className="text-[10px] text-slate-200 hover:text-slate-300 font-bold uppercase tracking-widest"
                        >
                          Fill demo data
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>{' '}
              {/* END core-offer-form */}
            </div>{' '}
            {/* END RIGHT COLUMN */}
          </div>{' '}
          {/* END flex-row container */}
          <div className="md:hidden h-36" />
          {isOwner && !previewAsBrand && hasIncompleteSetup && (
            <div className="fixed right-4 bottom-24 z-50 md:hidden">
              <button
                type="button"
                onClick={() => {
                  if (!editMode) setEditMode(true)
                  scrollToSetupSection()
                }}
                className="flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-2.5 shadow-[0_10px_24px_rgba(16,185,129,0.35)] hover:bg-emerald-700 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Complete Setup ({effectiveSetupChecklist.length - setupCompletedCount} left)
                </span>
              </button>
            </div>
          )}
          <div className="px-4">
            {/* Save and continue later modal */}
            <Dialog open={showSaveDraftModal} onOpenChange={setShowSaveDraftModal}>
              <DialogContent className="bg-slate-900/95 border-white/20 text-white">
                <DialogHeader>
                  <DialogTitle>Save and continue later</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-slate-100/85">
                  Enter your email. We&apos;ll send you a link to continue this request (valid for 7
                  days).
                </p>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={draftEmail}
                  onChange={e => setDraftEmail(e.target.value)}
                  className={inputClass}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSaveDraftModal(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveDraftSubmit}
                    disabled={saveDraftSubmitting}
                    className="bg-white text-black hover:bg-slate-200 text-white"
                  >
                    {saveDraftSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Sending…
                      </>
                    ) : (
                      'Send link'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {/* Sticky Bottom CTA (mobile compact) */}
          {!(showCustomFlow && currentStep === 2) && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pt-2.5 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-md border-t border-slate-100">
              <div className="relative">
                {isCoreReady && !hasStartedOffer && (
                  <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl border border-teal-300/30 animate-ping" />
                )}
                <Button
                  onClick={
                      !showCustomFlow
                      ? () => {
                          if (selectedTemplate) {
                            setShowCustomFlow(true)
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                            triggerHaptic(HapticPatterns.success)
                            return
                          }
                          // First-time brands want the fastest path: open the minimal custom offer form immediately.
                          jumpToOfferForm({ openCustom: true })
                          triggerHaptic(HapticPatterns.success)
                        }
                      : handleStickySubmit
                  }
                  disabled={
                    submitting ||
                    (showCustomFlow && currentStep === 2 && hasStartedOffer && !brandEmail.trim())
                  }
                  className={[
                    'w-full rounded-2xl font-black active:scale-[0.98] transition-all duration-300',
                    !showCustomFlow
                      ? 'h-14 bg-[#0FA47F] text-white shadow-[0_10px_34px_rgba(15,164,127,0.24)] border border-emerald-500/20'
                      : 'h-16 bg-[#0FA47F] text-white shadow-[0_10px_34px_rgba(15,164,127,0.28)] border-t border-white/20',
                  ].join(' ')}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                      Finalizing Security...
                    </span>
                  ) : !showCustomFlow ? (
                    selectedTemplate ? (
                      <span className="w-full flex flex-col items-center justify-center leading-tight">
                        <span className="text-[12px] font-black">
                          Chosen service —{' '}
                          {selectedTemplate.type === 'barter'
                            ? 'Free products as payment'
                            : `₹${selectedTemplate.budget.toLocaleString('en-IN')}`}
                        </span>
                        <span className="mt-1 text-[12px] font-black uppercase tracking-widest flex items-center gap-2">
                          Continue to Offer
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 text-[13px] uppercase tracking-widest">
                        Send Offer
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )
                  ) : currentStep === 2 && hasStartedOffer ? (
                    <span className="flex items-center justify-center gap-2 text-[13px] uppercase tracking-widest">
                      Send Offer
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2 text-[13px] uppercase tracking-widest">
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </div>
              <p className="text-center text-[10px] font-semibold text-slate-500 mt-1.5">
                {showSubmittingTrust
                  ? 'Your offer is being processed securely'
                  : '50+ brands have collaborated through CreatorArmour'}
              </p>
              {showSubmittingTrust && (
                <div className="mt-2 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  {submittingChecklist.map((step, idx) => {
                    const complete = idx <= submitChecklistStep
                    return (
                      <div
                        key={step}
                        className={`flex items-center gap-2 text-xs transition-all duration-200 ${complete ? 'text-emerald-700 opacity-100 translate-y-0' : 'text-slate-400 opacity-70 translate-y-0.5'}`}
                      >
                        <CheckCircle2
                          className={`h-3.5 w-3.5 ${complete ? 'text-emerald-500' : 'text-slate-300'}`}
                        />
                        <span>{step}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Deal Template Modal */}
      {editingTemplate && (
        <EditDealTemplateModal
          template={editingTemplate!}
          onSave={handleUpdateTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </>
  )
}

// Component helper for editing templates
const EditDealTemplateModal = ({
  template,
  onSave,
  onClose,
}: {
  template: DealTemplate
  onSave: (updated: DealTemplate) => void
  onClose: () => void
}) => {
  const [edited, setEdited] = useState<DealTemplate>({ ...template })

  const handleDeliverableToggleModal = (val: string) => {
    setEdited(prev => {
      const isSelected = prev.deliverables.includes(val)
      if (isSelected) {
        if (prev.deliverables.length <= 1) {
          toast.error('Your Services must have at least 1 deliverable.')
          return prev
        }
        return {
          ...prev,
          deliverables: prev.deliverables.filter(d => d !== val),
        }
      } else {
        return {
          ...prev,
          deliverables: [...prev.deliverables, val],
          quantities: { ...prev.quantities, [val]: 1 },
        }
      }
    })
  }

  const updateDeliverableQuantityModal = (val: string, qty: number) => {
    if (qty < 1) return
    setEdited(prev => ({
      ...prev,
      quantities: { ...prev.quantities, [val]: qty },
    }))
  }

  const handleAddAddon = () => {
    setEdited(prev => ({
      ...prev,
      addons: [...(prev.addons || []), { id: `addon_${Date.now()}`, label: '', price: 0 }],
    }))
  }

  const handleUpdateAddon = (index: number, update: Partial<{ label: string; price: number }>) => {
    setEdited(prev => {
      const addons = [...(prev.addons || [])]
      addons[index] = { ...addons[index], ...update }
      return { ...prev, addons }
    })
  }

  const handleRemoveAddon = (index: number) => {
    setEdited(prev => {
      const addons = [...(prev.addons || [])]
      addons.splice(index, 1)
      return { ...prev, addons }
    })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[32px] p-6 bg-white border-none shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
        <DialogHeader className="pt-2">
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="text-2xl">{edited.icon}</span>
            Edit Service
          </DialogTitle>
          <p className="text-xs text-slate-500 font-medium tracking-tight">
            Set your service details so brands can choose faster.
          </p>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">
              Service Name
            </label>
            <Input
              value={edited.label}
              onChange={e => setEdited({ ...edited, label: e.target.value })}
              className="rounded-2xl border-slate-200 bg-slate-50 h-12 font-bold focus:bg-white transition-all"
              placeholder="e.g. Pro Reel Package"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1 flex justify-between">
              Deliverables Included
              <span className="text-[9px] text-slate-300">Required</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DELIVERABLE_OPTIONS.filter(o => o.value !== 'Custom').map(opt => {
                const isSelected = edited.deliverables.includes(opt.value)
                return (
                  <div
                    key={opt.value}
                    className={`border rounded-xl p-2 flex items-center justify-between transition-colors ${isSelected ? 'border-teal-500 bg-teal-50/30' : 'border-slate-100 bg-slate-50'}`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer text-[12px] font-bold text-slate-700 w-full">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleDeliverableToggleModal(opt.value)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 bg-white"
                      />
                      {opt.label}
                    </label>
                    {isSelected && (
                      <div className="flex items-center gap-1.5 shrink-0 bg-white rounded-lg border border-slate-200 px-1 py-0.5 shadow-sm">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            updateDeliverableQuantityModal(
                              opt.value,
                              (edited.quantities[opt.value] || 1) - 1
                            )
                          }
                          className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center font-bold text-slate-500 transition-colors"
                        >
                          −
                        </button>
                        <span className="text-[12px] font-black w-3 text-center text-slate-800">
                          {edited.quantities[opt.value] || 1}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            updateDeliverableQuantityModal(
                              opt.value,
                              (edited.quantities[opt.value] || 1) + 1
                            )
                          }
                          className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center font-bold text-slate-500 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">
                Deal Type
              </label>
              <Select
                value={edited.type}
                onValueChange={(v: any) => setEdited({ ...edited, type: v })}
              >
                <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50 h-12 font-bold focus:bg-white transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="paid" className="rounded-xl font-bold">
                    💰 Paid
                  </SelectItem>
                  <SelectItem value="barter" className="rounded-xl font-bold">
                    📦 Free products as payment
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">
                {edited.type === 'paid' ? 'Price (₹)' : 'Value (₹)'}
              </label>
              <Input
                type="number"
                value={edited.budget}
                onChange={e => setEdited({ ...edited, budget: Number(e.target.value) })}
                className="rounded-2xl border-slate-200 bg-slate-50 h-12 font-black text-teal-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">
              Delivery Time
            </label>
            <div className="relative">
              <Input
                type="number"
                value={edited.deadlineDays || ''}
                onChange={e => setEdited({ ...edited, deadlineDays: Number(e.target.value) })}
                placeholder="e.g. 7"
                className="rounded-2xl border-slate-200 bg-slate-50 h-12 font-bold focus:bg-white transition-all pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400 pointer-events-none">
                Days
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1 flex justify-between">
              Package Description
              <span className="text-[9px] text-slate-300 normal-case">
                {edited.description?.length || 0}/120
              </span>
            </label>
            <Textarea
              maxLength={120}
              value={edited.description}
              onChange={e => setEdited({ ...edited, description: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
              enterKeyHint="done"
              placeholder="e.g. Best for product launches. Includes 1 reel + 2 story mentions."
              className="rounded-2xl border-slate-200 bg-slate-50 min-h-[80px] font-medium focus:bg-white transition-all py-3 px-4 resize-none"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">
                Optional Add-ons
              </label>
              <button
                type="button"
                onClick={handleAddAddon}
                className="flex items-center gap-1 text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-1 rounded hover:bg-teal-100 transition-colors"
              >
                <span className="text-xl leading-none -mt-0.5">+</span> Add Item
              </button>
            </div>
            {edited.addons?.map((addon, index) => (
              <div
                key={addon.id}
                className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100"
              >
                <Input
                  className="flex-1 rounded-lg border-slate-200 bg-white h-10 font-bold focus:bg-white transition-all text-[12px]"
                  placeholder="e.g. + Extra Story"
                  value={addon.label}
                  onChange={e => handleUpdateAddon(index, { label: e.target.value })}
                />
                <div className="relative w-24 shrink-0">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[11px]">
                    ₹
                  </span>
                  <Input
                    type="number"
                    className="w-full rounded-lg border-slate-200 bg-white h-10 font-black text-teal-600 focus:bg-white transition-all pl-6 text-[12px]"
                    placeholder="200"
                    value={addon.price || ''}
                    onChange={e => handleUpdateAddon(index, { price: Number(e.target.value) })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAddon(index)}
                  className="p-2.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="Remove add-on"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            {(!edited.addons || edited.addons.length === 0) && (
              <p className="text-[10px] font-bold text-slate-400 italic text-center py-2">
                No add-ons created. Offer extras to clear upsell deals.
              </p>
            )}
          </div>

          <div className="py-2 pt-4 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer bg-amber-50/50 hover:bg-amber-50 p-3 rounded-xl border border-amber-100 transition-colors">
              <input
                type="checkbox"
                checked={edited.isPopular || false}
                onChange={e => {
                  // Update current logic for exclusive highlight marking if necessary, or just mark this.
                  // We'll trust the parent to handle exclusivity if needed, or we just rely on state.
                  setEdited({ ...edited, isPopular: e.target.checked })
                }}
                className="rounded border-amber-300 text-[#FFA000] focus:ring-[#FFA000] h-4 w-4"
              />
              <span className="text-[13px] font-bold text-amber-700 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                Mark as most popular
              </span>
            </label>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-full font-black text-slate-400 text-xs uppercase tracking-widest h-11 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSave(edited)}
            className="flex-1 rounded-full bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest h-11 shadow-xl active:scale-[0.98] transition-all"
          >
            Update Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CollabLinkLanding
