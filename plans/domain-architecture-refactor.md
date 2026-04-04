# Creator Armour Domain-Based Architecture Refactor Plan

**Version:** 1.0.0  
**Date:** March 31, 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Domain Definitions](#2-domain-definitions)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Context Refactor Plan](#5-context-refactor-plan)
6. [Component Breakdown Strategy](#6-component-breakdown-strategy)
7. [Route Reorganization](#7-route-reorganization)
8. [Service Reorganization](#8-service-reorganization)
9. [Zod Validation Implementation](#9-zod-validation-implementation)
10. [Background Job System](#10-background-job-system)
11. [Migration Plan](#11-migration-plan)
12. [Step-by-Step Refactor Order](#12-step-by-step-refactor-order)
13. [Risk Mitigation](#13-risk-mitigation)

---

## 1. Executive Summary

This document outlines a gradual, non-breaking refactor of the Creator Armour codebase from a feature-based structure to a domain-driven architecture. The refactor will be executed in phases over multiple sprints, ensuring continuous product functionality.

### Goals
- Reduce component complexity and improve maintainability
- Establish clear domain boundaries
- Enable parallel development across teams
- Improve testability and code organization
- Add type-safe validation and background processing

### Constraints
- **No breaking changes** to deal workflow, onboarding, payments, or dashboards
- **Gradual migration** - old and new code must coexist during transition
- **Continuous deployment** - no long-lived feature branches

---

## 2. Domain Definitions

### Domain Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     Creator Armour Domains                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    AUTH     │  │  PROFILES   │  │  STOREFRONT │             │
│  │             │  │             │  │             │             │
│  │ - Login     │  │ - Creator   │  │ - Collab    │             │
│  │ - Signup    │  │ - Brand     │  │   Links     │             │
│  │ - OAuth     │  │ - Settings  │  │ - Packages  │             │
│  │ - Sessions  │  │ - Onboarding│  │ - Media Kit │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   DEALS     │  │  CONTRACTS  │  │DELIVERABLES │             │
│  │             │  │             │  │             │             │
│  │ - Collab    │  │ - Generator │  │ - Tracking  │             │
│  │   Requests  │  │ - Analyzer  │  │ - Shipping  │             │
│  │ - Negotiate │  │ - Signing   │  │ - Delivery  │             │
│  │ - Accept/   │  │ - Templates │  │ - Proof     │             │
│  │   Decline   │  │ - PDF/DOCX  │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  PAYMENTS   │  │  INVOICES   │  │  MESSAGES   │             │
│  │             │  │             │  │             │             │
│  │ - Reminders │  │ - Generate  │  │ - Chat      │             │
│  │ - Tracking  │  │ - Send      │  │ - Threads   │             │
│  │ - Recovery  │  │ - Templates │  │ - Brands    │             │
│  │ - Payouts   │  │ - GST       │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │NOTIFICATIONS│  │  ANALYTICS  │  │   ADMIN     │             │
│  │             │  │             │  │             │             │
│  │ - Push      │  │ - Dashboard │  │ - Users     │             │
│  │ - Email     │  │ - Reports   │  │ - Deals     │             │
│  │ - SMS/WhatsApp│ - Tracking  │  │ - Support   │             │
│  │ - In-App    │  │ - Export    │  │ - Audit     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Domain Responsibilities

| Domain | Responsibilities | Key Entities |
|--------|-----------------|--------------|
| **auth** | Authentication, authorization, sessions, OAuth, magic links | User, Session, Token |
| **profiles** | User profiles, settings, onboarding, verification | Profile, CreatorProfile, BrandProfile |
| **storefront** | Public creator pages, collab links, packages, media kits | Storefront, Package, MediaKit |
| **deals** | Collaboration requests, negotiations, deal lifecycle | Deal, CollabRequest, Offer |
| **contracts** | Contract generation, analysis, signing, templates | Contract, Template, Signature |
| **deliverables** | Content delivery, shipping, proof of work | Deliverable, Shipment, Proof |
| **payments** | Payment tracking, reminders, recovery, payouts | Payment, Reminder, Payout |
| **invoices** | Invoice generation, GST compliance, templates | Invoice, InvoiceItem, Tax |
| **messages** | Real-time chat, threads, brand communication | Message, Thread, Conversation |
| **notifications** | Push, email, SMS, in-app notifications | Notification, Preference, Template |
| **analytics** | Dashboards, reports, tracking, exports | Metric, Report, Event |
| **admin** | User management, support, audit logs, system config | AdminAction, AuditLog, Config |

---

## 3. Frontend Architecture

### Current Structure
```
src/
├── app/
├── components/
├── contexts/
├── hooks/
├── lib/
├── pages/
├── types/
└── utils/
```

### Target Structure
```
src/
├── app/                          # Application bootstrap
│   ├── AppRoutes.tsx
│   ├── App.tsx
│   └── providers/
│       ├── index.tsx
│       ├── QueryProvider.tsx
│       └── RouterProvider.tsx
│
├── domains/                      # Domain-based modules
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── OAuthButton.tsx
│   │   │   └── MagicLinkForm.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useOAuth.ts
│   │   │   └── useSession.ts
│   │   ├── api/
│   │   │   └── authApi.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   └── index.ts
│   │
│   ├── profiles/
│   │   ├── components/
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── ProfileAvatar.tsx
│   │   │   ├── ProfileSettings.tsx
│   │   │   └── onboarding/
│   │   │       ├── OnboardingFlow.tsx
│   │   │       ├── OnboardingStep.tsx
│   │   │       └── OnboardingProgress.tsx
│   │   ├── contexts/
│   │   │   ├── ProfileContext.tsx
│   │   │   └── OnboardingContext.tsx
│   │   ├── hooks/
│   │   │   ├── useProfile.ts
│   │   │   ├── useOnboarding.ts
│   │   │   └── useProfileCompletion.ts
│   │   ├── api/
│   │   │   └── profileApi.ts
│   │   ├── types/
│   │   │   └── profile.types.ts
│   │   └── index.ts
│   │
│   ├── storefront/
│   │   ├── components/
│   │   │   ├── StorefrontPage.tsx
│   │   │   ├── CollabLinkLanding.tsx
│   │   │   ├── PackageCard.tsx
│   │   │   ├── MediaKitSection.tsx
│   │   │   └── TrustSignals.tsx
│   │   ├── hooks/
│   │   │   ├── useStorefront.ts
│   │   │   └── useCollabLink.ts
│   │   ├── api/
│   │   │   └── storefrontApi.ts
│   │   ├── types/
│   │   │   └── storefront.types.ts
│   │   └── index.ts
│   │
│   ├── deals/
│   │   ├── components/
│   │   │   ├── DealCard.tsx
│   │   │   ├── DealList.tsx
│   │   │   ├── DealTimeline.tsx
│   │   │   ├── CollabRequestForm.tsx
│   │   │   ├── NegotiationPanel.tsx
│   │   │   └── DealActions.tsx
│   │   ├── contexts/
│   │   │   └── DealContext.tsx
│   │   ├── hooks/
│   │   │   ├── useDeals.ts
│   │   │   ├── useDeal.ts
│   │   │   ├── useCollabRequest.ts
│   │   │   └── useNegotiation.ts
│   │   ├── api/
│   │   │   └── dealsApi.ts
│   │   ├── types/
│   │   │   └── deals.types.ts
│   │   └── index.ts
│   │
│   ├── contracts/
│   │   ├── components/
│   │   │   ├── ContractGenerator.tsx
│   │   │   ├── ContractAnalyzer.tsx
│   │   │   ├── ContractSigner.tsx
│   │   │   ├── ContractPreview.tsx
│   │   │   └── ContractUpload.tsx
│   │   ├── hooks/
│   │   │   ├── useContract.ts
│   │   │   ├── useContractAnalysis.ts
│   │   │   └── useContractSigning.ts
│   │   ├── api/
│   │   │   └── contractsApi.ts
│   │   ├── types/
│   │   │   └── contracts.types.ts
│   │   └── index.ts
│   │
│   ├── deliverables/
│   │   ├── components/
│   │   │   ├── DeliverableTracker.tsx
│   │   │   ├── ShippingForm.tsx
│   │   │   ├── ProofUpload.tsx
│   │   │   └── DeliveryStatus.tsx
│   │   ├── hooks/
│   │   │   ├── useDeliverables.ts
│   │   │   └── useShipping.ts
│   │   ├── api/
│   │   │   └── deliverablesApi.ts
│   │   ├── types/
│   │   │   └── deliverables.types.ts
│   │   └── index.ts
│   │
│   ├── payments/
│   │   ├── components/
│   │   │   ├── PaymentTracker.tsx
│   │   │   ├── PaymentReminder.tsx
│   │   │   ├── PayoutForm.tsx
│   │   │   └── RecoveryStatus.tsx
│   │   ├── hooks/
│   │   │   ├── usePayments.ts
│   │   │   └── usePaymentReminders.ts
│   │   ├── api/
│   │   │   └── paymentsApi.ts
│   │   ├── types/
│   │   │   └── payments.types.ts
│   │   └── index.ts
│   │
│   ├── invoices/
│   │   ├── components/
│   │   │   ├── InvoiceGenerator.tsx
│   │   │   ├── InvoicePreview.tsx
│   │   │   └── GSTDetails.tsx
│   │   ├── hooks/
│   │   │   ├── useInvoices.ts
│   │   │   └── useInvoiceGeneration.ts
│   │   ├── api/
│   │   │   └── invoicesApi.ts
│   │   ├── types/
│   │   │   └── invoices.types.ts
│   │   └── index.ts
│   │
│   ├── messages/
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── ThreadView.tsx
│   │   ├── hooks/
│   │   │   ├── useMessages.ts
│   │   │   ├── useConversations.ts
│   │   │   └── useRealtimeMessages.ts
│   │   ├── api/
│   │   │   └── messagesApi.ts
│   │   ├── types/
│   │   │   └── messages.types.ts
│   │   └── index.ts
│   │
│   ├── notifications/
│   │   ├── components/
│   │   │   ├── NotificationCenter.tsx
│   │   │   ├── NotificationItem.tsx
│   │   │   └── NotificationPreferences.tsx
│   │   ├── hooks/
│   │   │   ├── useNotifications.ts
│   │   │   └── usePushNotifications.ts
│   │   ├── api/
│   │   │   └── notificationsApi.ts
│   │   ├── types/
│   │   │   └── notifications.types.ts
│   │   └── index.ts
│   │
│   ├── analytics/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── Chart.tsx
│   │   │   └── ReportExport.tsx
│   │   ├── hooks/
│   │   │   ├── useAnalytics.ts
│   │   │   └── useMetrics.ts
│   │   ├── api/
│   │   │   └── analyticsApi.ts
│   │   ├── types/
│   │   │   └── analytics.types.ts
│   │   └── index.ts
│   │
│   └── admin/
│       ├── components/
│       │   ├── UserManagement.tsx
│       │   ├── DealOverview.tsx
│       │   ├── SupportQueue.tsx
│       │   └── AuditLog.tsx
│       ├── hooks/
│       │   ├── useAdminUsers.ts
│       │   └── useAuditLog.ts
│       ├── api/
│       │   └── adminApi.ts
│       ├── types/
│       │   └── admin.types.ts
│       └── index.ts
│
├── shared/                       # Shared utilities and components
│   ├── components/
│   │   ├── ui/                   # Shadcn components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── forms/
│   │   │   ├── FormField.tsx
│   │   │   ├── Select.tsx
│   │   │   └── DatePicker.tsx
│   │   ├── feedback/
│   │   │   ├── Toast.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── Loading.tsx
│   │   └── empty-states/
│   │       └── EmptyState.tsx
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useToast.ts
│   │   ├── useNetworkStatus.ts
│   │   └── useKeyboardShortcuts.ts
│   ├── lib/
│   │   ├── api/
│   │   │   ├── apiClient.ts
│   │   │   ├── queryClient.ts
│   │   │   └── supabase.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── helpers.ts
│   │   └── constants/
│   │       ├── routes.ts
│   │       └── config.ts
│   └── types/
│       ├── common.types.ts
│       └── api.types.ts
│
├── pages/                        # Page components (route targets)
│   ├── public/
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── AboutPage.tsx
│   │   └── BlogPage.tsx
│   ├── creator/
│   │   ├── CreatorDashboardPage.tsx
│   │   ├── CreatorDealsPage.tsx
│   │   ├── CreatorContractsPage.tsx
│   │   ├── CreatorPaymentsPage.tsx
│   │   └── CreatorSettingsPage.tsx
│   ├── brand/
│   │   ├── BrandDashboardPage.tsx
│   │   ├── BrandDealsPage.tsx
│   │   └── BrandSettingsPage.tsx
│   └── admin/
│       ├── AdminDashboardPage.tsx
│       └── AdminUsersPage.tsx
│
├── styles/
│   └── globals.css
│
└── main.tsx
```

### Key Principles

1. **Domain Isolation**: Each domain is self-contained with its own components, hooks, API, and types
2. **Shared Layer**: Common components and utilities live in `shared/`
3. **Page Composition**: Pages compose domain components; they don't contain business logic
4. **Barrel Exports**: Each domain has an `index.ts` for clean imports

---

## 4. Backend Architecture

### Current Structure
```
server/src/
├── routes/
├── services/
├── middleware/
├── types/
└── index.ts
```

### Target Structure
```
server/
├── src/
│   ├── index.ts                  # App entry point
│   ├── app.ts                    # Express app configuration
│   │
│   ├── domains/                  # Domain-based modules
│   │   ├── auth/
│   │   │   ├── routes.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   ├── schemas.ts        # Zod validation schemas
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── profiles/
│   │   │   ├── routes.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── storefront/
│   │   │   ├── routes.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── deals/
│   │   │   ├── routes.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── contracts/
│   │   │   ├── routes.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── services/
│   │   │   │   ├── generator.ts
│   │   │   │   ├── analyzer.ts
│   │   │   │   ├── signer.ts
│   │   │   │   └── pdf.ts
│   │   │   ├── repository.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── deliverables/
│   │   │   ├── routes.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── payments/
│   │   │   ├── routes.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── invoices/
│   │   │   ├── routes.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── services/
│   │   │   │   ├── generator.ts
│   │   │   │   └── gst.ts
│   │   │   ├── repository.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── messages/
│   │   │   ├── routes.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── routes.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── services/
│   │   │   │   ├── push.ts
│   │   │   │   ├── email.ts
│   │   │   │   ├── sms.ts
│   │   │   │   └── in-app.ts
│   │   │   ├── repository.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── routes.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   └── admin/
│   │       ├── routes.ts
│   │       ├── controller.ts
│   │       ├── service.ts
│   │       ├── repository.ts
│   │       ├── schemas.ts
│   │       ├── types.ts
│   │       └── index.ts
│   │
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rateLimit.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── validate.ts      # Zod validation middleware
│   │   │   └── requestLogger.ts
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── redis.ts         # Redis client
│   │   │   └── queue.ts         # Bull queue setup
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── errors.ts        # Custom error classes
│   │   │   └── helpers.ts
│   │   └── types/
│   │       ├── supabase.ts
│   │       └── common.ts
│   │
│   └── jobs/                     # Background jobs
│       ├── index.ts
│       ├── invoice-generation.ts
│       ├── email-notifications.ts
│       ├── analytics-aggregation.ts
│       ├── payment-reminders.ts
│       └── instagram-sync.ts
│
├── package.json
└── tsconfig.json
```

### Domain Module Structure

Each domain follows a consistent structure:

```
domain/
├── routes.ts          # Express router with route definitions
├── controller.ts      # Request handlers (thin, delegates to service)
├── service.ts         # Business logic
├── repository.ts      # Database operations
├── schemas.ts         # Zod validation schemas
├── types.ts           # TypeScript types
└── index.ts           # Barrel export
```

---

## 5. Context Refactor Plan

### Current State: SessionContext (844 lines)

The current `SessionContext` handles too many responsibilities:
- OAuth token parsing and processing
- Session state management
- Profile data fetching
- Route redirection logic
- Trial status management
- Auth state derivation

### Target State: Split Contexts

```
┌─────────────────────────────────────────────────────────────┐
│                    Context Hierarchy                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 AuthContext                          │    │
│  │                                                      │    │
│  │  - session: Session | null                          │    │
│  │  - user: User | null                                │    │
│  │  - authStatus: 'loading' | 'authenticated' | 'unauthenticated' │
│  │  - signIn() / signOut()                             │    │
│  │  - OAuth handling                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                ProfileContext                        │    │
│  │                                                      │    │
│  │  - profile: Profile | null                          │    │
│  │  - loading: boolean                                 │    │
│  │  - isAdmin / isCreator / isBrand: boolean           │    │
│  │  - refetchProfile()                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              OnboardingContext                       │    │
│  │                                                      │    │
│  │  - onboardingStep: number                           │    │
│  │  - onboardingComplete: boolean                      │    │
│  │  - nextStep() / prevStep()                          │    │
│  │  - completeOnboarding()                             │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │             SubscriptionContext                      │    │
│  │                                                      │    │
│  │  - trialStatus: TrialStatus                         │    │
│  │  - subscription: Subscription | null                │    │
│  │  - isTrialActive: boolean                           │    │
│  │  - daysRemaining: number                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Migration Strategy

**Phase 1: Create New Contexts (Non-Breaking)**

```typescript
// src/domains/auth/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/api/supabase';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  authStatus: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    // Initialize session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthStatus(session ? 'authenticated' : 'unauthenticated');
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setAuthStatus(session ? 'authenticated' : 'unauthenticated');
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithOAuth = async (provider: 'google') => {
    await supabase.auth.signInWithOAuth({ provider });
  };

  return (
    <AuthContext.Provider value={{ session, user, authStatus, signIn, signOut, signInWithOAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

```typescript
// src/domains/profiles/contexts/ProfileContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/domains/auth';
import { supabase } from '@/shared/lib/api/supabase';
import type { Profile } from './types';

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isCreator: boolean;
  isBrand: boolean;
  refetchProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        setProfile(data as Profile);
      }
    } finally {
      setLoading(false);
    }
  };

  const value: ProfileContextType = {
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isCreator: profile?.role === 'creator',
    isBrand: profile?.role === 'brand',
    refetchProfile: fetchProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}
```

**Phase 2: Create Compatibility Layer**

```typescript
// src/contexts/SessionContext.tsx (compatibility layer)
// This maintains backward compatibility during migration

import { useAuth, AuthProvider } from '@/domains/auth';
import { useProfile, ProfileProvider } from '@/domains/profiles';
import { useOnboarding, OnboardingProvider } from '@/domains/profiles/contexts/OnboardingContext';
import { useSubscription, SubscriptionProvider } from '@/domains/payments/contexts/SubscriptionContext';

// Re-export for backward compatibility
export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <ProfileProvider>
        <OnboardingProvider>
          <SubscriptionProvider>
            {children}
          </SubscriptionProvider>
        </OnboardingProvider>
      </ProfileProvider>
    </AuthProvider>
  );
};

// Legacy hook that combines contexts for backward compatibility
export const useSession = () => {
  const auth = useAuth();
  const profile = useProfile();
  const onboarding = useOnboarding();
  const subscription = useSubscription();

  return {
    ...auth,
    ...profile,
    ...onboarding,
    ...subscription,
    // Legacy computed values
    loading: auth.authStatus === 'loading' || profile.loading,
    organizationId: profile.profile?.organization_id || null,
  };
};
```

**Phase 3: Migrate Components Gradually**

1. Update components to use specific hooks (`useAuth`, `useProfile`) instead of `useSession`
2. Remove compatibility layer once all components are migrated

---

## 6. Component Breakdown Strategy

### Strategy: Extract and Compose

For each oversized component, follow this pattern:

1. **Identify logical sections** - UI regions, features, data dependencies
2. **Extract hooks** - Move data fetching and state logic to custom hooks
3. **Extract sub-components** - Create focused, single-responsibility components
4. **Compose in page** - Page component becomes a thin composition layer

### Example: MobileDashboardDemo.tsx Breakdown

**Current:** 518K chars, monolithic dashboard

**Target Structure:**

```
src/domains/
├── deals/
│   └── components/
│       ├── dashboard/
│       │   ├── DealSummaryCard.tsx      # ~100 lines
│       │   ├── DealTimeline.tsx         # ~150 lines
│       │   ├── ActiveDealsList.tsx      # ~200 lines
│       │   └── DealActions.tsx          # ~100 lines
│       └── hooks/
│           ├── useDeals.ts              # Data fetching
│           ├── useDealActions.ts        # Accept/decline logic
│           └── useDealFilters.ts        # Filter state
│
├── storefront/
│   └── components/
│       └── dashboard/
│           ├── StorefrontPreview.tsx    # ~150 lines
│           ├── CollabLinkCard.tsx       # ~100 lines
│           └── PackageOverview.tsx      # ~120 lines
│
├── analytics/
│   └── components/
│       └── dashboard/
│           ├── EarningsChart.tsx        # ~150 lines
│           ├── MetricsGrid.tsx          # ~200 lines
│           └── PerformanceCard.tsx      # ~100 lines
│
└── profiles/
    └── components/
        └── dashboard/
            ├── ProfileCompletion.tsx    # ~100 lines
            ├── QuickActions.tsx         # ~150 lines
            └── OnboardingProgress.tsx   # ~120 lines
```

**Page Component (Thin Composition):**

```typescript
// src/pages/creator/CreatorDashboardPage.tsx
import { DealSummaryCard, ActiveDealsList } from '@/domains/deals';
import { StorefrontPreview, CollabLinkCard } from '@/domains/storefront';
import { EarningsChart, MetricsGrid } from '@/domains/analytics';
import { ProfileCompletion, QuickActions } from '@/domains/profiles';
import { useCreatorDashboard } from './hooks/useCreatorDashboard';

export function CreatorDashboardPage() {
  const { 
    deals, 
    storefront, 
    analytics, 
    profile,
    isLoading 
  } = useCreatorDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <DashboardLayout>
      <DashboardHeader profile={profile} />
      
      <DashboardGrid>
        <DashboardSection title="Active Deals">
          <DealSummaryCard deals={deals.active} />
          <ActiveDealsList deals={deals.pending} />
        </DashboardSection>
        
        <DashboardSection title="Storefront">
          <StorefrontPreview storefront={storefront} />
          <CollabLinkCard link={storefront.collabLink} />
        </DashboardSection>
        
        <DashboardSection title="Analytics">
          <EarningsChart data={analytics.earnings} />
          <MetricsGrid metrics={analytics.metrics} />
        </DashboardSection>
        
        <DashboardSection title="Quick Actions">
          <ProfileCompletion completion={profile.completion} />
          <QuickActions actions={profile.actions} />
        </DashboardSection>
      </DashboardGrid>
    </DashboardLayout>
  );
}
```

### Breakdown Priority Order

| Priority | Component | Current Size | Target Components |
|----------|-----------|--------------|-------------------|
| 1 | MobileDashboardDemo.tsx | 518K | 15-20 components |
| 2 | ContractUploadFlow.tsx | 356K | 10-15 components |
| 3 | BrandMobileDashboard.tsx | 334K | 12-15 components |
| 4 | DealDetailPage.tsx | 188K | 8-10 components |
| 5 | CollabLinkLanding.tsx | 220K | 10-12 components |

---

## 7. Route Reorganization

### Current Route Files (Large)

| File | Size | Endpoints |
|------|------|-----------|
| protection.ts | 125K | 30+ endpoints |
| collabRequests.ts | 130K | 25+ endpoints |
| deals.ts | 66K | 20+ endpoints |

### Target: Domain-Based Routes

**Before (protection.ts - 125K):**
```typescript
// All contract, copyright, and protection endpoints mixed together
router.get('/contracts', ...);
router.post('/contracts/generate', ...);
router.post('/copyright/scan', ...);
router.get('/complaints', ...);
// ... 30+ more endpoints
```

**After (domain-based):**
```typescript
// server/src/domains/contracts/routes.ts
import { Router } from 'express';
import { validate } from '@/shared/middleware/validate';
import * as controller from './controller';
import * as schemas from './schemas';

const router = Router();

router.get('/', controller.listContracts);
router.get('/:id', controller.getContract);
router.post('/generate', validate(schemas.generateContract), controller.generateContract);
router.post('/:id/sign', validate(schemas.signContract), controller.signContract);
router.get('/:id/download', controller.downloadContract);

export default router;
```

```typescript
// server/src/domains/deliverables/routes.ts
import { Router } from 'express';
import * as controller from './controller';

const router = Router();

router.get('/deal/:dealId', controller.getDeliverables);
router.post('/deal/:dealId/complete', controller.completeDeliverable);
router.post('/shipping', controller.createShipment);
router.get('/shipping/:id/track', controller.trackShipment);

export default router;
```

### Route Migration Strategy

1. **Create new domain route files** alongside existing routes
2. **Mount both old and new routes** during transition
3. **Update frontend to use new endpoints** gradually
4. **Remove old routes** once migration complete

```typescript
// server/src/index.ts (during migration)
import contractsRouter from './domains/contracts/routes';
import protectionRouter from './routes/protection'; // Legacy

// Mount both during transition
app.use('/api/v2/contracts', contractsRouter);  // New
app.use('/api/protection', protectionRouter);    // Legacy (deprecated)
```

---

## 8. Service Reorganization

### Current: Flat Service Directory

```
server/src/services/
├── aiContractAnalysis.ts
├── brandAuthService.ts
├── brandContactService.ts
├── brandContractReadyEmailService.ts
├── brandFormSubmissionEmailService.ts
├── ... (40+ files)
└── virusScan.ts
```

### Target: Domain-Organized Services

```
server/src/domains/
├── contracts/
│   ├── service.ts              # Main contract service
│   └── services/
│       ├── generator.ts        # Contract generation
│       ├── analyzer.ts         # AI analysis
│       ├── signer.ts           # E-signature handling
│       ├── pdf.ts              # PDF generation
│       └── templates.ts        # Template management
│
├── notifications/
│   ├── service.ts              # Notification orchestration
│   └── services/
│       ├── push.ts             # Push notifications
│       ├── email.ts            # Email sending
│       ├── sms.ts              # SMS via MSG91/Fast2SMS
│       └── templates.ts        # Email templates
│
├── invoices/
│   ├── service.ts
│   └── services/
│       ├── generator.ts        # Invoice generation
│       └── gst.ts              # GST calculations
│
└── deals/
    ├── service.ts
    └── services/
        ├── negotiation.ts      # Counter-offer logic
        └── reminders.ts        # Payment reminders
```

### Service Migration Pattern

```typescript
// Before: server/src/services/contractGenerator.ts (standalone)

// After: server/src/domains/contracts/services/generator.ts
import { ContractRepository } from '../repository';
import { TemplateService } from './templates';
import { PDFService } from './pdf';

export class ContractGeneratorService {
  constructor(
    private repo: ContractRepository,
    private templates: TemplateService,
    private pdf: PDFService
  ) {}

  async generate(data: GenerateContractInput): Promise<Contract> {
    const template = await this.templates.get(data.templateId);
    const content = this.render(template, data);
    const pdf = await this.pdf.generate(content);
    return this.repo.save({ ...data, pdf });
  }
}
```

---

## 9. Zod Validation Implementation

### Setup

```bash
npm install zod
```

### Schema Definition Pattern

```typescript
// server/src/domains/deals/schemas.ts
import { z } from 'zod';

export const createDealSchema = z.object({
  brand_name: z.string().min(1, 'Brand name is required').max(100),
  brand_email: z.string().email('Invalid email format'),
  brand_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  
  deal_type: z.enum(['paid', 'barter'], {
    errorMap: () => ({ message: 'Deal type must be paid or barter' })
  }),
  
  deal_amount: z.number()
    .positive('Deal amount must be positive')
    .optional()
    .refine(
      (val, ctx) => ctx.parent.deal_type === 'paid' ? val !== undefined : true,
      'Deal amount is required for paid deals'
    ),
  
  barter_value: z.number()
    .positive('Barter value must be positive')
    .optional()
    .refine(
      (val, ctx) => ctx.parent.deal_type === 'barter' ? val !== undefined : true,
      'Barter value is required for barter deals'
    ),
  
  deliverables: z.array(z.string().min(1)).min(1, 'At least one deliverable is required'),
  
  deadline: z.string()
    .datetime('Invalid deadline format')
    .refine(
      (val) => new Date(val) > new Date(),
      'Deadline must be in the future'
    ),
  
  terms: z.string().max(5000).optional(),
  
  shipping_required: z.boolean().optional().default(false),
  delivery_address: z.string().optional(),
}).refine(
  (data) => {
    if (data.shipping_required && !data.delivery_address) {
      return false;
    }
    return true;
  },
  { message: 'Delivery address is required when shipping is enabled' }
);

export const updateDealSchema = createDealSchema.partial();

export const dealIdSchema = z.object({
  id: z.string().uuid('Invalid deal ID format'),
});

export const listDealsSchema = z.object({
  status: z.enum(['pending', 'accepted', 'declined', 'completed']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort_by: z.enum(['created_at', 'deal_amount', 'deadline']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});
```

### Validation Middleware

```typescript
// server/src/shared/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body, query, and params
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Usage with specific targets
export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
};
```

### Usage in Routes

```typescript
// server/src/domains/deals/routes.ts
import { Router } from 'express';
import { validate, validateBody } from '@/shared/middleware/validate';
import * as controller from './controller';
import * as schemas from './schemas';

const router = Router();

router.post('/',
  authMiddleware,
  validateBody(schemas.createDealSchema),
  controller.createDeal
);

router.get('/',
  authMiddleware,
  validate(schemas.listDealsSchema),
  controller.listDeals
);

router.get('/:id',
  authMiddleware,
  validate(schemas.dealIdSchema),
  controller.getDeal
);

router.patch('/:id',
  authMiddleware,
  validate(schemas.dealIdSchema),
  validateBody(schemas.updateDealSchema),
  controller.updateDeal
);

export default router;
```

### Frontend Validation (Shared Schemas)

```typescript
// src/domains/deals/schemas.ts
import { z } from 'zod';

// Reuse the same schemas on frontend
export const createDealSchema = z.object({
  brand_name: z.string().min(1, 'Brand name is required').max(100),
  // ... same as backend
});

// Derive TypeScript types
export type CreateDealInput = z.infer<typeof createDealSchema>;
```

---

## 10. Background Job System

### Technology: BullMQ + Redis

```bash
npm install bullmq ioredis
```

### Queue Setup

```typescript
// server/src/shared/lib/queue.ts
import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// Queue definitions
export const queues = {
  invoices: new Queue('invoices', { connection }),
  notifications: new Queue('notifications', { connection }),
  analytics: new Queue('analytics', { connection }),
  payments: new Queue('payments', { connection }),
  instagram: new Queue('instagram', { connection }),
};

// Job types
export interface InvoiceJobData {
  type: 'generate' | 'send' | 'reminder';
  dealId: string;
  creatorId: string;
  brandEmail: string;
}

export interface NotificationJobData {
  type: 'email' | 'push' | 'sms';
  recipientId: string;
  template: string;
  data: Record<string, any>;
}

export interface AnalyticsJobData {
  type: 'aggregate_daily' | 'aggregate_weekly' | 'aggregate_monthly';
  date?: string;
}
```

### Job Processors

```typescript
// server/src/jobs/invoice-generation.ts
import { Worker, Job } from 'bullmq';
import { connection } from '@/shared/lib/queue';
import { InvoiceService } from '@/domains/invoices/service';

const invoiceService = new InvoiceService();

export const invoiceWorker = new Worker(
  'invoices',
  async (job: Job<InvoiceJobData>) => {
    const { type, dealId, creatorId, brandEmail } = job.data;

    switch (type) {
      case 'generate':
        const invoice = await invoiceService.generateForDeal(dealId);
        console.log(`Generated invoice ${invoice.id} for deal ${dealId}`);
        return invoice;

      case 'send':
        await invoiceService.sendInvoice(dealId, brandEmail);
        console.log(`Sent invoice for deal ${dealId} to ${brandEmail}`);
        return { success: true };

      case 'reminder':
        await invoiceService.sendPaymentReminder(dealId);
        console.log(`Sent payment reminder for deal ${dealId}`);
        return { success: true };

      default:
        throw new Error(`Unknown invoice job type: ${type}`);
    }
  },
  { connection, concurrency: 5 }
);

invoiceWorker.on('completed', (job) => {
  console.log(`Invoice job ${job.id} completed`);
});

invoiceWorker.on('failed', (job, err) => {
  console.error(`Invoice job ${job?.id} failed:`, err);
});
```

```typescript
// server/src/jobs/email-notifications.ts
import { Worker, Job } from 'bullmq';
import { connection } from '@/shared/lib/queue';
import { EmailService } from '@/domains/notifications/services/email';

const emailService = new EmailService();

export const emailWorker = new Worker(
  'notifications',
  async (job: Job<NotificationJobData>) => {
    const { type, recipientId, template, data } = job.data;

    if (type === 'email') {
      const result = await emailService.send({
        to: data.to,
        template,
        variables: data.variables,
      });
      return result;
    }

    throw new Error(`Unknown notification type: ${type}`);
  },
  { connection, concurrency: 10 }
);
```

```typescript
// server/src/jobs/analytics-aggregation.ts
import { Worker, Job } from 'bullmq';
import { connection } from '@/shared/lib/queue';
import { AnalyticsService } from '@/domains/analytics/service';

const analyticsService = new AnalyticsService();

export const analyticsWorker = new Worker(
  'analytics',
  async (job: Job<AnalyticsJobData>) => {
    const { type, date } = job.data;

    switch (type) {
      case 'aggregate_daily':
        await analyticsService.aggregateDailyMetrics(date || new Date().toISOString().split('T')[0]);
        break;

      case 'aggregate_weekly':
        await analyticsService.aggregateWeeklyMetrics();
        break;

      case 'aggregate_monthly':
        await analyticsService.aggregateMonthlyMetrics();
        break;

      default:
        throw new Error(`Unknown analytics job type: ${type}`);
    }

    return { success: true };
  },
  { connection, concurrency: 1 } // Single concurrency for data consistency
);
```

### Queueing Jobs

```typescript
// server/src/domains/deals/service.ts
import { queues, InvoiceJobData } from '@/shared/lib/queue';

export class DealService {
  async acceptDeal(dealId: string, creatorId: string) {
    // ... deal acceptance logic

    // Queue invoice generation
    await queues.invoices.add('generate-invoice', {
      type: 'generate',
      dealId,
      creatorId,
      brandEmail: deal.brand_email,
    } as InvoiceJobData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });

    // Queue notification
    await queues.notifications.add('send-notification', {
      type: 'email',
      recipientId: creatorId,
      template: 'deal-accepted',
      data: {
        to: deal.brand_email,
        variables: { dealId, creatorName },
      },
    });

    return deal;
  }
}
```

### Cron Scheduling

```typescript
// server/src/jobs/index.ts
import { QueueScheduler } from 'bullmq';
import { queues } from '@/shared/lib/queue';

// Schedule recurring jobs
export function setupSchedulers() {
  // Daily analytics aggregation at midnight
  queues.analytics.add('daily-aggregation', 
    { type: 'aggregate_daily' },
    { 
      repeat: { pattern: '0 0 * * *' },
      jobId: 'daily-analytics',
    }
  );

  // Payment reminders every 6 hours
  queues.payments.add('payment-reminders',
    { type: 'check_overdue' },
    {
      repeat: { pattern: '0 */6 * * *' },
      jobId: 'payment-reminders',
    }
  );

  // Instagram sync daily at 3 AM
  queues.instagram.add('instagram-sync',
    { type: 'sync_profiles' },
    {
      repeat: { pattern: '0 3 * * *' },
      jobId: 'instagram-sync',
    }
  );
}
```

---

## 11. Migration Plan

### Principles

1. **Strangler Fig Pattern**: New code gradually replaces old code
2. **Feature Flags**: Toggle between old and new implementations
3. **Parallel Running**: Old and new code coexist during transition
4. **Incremental Deployment**: Small, frequent releases

### Migration Phases

```
┌─────────────────────────────────────────────────────────────────┐
│                     Migration Timeline                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1: Foundation (Weeks 1-2)                                │
│  ├── Setup new folder structure                                 │
│  ├── Create shared utilities (Zod, errors, logger)              │
│  ├── Setup background job infrastructure                        │
│  └── Create new contexts (Auth, Profile)                        │
│                                                                  │
│  Phase 2: Auth & Profiles (Weeks 3-4)                           │
│  ├── Migrate auth domain                                        │
│  ├── Migrate profiles domain                                    │
│  ├── Split SessionContext                                       │
│  └── Add Zod validation for auth endpoints                      │
│                                                                  │
│  Phase 3: Deals & Contracts (Weeks 5-7)                         │
│  ├── Create deals domain structure                              │
│  ├── Migrate deal routes                                        │
│  ├── Create contracts domain structure                          │
│  ├── Migrate contract routes                                    │
│  └── Add background jobs for invoices                           │
│                                                                  │
│  Phase 4: Notifications & Messages (Weeks 8-9)                  │
│  ├── Create notifications domain                                │
│  ├── Migrate email services                                     │
│  ├── Create messages domain                                     │
│  └── Add background jobs for notifications                      │
│                                                                  │
│  Phase 5: Component Breakdown (Weeks 10-14)                     │
│  ├── Break down MobileDashboardDemo                             │
│  ├── Break down ContractUploadFlow                              │
│  ├── Break down BrandMobileDashboard                            │
│  ├── Break down DealDetailPage                                  │
│  └── Break down CollabLinkLanding                               │
│                                                                  │
│  Phase 6: Remaining Domains (Weeks 15-17)                       │
│  ├── Migrate storefront domain                                  │
│  ├── Migrate payments domain                                    │
│  ├── Migrate analytics domain                                   │
│  └── Migrate admin domain                                       │
│                                                                  │
│  Phase 7: Cleanup (Weeks 18-20)                                 │
│  ├── Remove legacy code                                         │
│  ├── Update all imports                                         │
│  ├── Remove compatibility layers                                │
│  └── Final testing                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Step-by-Step Refactor Order

### Sprint 1-2: Foundation

#### Week 1: Setup Infrastructure

1. **Create new folder structure**
   - Create `src/domains/` directory
   - Create `server/src/domains/` directory
   - Create `server/src/shared/` directory
   - Create `server/src/jobs/` directory

2. **Setup shared utilities**
   ```bash
   # Install dependencies
   npm install zod bullmq ioredis
   ```

3. **Create base utilities**
   - `server/src/shared/utils/errors.ts` - Custom error classes
   - `server/src/shared/middleware/validate.ts` - Zod validation middleware
   - `server/src/shared/lib/queue.ts` - BullMQ setup

4. **Create shared types**
   - `src/shared/types/common.types.ts`
   - `server/src/shared/types/common.ts`

#### Week 2: Context Split Preparation

1. **Create AuthContext**
   - Create `src/domains/auth/contexts/AuthContext.tsx`
   - Implement basic auth state management
   - Add OAuth handling

2. **Create ProfileContext**
   - Create `src/domains/profiles/contexts/ProfileContext.tsx`
   - Implement profile fetching
   - Add role derivation

3. **Create compatibility layer**
   - Update `src/contexts/SessionContext.tsx` to use new contexts
   - Ensure backward compatibility

### Sprint 3-4: Auth & Profiles Domain

#### Week 3: Auth Domain

1. **Backend auth domain**
   ```
   server/src/domains/auth/
   ├── routes.ts
   ├── controller.ts
   ├── service.ts
   ├── repository.ts
   ├── schemas.ts
   └── types.ts
   ```

2. **Migrate auth routes**
   - Move `/api/otp` routes to auth domain
   - Add Zod validation
   - Create new endpoints at `/api/v2/auth/*`

3. **Frontend auth domain**
   - Create auth components (LoginForm, SignupForm, OAuthButton)
   - Create auth hooks (useAuth, useOAuth)
   - Create auth API client

#### Week 4: Profiles Domain

1. **Backend profiles domain**
   ```
   server/src/domains/profiles/
   ├── routes.ts
   ├── controller.ts
   ├── service.ts
   ├── repository.ts
   ├── schemas.ts
   └── types.ts
   ```

2. **Migrate profile routes**
   - Move profile-related routes from `routes/profile.ts`
   - Add Zod validation

3. **Create OnboardingContext**
   - Extract onboarding logic from SessionContext
   - Create onboarding hooks

### Sprint 5-7: Deals & Contracts Domain

#### Week 5: Deals Domain Setup

1. **Create deals domain structure**
   ```
   server/src/domains/deals/
   ├── routes.ts
   ├── controller.ts
   ├── service.ts
   ├── services/
   │   ├── negotiation.ts
   │   └── reminders.ts
   ├── repository.ts
   ├── schemas.ts
   └── types.ts
   ```

2. **Start migrating from `routes/deals.ts`**
   - Identify endpoints to migrate
   - Create new route handlers
   - Add Zod schemas

#### Week 6: Continue Deals + Start Contracts

1. **Complete deals migration**
   - Migrate remaining deal endpoints
   - Update frontend to use new endpoints

2. **Create contracts domain**
   ```
   server/src/domains/contracts/
   ├── routes.ts
   ├── controller.ts
   ├── service.ts
   ├── services/
   │   ├── generator.ts
   │   ├── analyzer.ts
   │   ├── signer.ts
   │   └── pdf.ts
   ├── repository.ts
   ├── schemas.ts
   └── types.ts
   ```

#### Week 7: Contracts Migration + Background Jobs

1. **Migrate contract routes**
   - Move from `routes/protection.ts`
   - Add Zod validation

2. **Setup invoice background jobs**
   - Create `server/src/jobs/invoice-generation.ts`
   - Queue invoice generation on deal acceptance

### Sprint 8-9: Notifications & Messages

#### Week 8: Notifications Domain

1. **Create notifications domain**
   ```
   server/src/domains/notifications/
   ├── routes.ts
   ├── controller.ts
   ├── service.ts
   ├── services/
   │   ├── push.ts
   │   ├── email.ts
   │   ├── sms.ts
   │   └── templates.ts
   ├── repository.ts
   ├── schemas.ts
   └── types.ts
   ```

2. **Migrate notification services**
   - Move from `services/pushNotificationService.ts`
   - Move from `services/*EmailService.ts`

3. **Setup notification background jobs**
   - Create `server/src/jobs/email-notifications.ts`

#### Week 9: Messages Domain

1. **Create messages domain**
   ```
   server/src/domains/messages/
   ├── routes.ts
   ├── controller.ts
   ├── service.ts
   ├── repository.ts
   ├── schemas.ts
   └── types.ts
   ```

2. **Migrate message routes**
   - Move from `routes/conversations.ts`
   - Move from `routes/messages.ts`

### Sprint 10-14: Component Breakdown

#### Week 10-11: MobileDashboardDemo Breakdown

1. **Identify logical sections**
   - Deal summary
   - Storefront preview
   - Analytics widgets
   - Quick actions
   - Profile completion

2. **Extract hooks**
   - `useCreatorDashboard.ts`
   - `useDealSummary.ts`
   - `useStorefrontPreview.ts`

3. **Create sub-components**
   - 15-20 focused components
   - Each under 200 lines

#### Week 12: ContractUploadFlow Breakdown

1. **Identify flow steps**
   - Upload step
   - Analysis step
   - Review step
   - Sign step

2. **Extract hooks**
   - `useContractUpload.ts`
   - `useContractAnalysis.ts`

3. **Create step components**
   - 10-12 focused components

#### Week 13: BrandMobileDashboard Breakdown

1. **Identify sections**
   - Deal console
   - Creator search
   - Analytics
   - Settings

2. **Extract hooks and components**
   - 12-15 focused components

#### Week 14: Remaining Large Components

1. **DealDetailPage breakdown**
   - 8-10 components

2. **CollabLinkLanding breakdown**
   - 10-12 components

### Sprint 15-17: Remaining Domains

#### Week 15: Storefront & Payments

1. **Storefront domain**
   - Collab links
   - Packages
   - Media kit

2. **Payments domain**
   - Payment tracking
   - Reminders
   - Recovery

#### Week 16: Analytics & Invoices

1. **Analytics domain**
   - Dashboard data
   - Reports
   - Export

2. **Invoices domain**
   - Generation
   - GST compliance

#### Week 17: Admin Domain

1. **Admin domain**
   - User management
   - Support
   - Audit logs

### Sprint 18-20: Cleanup

#### Week 18: Remove Legacy Code

1. **Remove old route files**
   - Delete `routes/protection.ts` (migrated)
   - Delete `routes/deals.ts` (migrated)
   - Delete other migrated files

2. **Remove old service files**
   - Delete migrated services

#### Week 19: Update Imports

1. **Update all imports**
   - Use new domain paths
   - Remove compatibility layer

2. **Remove compatibility layer**
   - Delete `SessionContext.tsx` compatibility wrapper
   - Update all components to use new contexts

#### Week 20: Final Testing

1. **Integration testing**
   - Test all user flows
   - Test all API endpoints

2. **Performance testing**
   - Load testing
   - Background job monitoring

3. **Documentation**
   - Update API documentation
   - Update architecture docs

---

## 13. Risk Mitigation

### Critical Path Protection

The following workflows must not break during refactoring:

| Workflow | Risk Level | Mitigation |
|----------|------------|------------|
| Deal acceptance flow | Critical | Parallel running, feature flags |
| Payment processing | Critical | No changes to payment logic until Phase 6 |
| Onboarding flow | Critical | Compatibility layer, gradual migration |
| Contract signing | High | E-signature services unchanged until Phase 5 |
| Email notifications | Medium | Background jobs with fallback |

### Rollback Strategy

1. **Feature Flags**
   ```typescript
   // Use feature flags for new implementations
   if (process.env.USE_NEW_DEALS_API === 'true') {
     return newDealsApi.createDeal(data);
   }
   return legacyDealsApi.createDeal(data);
   ```

2. **Parallel Endpoints**
   - New endpoints at `/api/v2/*`
   - Old endpoints remain functional
   - Gradual frontend migration

3. **Database Compatibility**
   - No schema changes during refactor
   - New columns added, not removed
   - Views for backward compatibility

### Testing Strategy

1. **Unit Tests**
   - Add tests for new services
   - Test Zod schemas

2. **Integration Tests**
   - Test new API endpoints
   - Test background jobs

3. **E2E Tests**
   - Critical user flows
   - Regression testing

### Monitoring

1. **Error Tracking**
   - Sentry for error monitoring
   - Separate alerts for new vs old code

2. **Performance Monitoring**
   - API response times
   - Background job queue depth

3. **Feature Flags Dashboard**
   - Track migration progress
   - Quick rollback capability

---

## Appendix A: File Migration Mapping

### Routes Migration

| Old File | New Location | Status |
|----------|--------------|--------|
| `routes/protection.ts` | `domains/contracts/routes.ts` + `domains/deliverables/routes.ts` | Pending |
| `routes/deals.ts` | `domains/deals/routes.ts` | Pending |
| `routes/collabRequests.ts` | `domains/deals/routes.ts` (collab endpoints) | Pending |
| `routes/creators.ts` | `domains/profiles/routes.ts` | Pending |
| `routes/otp.ts` | `domains/auth/routes.ts` | Pending |
| `routes/conversations.ts` | `domains/messages/routes.ts` | Pending |
| `routes/messages.ts` | `domains/messages/routes.ts` | Pending |
| `routes/payments.ts` | `domains/payments/routes.ts` | Pending |

### Services Migration

| Old File | New Location | Status |
|----------|--------------|--------|
| `services/contractGenerator.ts` | `domains/contracts/services/generator.ts` | Pending |
| `services/aiContractAnalysis.ts` | `domains/contracts/services/analyzer.ts` | Pending |
| `services/contractSigningService.ts` | `domains/contracts/services/signer.ts` | Pending |
| `services/pushNotificationService.ts` | `domains/notifications/services/push.ts` | Pending |
| `services/*EmailService.ts` | `domains/notifications/services/email.ts` | Pending |
| `services/invoiceService.ts` | `domains/invoices/service.ts` | Pending |

---

## Appendix B: Checklist for Each Domain Migration

- [ ] Create domain folder structure
- [ ] Define Zod schemas
- [ ] Create types
- [ ] Create repository
- [ ] Create service
- [ ] Create controller
- [ ] Create routes
- [ ] Add validation middleware
- [ ] Mount routes at `/api/v2/*`
- [ ] Update frontend API client
- [ ] Migrate frontend components
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Update documentation
- [ ] Remove old code
- [ ] Verify in production

---

**Document Version:** 1.0.0  
**Last Updated:** March 31, 2026  
**Next Review:** After Phase 1 completion
