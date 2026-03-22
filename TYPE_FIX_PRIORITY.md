# Type Safety Audit - `: any` Fix Priority

**Audit Date:** 2026-03-22  
**Total Files Analyzed:** ~15+ source files  
**Estimated Total `: any` Occurrences:** 100+

---

## Summary

This audit identifies all `: any` type usages in the codebase, categorized by severity and priority for remediation. The goal is to improve type safety and catch potential runtime errors at compile time.

---

## Severity Classification

| Severity | Description | Examples Found |
|----------|-------------|----------------|
| **HIGH** | API responses, function parameters, props, catch clauses | ~35+ |
| **MEDIUM** | Variables, return types, useState generics | ~25+ |
| **LOW** | Type assertions (`as any`), temporary workarounds | ~40+ |

---

## Top 10 Files with Most `: any` Usage

| Rank | File | Estimated Count | Primary Issue |
|------|------|-----------------|---------------|
| 1 | `src/pages/BrandMobileDashboard.tsx` | ~20+ | Function parameters, props |
| 2 | `src/contexts/SessionContext.tsx` | ~15+ | Supabase query type assertions |
| 3 | `src/lib/hooks/useBrands.ts` | ~15+ | Query building, callback parameters |
| 4 | `src/lib/hooks/useProfiles.ts` | ~12+ | Query building, error handling |
| 5 | `src/pages/CreatorDashboard.tsx` | ~8+ | State types, callback parameters |
| 6 | `src/pages/BrandDashboard.tsx` | ~8+ | API responses, callback parameters |
| 7 | `src/pages/Login.tsx` | ~5+ | Profile type assertions, catch clauses |
| 8 | `src/types/index.ts` | ~3 | Type definitions using `any` |
| 9 | `src/components/ProtectedRoute.tsx` | ~2 | Function parameters |
| 10 | `src/lib/hooks/useAuth.ts` | ~2 | Error handling |
| 11 | `src/App.tsx` | ~1 | Retry handler parameter |
| 12 | `src/pages/AdminDashboard.tsx` | ~1 | Catch clause |

---

## Priority Fix List

### 🔴 PRIORITY 1 (HIGH) - Fix Immediately

These affect data integrity and can cause silent runtime failures:

#### 1. Type Definitions (`src/types/index.ts`)
```typescript
// CURRENT (Line ~15)
export type PaymentReminder = any;

// SHOULD BE
export type PaymentReminder = {
  id: string;
  deal_id: string;
  reminder_date: string;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
};
```

#### 2. Component Props (`src/pages/BrandMobileDashboard.tsx`)
```typescript
// CURRENT (Lines 57-59)
profile?: any;
requests?: any[];
deals?: any[];

// SHOULD BE
profile?: Profile;
requests?: CollabRequest[];
deals?: BrandDeal[];
```

#### 3. Function Parameters (`src/pages/BrandMobileDashboard.tsx`)
```typescript
// CURRENT
const formatCompactINR = (n: any) => { ... }
const formatFollowers = (n: any) => { ... }
const timeSince = (iso: any) => { ... }
const safeImageSrc = (url: any) => { ... }
const dealFingerprint = (row: any) => { ... }
const normalizeStatus = (status: any) => { ... }
const firstNameish = (profile: any) => { ... }

// SHOULD BE
const formatCompactINR = (n: number): string => { ... }
const formatFollowers = (n: number): string => { ... }
const timeSince = (iso: string | Date): string | null => { ... }
const safeImageSrc = (url: string | null | undefined): string | undefined => { ... }
const dealFingerprint = (row: BrandDeal): string => { ... }
const normalizeStatus = (status: string): string => { ... }
const firstNameish = (profile: Profile): string => { ... }
```

#### 4. Catch Clause Parameters (Multiple Files)
```typescript
// CURRENT (Pattern found in 6+ files)
} catch (err: any) {
  console.error('Error:', err);
  toast.error(err.message);
}

// SHOULD BE
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'An error occurred';
  console.error('Error:', err);
  toast.error(message);
}
```

**Files to fix:**
- `src/lib/hooks/useAuth.ts` (Line 19)
- `src/pages/CreatorDashboard.tsx` (Line 118)
- `src/pages/BrandDashboard.tsx` (Line 65)
- `src/pages/Login.tsx` (Lines 146, 162)
- `src/pages/AdminDashboard.tsx` (Line 103)
- `src/App.tsx` (Line ~190)

#### 5. Callback Parameters (`src/lib/hooks/useBrands.ts`, `src/pages/BrandDashboard.tsx`, `src/pages/CreatorDashboard.tsx`)
```typescript
// CURRENT
data.map((brand: any) => { ... })
requests.filter((r: any) => { ... })
deals.reduce((acc: number, d: any) => { ... })

// SHOULD BE
data.map((brand: Brand) => { ... })
requests.filter((r: CollabRequest) => { ... })
deals.reduce((acc: number, d: BrandDeal) => { ... })
```

---

### 🟡 PRIORITY 2 (MEDIUM) - Fix Soon

These affect type inference but are less likely to cause runtime issues:

