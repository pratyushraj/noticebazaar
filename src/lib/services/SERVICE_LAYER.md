# Service Layer Architecture

This document describes the service layer pattern used in the CreatorArmour codebase for better separation of concerns and maintainability.

## Overview

The service layer sits between your UI components (pages/hooks) and the data layer (Supabase). It encapsulates business logic, provides consistent error handling, and makes the codebase more testable.

```
┌─────────────────────────────────────────────────────────┐
│                    UI Components                         │
│              (Pages, Components, Hooks)                  │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                          │
│    dealService, creatorService, brandService, etc.       │
│                                                          │
│  • Business logic                                        │
│  • Data validation                                       │
│  • Error handling                                        │
│  • Type transformations                                  │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│              (Supabase Client, Storage)                  │
└─────────────────────────────────────────────────────────┘
```

## Core Principles

### 1. Single Responsibility
Each service handles one domain entity:
- `DealService` → Brand deals, payments, progress tracking
- `CreatorService` → Creator profiles, settings, onboarding
- `BrandService` → Brand directory, reviews, opportunities
- `AuthService` → Authentication, sessions, user context

### 2. Result-Based Error Handling
All service methods return `ServiceResult<T>`:

```typescript
type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError };
```

**Usage example:**
```typescript
const result = await dealService.getById(dealId);

if (result.success) {
  const deal = result.data;
  // Use deal
} else {
  const error = result.error;
  // Handle error: error.code, error.message
}
```

### 3. Type Safety
Services provide strongly typed interfaces:
- Input types for create/update operations
- Output types matching domain entities
- Enum types for status values

### 4. Testability
Services are class-based with dependency injection:
```typescript
// Production
const dealService = new DealService();

// Testing with mock Supabase
const mockSupabase = createMockClient();
const testService = new DealService(mockSupabase);
```

## File Structure

```
src/lib/services/
├── index.ts              # Central exports
├── types.ts              # Base types, ServiceResult, helpers
├── dealService.ts        # Brand deals domain
├── creatorService.ts     # Creator profiles domain
├── brandService.ts       # Brand directory domain
├── authService.ts        # Authentication domain
├── fileService.ts        # File upload/download (existing)
├── invoiceService.ts     # Invoice generation (existing)
└── searchService.ts      # Search utilities (existing)
```

## Service Interface Pattern

Each service implements an interface for consistency:

```typescript
export interface IDealService {
  // CRUD Operations
  getById(id: string): Promise<ServiceResult<BrandDeal>>;
  getByCreator(creatorId: string, options?: QueryOptions): Promise<ServiceResult<BrandDeal[]>>;
  create(input: CreateDealInput): Promise<ServiceResult<BrandDeal>>;
  update(id: string, input: UpdateDealInput): Promise<ServiceResult<BrandDeal>>;
  delete(id: string): Promise<ServiceResult<void>>;

  // Domain-specific operations
  updateStatus(id: string, status: DealStatus): Promise<ServiceResult<BrandDeal>>;
  // ... more methods
}
```

## Common Patterns

### CRUD Operations

```typescript
// Create
const result = await dealService.create({
  creator_id: userId,
  brand_name: 'Acme Inc',
  deal_amount: 50000,
  // ... other fields
});

// Read
const dealResult = await dealService.getById(dealId);
const dealsResult = await dealService.getByCreator(userId, {
  filters: { status: 'Completed' },
  sortBy: 'created_at',
  sortOrder: 'desc',
  limit: 10,
});

// Update
const updateResult = await dealService.update(dealId, {
  status: 'Content Making',
});

// Delete
const deleteResult = await dealService.delete(dealId);
```

### Filtering and Pagination

```typescript
const result = await dealService.getByCreator(userId, {
  filters: {
    status: 'All',
    platform: 'Instagram',
    overdue: true,
  },
  page: 1,
  pageSize: 20,
  sortBy: 'payment_expected_date',
  sortOrder: 'asc',
});
```

