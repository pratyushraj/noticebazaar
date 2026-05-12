# D2C Creator Outreach Strategy 🚀

## Overview
Creator Armour has pivoted to a **"Creator Supply Layer"** model. Instead of a traditional influencer agency, we position ourselves as a leaner, performance-oriented source for **UGC (User Generated Content)** and **Ad Creatives**.

## Target Audience: D2C Brands
We target high-growth D2C brands in India that require a constant stream of fresh content for Meta/Google ads.
- **Top Categories**: Skincare, Beauty, Fashion, Wellness, Home Decor, and Food/Snacks.

## Outreach Engine (`BrandOutreachService.ts`)
We use an automated, low-volume (10/day) outreach system via Resend to ensure high deliverability and personal touch.

### Key Features:
- **Founder-Led Tone**: Emails are sent from "Pratyush from Creator Armour" to build trust.
- **High-Deliverability Template**: Minimalist, "Plain Text" style HTML to bypass spam filters and land in the Primary Tab.
- **Dynamic Personalization**: Every email automatically adapts the Brand Name, Niche, and generates a pre-filtered discovery link.
- **Reply-To Routing**: All brand replies are routed directly to `creatorarmour07@gmail.com` for manual closing.

## Database Infrastructure
- `brand_leads`: Tracks outreach status, brand details, and engagement metrics.
- `profiles`: Enhanced with UGC-specific fields (`ugc_capabilities`, `delivery_speed_days`, `has_home_studio`).

## Positioning
> "We don't sell followers; we sell high-engagement micro-creators who create authentic, conversion-friendly content."

---
*Last Updated: 2026-05-11*