#### 1. useState Generics (`src/pages/CreatorDashboard.tsx`)
```typescript
// CURRENT (Line 73)
const [collabRequestsPreview, setCollabRequestsPreview] = useState<any[]>([]);

// SHOULD BE
const [collabRequestsPreview, setCollabRequestsPreview] = useState<CollabRequest[]>([]);
```

#### 2. API Response Variables (`src/pages/BrandDashboard.tsx`)
```typescript
// CURRENT
const data: any = await res.json().catch(() => ({}));

// SHOULD BE
interface ApiResponse<T> {
  data?: T;
  error?: string;
}
const response: ApiResponse<BrandData> = await res.json().catch(() => ({}));
```

#### 3. Query Building Variables (`src/lib/hooks/useBrands.ts`)
```typescript
// CURRENT (Line 45)
let query: any = supabase.from('brands' as any)...

// SHOULD BE
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
let query: PostgrestFilterBuilder<Database['public']['Tables']['brands']> = 
  supabase.from('brands').select('...');
```

#### 4. Type Definitions (`src/types/index.ts`)
```typescript
// CURRENT
deal_templates?: any[] | null;
brand_submission_details?: any | null;

// SHOULD BE
deal_templates?: DealTemplate[] | null;
brand_submission_details?: BrandSubmissionDetails | null;
```

---

### 🟢 PRIORITY 3 (LOW) - Fix When Convenient

These are type assertions that suppress TypeScript errors but don't affect runtime:

#### 1. Supabase Query Type Assertions (`src/contexts/SessionContext.tsx`, `src/lib/hooks/useProfiles.ts`)
```typescript
// CURRENT
.select('...') as any)
.eq('role' as any, role)
(error as any)?.status

// PREFERRED APPROACH
// 1. Update Supabase types to include all columns/tables
// 2. Use typed query builders
// 3. Remove assertions once types are complete

// TEMPORARY ALTERNATIVE
// Create a typed wrapper
const typedSelect = <T>(query: any, columns: string) => 
  query.select(columns) as PostgrestFilterBuilder<T>;
```

#### 2. Profile Role Access (`src/pages/Login.tsx`)
```typescript
// CURRENT
(profile as any)?.role

// SHOULD BE
// Ensure Profile type includes role
interface Profile {
  id: string;
  role: 'admin' | 'brand' | 'creator' | 'chartered_accountant' | 'lawyer';
  // ... other fields
}
```

---

## Suggested Types for Common Patterns

### Error Handling
```typescript
// Create a utility function
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

// Usage
} catch (err: unknown) {
  toast.error(getErrorMessage(err));
}
```

### Supabase Query Results
```typescript
// Define database types
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

// Usage
type Brand = Tables<'brands'>;
type Profile = Tables<'profiles'>;
```

### API Responses
```typescript
// Generic API response type
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Usage
const response: ApiResponse<Brand[]> = await fetchBrands();
```

---

## Example Fixes for Common Patterns

### Pattern 1: Catch Clauses
```typescript
// Before
try {
  await someAsyncOperation();
} catch (err: any) {
  console.error(err);
  toast.error(err.message);
}

// After
try {
  await someAsyncOperation();
} catch (err: unknown) {
  console.error(err);
  const message = err instanceof Error ? err.message : 'Operation failed';
  toast.error(message);
}
```

### Pattern 2: Array Callback Parameters
```typescript
// Before
const filtered = items.filter((item: any) => item.status === 'active');
const mapped = items.map((item: any) => ({ id: item.id, name: item.name }));

// After
interface Item {
  id: string;
  status: string;
  name: string;
}

const filtered = items.filter((item: Item) => item.status === 'active');
const mapped = items.map((item: Item) => ({ id: item.id, name: item.name }));
```

### Pattern 3: Component Props
```typescript
// Before
interface MyComponentProps {
  data: any;
  onAction: (item: any) => void;
}

// After
interface MyComponentProps {
  data: SomeData;
  onAction: (item: SomeItem) => void;
}
```

### Pattern 4: useState with Objects
```typescript
// Before
const [state, setState] = useState<any>(null);

// After
interface MyState {
  loading: boolean;
  data: SomeData | null;
  error: Error | null;
}

const [state, setState] = useState<MyState>({
  loading: false,
  data: null,
  error: null,
});
```

---

## Recommended Action Plan

1. **Week 1:** Fix all HIGH priority issues
   - Replace `catch (err: any)` with `catch (err: unknown)`
   - Fix type definitions in `types/index.ts`
   - Add proper types to component props

2. **Week 2:** Fix MEDIUM priority issues
   - Add useState generics
   - Type API responses
   - Fix query building variables

3. **Week 3+:** Gradually fix LOW priority issues
   - Update Supabase types
   - Remove type assertions
   - Enable stricter TypeScript options

---

## TypeScript Configuration Recommendations

Consider enabling stricter options in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## Notes

- Many `as any` assertions are used to work around Supabase type limitations
- Consider running `supabase gen types` to generate accurate database types
- Some type assertions may be necessary until database migrations are stable
- This audit only covers `: any` patterns; there may be implicit `any` types as well

---

**Generated by:** AI Type Safety Audit  
**Last Updated:** 2026-03-22