### Error Handling

```typescript
const result = await dealService.getById(dealId);

if (!result.success) {
  switch (result.error.code) {
    case 'NOT_FOUND':
      // Handle not found
      break;
    case 'FORBIDDEN':
      // Handle access denied
      break;
    case 'VALIDATION_ERROR':
      // Handle validation errors
      break;
    default:
      // Handle other errors
      console.error(result.error.message);
  }
  return;
}

// Success - use result.data
```

## Migration Guide

### From Hooks to Services

**Before (business logic in hooks):**
```typescript
// In a hook or component
const { data: deals, error } = await supabase
  .from('brand_deals')
  .select('*')
  .eq('creator_id', userId)
  .order('created_at', { ascending: false });
```

**After (using service layer):**
```typescript
// In a hook or component
const result = await dealService.getByCreator(userId, {
  sortBy: 'created_at',
  sortOrder: 'desc',
});

if (result.success) {
  const deals = result.data;
}
```

### Creating New Services

1. **Create the service file** in `src/lib/services/`:

```typescript
// src/lib/services/notificationService.ts
import { supabase } from '@/integrations/supabase/client';
import { ServiceResult, ok, fail, handleResult } from './types';

export interface INotificationService {
  getAll(userId: string): Promise<ServiceResult<Notification[]>>;
  markAsRead(notificationId: string): Promise<ServiceResult<void>>;
  // ... other methods
}

export class NotificationService implements INotificationService {
  private supabase;

  constructor(supabaseClient?: typeof supabase) {
    this.supabase = supabaseClient ?? supabase;
  }

  async getAll(userId: string): Promise<ServiceResult<Notification[]>> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: mapSupabaseError(error) };
    return ok(data ?? []);
  }

  // ... implement other methods
}

export const notificationService = new NotificationService();
```

2. **Export from index.ts**:

```typescript
// src/lib/services/index.ts
export { notificationService, NotificationService } from './notificationService';
export type { INotificationService, /* other types */ } from './notificationService';
```

3. **Use in components/hooks**:

```typescript
import { notificationService } from '@/lib/services';

const result = await notificationService.getAll(userId);
```

## Best Practices

### Do's ✅

1. **Use services for business logic** - Move complex queries and transformations out of components
2. **Return ServiceResult** - Always wrap responses in `ServiceResult<T>`
3. **Use TypeScript interfaces** - Define input/output types for all methods
4. **Handle errors gracefully** - Convert Supabase errors to meaningful service errors
5. **Keep services focused** - One domain per service
6. **Use the singleton export** - Import `dealService` not `new DealService()`

### Don'ts ❌

1. **Don't call Supabase directly from components** - Use services instead
2. **Don't throw exceptions** - Return error results
3. **Don't mix domains** - Keep deal logic in DealService, not BrandService
4. **Don't skip error handling** - Always check `result.success`
5. **Don't mutate data in services** - Return new objects

## Testing

Services are designed for easy testing:

```typescript
import { DealService } from '@/lib/services';
import { createMockSupabase } from '@/test-utils';

describe('DealService', () => {
  let service: DealService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new DealService(mockSupabase);
  });

  it('should return deal by id', async () => {
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: { id: '123', brand_name: 'Test Brand' },
      error: null,
    });

    const result = await service.getById('123');

    expect(result.success).toBe(true);
    expect(result.data?.brand_name).toBe('Test Brand');
  });

  it('should handle not found error', async () => {
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });

    const result = await service.getById('nonexistent');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOT_FOUND');
  });
});
```

## Future Improvements

1. **Add caching layer** - Cache frequently accessed data
2. **Add retry logic** - Automatic retries for transient failures
3. **Add logging** - Structured logging for debugging
4. **Add metrics** - Track service performance
5. **Add transactions** - Multi-step operations with rollback

## Questions?

Contact the team or check the existing service implementations for examples.
