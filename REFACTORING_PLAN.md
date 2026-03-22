# ContractUploadFlow.tsx Refactoring Plan

**File:** `src/pages/ContractUploadFlow.tsx`  
**Current Lines:** 6,793  
**Target Lines:** ~2,000-2,500 (reduction of ~4,300-4,800 lines, ~65-70%)  

---

## Executive Summary

ContractUploadFlow.tsx is a **6,793-line mega-component** that handles:
- File upload & drag-drop
- Contract analysis & AI processing
- Results display with multiple accordions
- Negotiation messaging
- Sharing (email, WhatsApp, Instagram)
- Barter deal management
- Multiple modal dialogs
- Auto-save drafts
- Brand reply tracking

This violates the Single Responsibility Principle and makes the code:
- Hard to test
- Hard to maintain
- Hard to understand
- Prone to bugs

---

## Key Metrics

| Metric | Count | Target |
|--------|-------|--------|
| useState hooks | 80 | ~10-15 |
| useEffect hooks | 9 | ~3-5 |
| Handler functions | 28+ | ~5-8 |
| motion.button elements | ~45 | ~5-10 |
| Dialog modals | 3 | 0 (extracted) |
| Total lines | 6,793 | ~2,000-2,500 |

---

## Phase 1: Extract Custom Hooks (Priority: HIGH)

### 1.1 `useContractUpload` Hook
**Lines to extract:** ~400-500 lines  
**File:** `src/hooks/useContractUpload.ts`

**Handles:**
- File selection, drag-drop
- Upload state (uploading, progress, error)
- File validation
- Upload retry logic

```typescript
// Current (inline in component)
const [isUploading, setIsUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
const [file, setFile] = useState<File | null>(null);
const [contractUrl, setContractUrl] = useState<string>('');
// ... 20+ more upload-related states

// Proposed (extracted hook)
const {
  file,
  contractUrl,
  isUploading,
  uploadProgress,
  handleFileSelect,
  handleDrop,
  handleRetryUpload,
  resetUpload
} = useContractUpload();
```

### 1.2 `useContractAnalysis` Hook
**Lines to extract:** ~600-800 lines  
**File:** `src/hooks/useContractAnalysis.ts`

**Handles:**
- Analysis state and results
- Score calculations
- Issue detection
- Key terms extraction
- Protection status

```typescript
// Current
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [analysisProgress, setAnalysisProgress] = useState(0);
const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
// ... 15+ more analysis-related states

// Proposed
const {
  isAnalyzing,
  analysisProgress,
  analysisResults,
  startAnalysis,
  retryAnalysis,
  clearResults
} = useContractAnalysis(contractUrl);
```

### 1.3 `useNegotiation` Hook
**Lines to extract:** ~300-400 lines  
**File:** `src/hooks/useNegotiation.ts`

**Handles:**
- Negotiation message generation
- Message editing
- Copy/send handlers
- Brand communication

```typescript
// Current
const [negotiationMessage, setNegotiationMessage] = useState<string>('');
const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
const [brandEmail, setBrandEmail] = useState<string>('');
// ... more negotiation states

// Proposed
const {
  negotiationMessage,
  isGenerating,
  generateMessage,
  updateMessage,
  sendToBrand,
  copyForEmail,
  copyForWhatsApp
} = useNegotiation(analysisResults, savedDealId);
```

### 1.4 `useBarterDeal` Hook
**Lines to extract:** ~400-500 lines  
**File:** `src/hooks/useBarterDeal.ts`

**Handles:**
- Barter deal creation
- Deal status management
- Barter report generation

```typescript
// Proposed
const {
  barterDeal,
  isCreating,
  createDeal,
  updateDealStatus,
  generateReport
} = useBarterDeal(analysisResults);
```

### 1.5 `useAutoSave` Hook
**Lines to extract:** ~200-300 lines  
**File:** `src/hooks/useAutoSave.ts`

**Handles:**
- Auto-save draft logic
- Debounced saves
- Status persistence

```typescript
// Proposed
const {
  isSaving,
  lastSaved,
  saveDraft,
  loadDraft,
  clearDraft
} = useAutoSave('contract-draft', draftData);
```

### 1.6 `useSharing` Hook
**Lines to extract:** ~200-300 lines  
**File:** `src/hooks/useSharing.ts`

**Handles:**
- Share link generation
- Platform-specific sharing
- Copy to clipboard

```typescript
// Proposed
const {
  shareLink,
  shareByEmail,
  shareByWhatsApp,
  shareByInstagram,
  copyLink
} = useSharing(reportId, analysisResults);
```

---

## Phase 2: Extract Components (Priority: MEDIUM)

### 2.1 `FileUploadZone` Component
**Lines to extract:** ~300-400 lines  
**File:** `src/components/contract/FileUploadZone.tsx`

**Current pattern (repeated):**
```tsx
<motion.div
  className="relative cursor-pointer"
  onDragOver={handleDragOver}
  onDrop={handleDrop}
>
  <input
    type="file"
    accept=".pdf,.doc,.docx"
    onChange={handleFileChange}
    className="hidden"
  />
  {/* Large upload UI */}
</motion.div>
```

**Proposed:**
```tsx
<FileUploadZone
  onFileSelect={handleFileSelect}
  accept=".pdf,.doc,.docx"
  maxSize={10 * 1024 * 1024}
  isUploading={isUploading}
  progress={uploadProgress}
/>
```

### 2.2 `ContractScoreDisplay` Component
**Lines to extract:** ~200-300 lines  
**File:** `src/components/contract/ContractScoreDisplay.tsx`

**Current:**
```tsx
<div className="relative w-48 h-48">
  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
    {/* Score circle with gradient */}
  </svg>
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="text-4xl font-bold">{score}</span>
  </div>
</div>
```

**Proposed:**
```tsx
<ContractScoreDisplay
  score={analysisResults.score}
  grade={analysisResults.grade}
  showAnimation={true}
/>
```

### 2.3 `AccordionSection` Component
**Lines to extract:** ~150-200 lines  
**File:** `src/components/contract/AccordionSection.tsx`

**Current (repeated 5+ times):**
```tsx
<motion.div
  initial={false}
  animate={{
    height: openSections.keyTerms ? 'auto' : 0,
    opacity: openSections.keyTerms ? 1 : 0
  }}
  className="overflow-hidden"
>
  {/* Section content */}
</motion.div>
```

**Proposed:**
```tsx
<AccordionSection
  title="Key Terms"
  isOpen={openSections.keyTerms}
  onToggle={() => handleAccordionToggle('keyTerms')}
  icon={<FileText className="w-5 h-5" />}
>
  {/* Section content */}
</AccordionSection>
```

### 2.4 Modal Components

#### 2.4.1 `NegotiationModal`
**Lines to extract:** ~200-250 lines  
**File:** `src/components/contract/modals/NegotiationModal.tsx`

```tsx
<NegotiationModal
  open={showNegotiationModal}
  onClose={() => setShowNegotiationModal(false)}
  message={negotiationMessage}
  onMessageChange={setNegotiationMessage}
  onSendEmail={handleSendEmail}
  onCopyWhatsApp={handleCopyWhatsApp}
/>
```

#### 2.4.2 `WhatsAppPreviewModal`
**Lines to extract:** ~100-150 lines  
**File:** `src/components/contract/modals/WhatsAppPreviewModal.tsx`

```tsx
<WhatsAppPreviewModal
  open={showWhatsAppPreview}
  onClose={() => setShowWhatsAppPreview(false)}
  message={whatsappPreviewMessage}
  onConfirm={handleConfirmWhatsAppCopy}
/>
```

#### 2.4.3 `ReportIssueModal`
**Lines to extract:** ~100-150 lines  
**File:** `src/components/contract/modals/ReportIssueModal.tsx`

### 2.5 `ResultsSection` Component
**Lines to extract:** ~800-1000 lines  
**File:** `src/components/contract/ResultsSection.tsx`

**Contains:**
- Score display
- All accordion sections
- Action buttons
- Status indicators

### 2.6 `ProcessingIndicator` Component
**Lines to extract:** ~100-150 lines  
**File:** `src/components/contract/ProcessingIndicator.tsx`

```tsx
<ProcessingIndicator
  stage={processingStage}
  progress={analysisProgress}
  message={statusMessage}
/>
```

### 2.7 `ActionButton` Component (Reusable)
**Lines to extract:** ~50-100 lines  
**File:** `src/components/ui/ActionButton.tsx`

**Current (repeated 45+ times):**
```tsx
<motion.button
  onClick={handler}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl font-semibold"
>
  <Icon className="w-5 h-5 mr-2" />
  Label
</motion.button>
```

**Proposed:**
```tsx
<ActionButton
  onClick={handler}
  variant="primary" // primary, secondary, danger, ghost
  icon={<Icon className="w-5 h-5" />}
  loading={isLoading}
>
  Label
</ActionButton>
```

---

## Phase 3: Extract Utility Functions (Priority: LOW)

### 3.1 `contractUtils.ts`
**File:** `src/utils/contractUtils.ts`

```typescript
// Extract these functions:
export const formatNegotiationMessage = (message: string): string => { ... }
export const calculateProgress = (stage: string): number => { ... }
export const validateCreatorContactInfo = (): ValidationResult => { ... }
export const createWhatsAppMessage = (message: string): string => { ... }
export const getApiBaseUrl = (): string => { ... }
export const formatFileSize = (bytes: number): string => { ... }
export const getFileExtension = (filename: string): string => { ... }
```

### 3.2 `constants.ts`
**File:** `src/constants/contract.ts`

```typescript
// Extract constants:
export const HAPTIC_PATTERNS = {
  light: [10],
  medium: [20],
  heavy: [30]
};

export const STATUS_GRADIENT = {
  analyzing: 'from-blue-600 to-indigo-600',
  success: 'from-green-600 to-emerald-600',
  error: 'from-red-600 to-rose-600'
};

export const SCORE_COLORS = {
  excellent: '#10B981',
  good: '#34D399',
  fair: '#FBBF24',
  poor: '#F87171'
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = ['.pdf', '.doc', '.docx'];
```

---

## Phase 4: Create Context Provider (Priority: MEDIUM)

### `ContractUploadProvider`
**File:** `src/contexts/ContractUploadContext.tsx`

**Purpose:** Share state between extracted components without prop drilling

```tsx
// Context provides:
interface ContractUploadContextValue {
  // Upload state
  file: File | null;
  contractUrl: string;
  isUploading: boolean;
  
  // Analysis state
  analysisResults: AnalysisResults | null;
  isAnalyzing: boolean;
  
  // Actions
  setFile: (file: File) => void;
  startUpload: () => Promise<void>;
  startAnalysis: () => Promise<void>;
}

// Usage:
<ContractUploadProvider>
  <FileUploadZone />
  <ResultsSection />
  <NegotiationModal />
</ContractUploadProvider>
```

---

## Estimated Line Reduction Summary

| Phase | Extraction | Lines Removed | Lines Remaining |
|-------|------------|---------------|-----------------|
| Original | - | - | 6,793 |
| Phase 1.1 | useContractUpload | -500 | 6,293 |
| Phase 1.2 | useContractAnalysis | -700 | 5,593 |
| Phase 1.3 | useNegotiation | -350 | 5,243 |
| Phase 1.4 | useBarterDeal | -450 | 4,793 |
| Phase 1.5 | useAutoSave | -250 | 4,543 |
| Phase 1.6 | useSharing | -250 | 4,293 |
| Phase 2.1 | FileUploadZone | -350 | 3,943 |
| Phase 2.2 | ContractScoreDisplay | -250 | 3,693 |
| Phase 2.3 | AccordionSection | -200 | 3,493 |
| Phase 2.4 | Modal components | -500 | 2,993 |
| Phase 2.5 | ResultsSection | -900 | 2,093 |
| Phase 2.6-2.7 | Other components | -200 | 1,893 |
| **Final** | | **~4,900** | **~1,900** |

---

## Priority Order for Implementation

### Week 1: High Impact
1. ✅ `useContractUpload` hook
2. ✅ `useContractAnalysis` hook
3. ✅ `ActionButton` component

### Week 2: Medium Impact
4. ✅ `useNegotiation` hook
5. ✅ `FileUploadZone` component
6. ✅ `ContractScoreDisplay` component

### Week 3: Cleanup
7. ✅ Extract modal components
8. ✅ `ResultsSection` component
9. ✅ Utility functions & constants

### Week 4: Final Polish
10. ✅ Context provider (if needed)
11. ✅ Testing & documentation
12. ✅ Remove dead code

---

## Code Snippets: Current vs Proposed

### Example 1: File Upload Handler

**Current (lines 2168-2290):**
```tsx
const handleRealUpload = async () => {
  if (!file) return;
  
  setIsUploading(true);
  setUploadProgress(0);
  setUploadError(null);
  
  try {
    const formData = new FormData();
    formData.append('contract', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      onUploadProgress: (progress) => {
        setUploadProgress(progress);
      }
    });
    
    // ... 100+ more lines
  } catch (error) {
    setUploadError(error.message);
  } finally {
    setIsUploading(false);
  }
};
```

**Proposed:**
```tsx
// In useContractUpload.ts
export const useContractUpload = () => {
  const [state, setState] = useState<UploadState>({
    file: null,
    isUploading: false,
    progress: 0,
    error: null,
    url: null
  });

  const upload = useCallback(async (file: File) => {
    // Upload logic here
  }, []);

  return { ...state, upload };
};

// In ContractUploadFlow.tsx
const { upload, isUploading, progress, error } = useContractUpload();
```

### Example 2: Accordion Section

**Current (repeated 5 times, ~150 lines each):**
```tsx
<div className="border border-white/10 rounded-xl overflow-hidden">
  <button
    onClick={() => handleAccordionToggle('keyTerms')}
    className="w-full px-6 py-4 flex items-center justify-between"
  >
    <span className="flex items-center gap-3">
      <FileText className="w-5 h-5 text-purple-400" />
      <span className="font-semibold">Key Terms</span>
    </span>
    <ChevronDown className={cn(
      "w-5 h-5 transition-transform",
      openSections.keyTerms && "rotate-180"
    )} />
  </button>
  
  <motion.div
    initial={false}
    animate={{ height: openSections.keyTerms ? 'auto' : 0 }}
    className="overflow-hidden"
  >
    {/* 100+ lines of content */}
  </motion.div>
</div>
```

**Proposed:**
```tsx
<AccordionSection
  title="Key Terms"
  icon={<FileText className="w-5 h-5 text-purple-400" />}
  isOpen={openSections.keyTerms}
  onToggle={() => toggleSection('keyTerms')}
>
  <KeyTermsContent terms={analysisResults.keyTerms} />
</AccordionSection>
```

### Example 3: Action Buttons

**Current (45+ occurrences):**
```tsx
<motion.button
  onClick={handleCopyEmail}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
>
  <Mail className="w-5 h-5" />
  Copy Email
</motion.button>
```

**Proposed:**
```tsx
<ActionButton
  onClick={handleCopyEmail}
  variant="ghost"
  icon={<Mail className="w-5 h-5" />}
>
  Copy Email
</ActionButton>
```

---

## Benefits of Refactoring

1. **Maintainability**: Each file has a single responsibility
2. **Testability**: Hooks and components can be tested in isolation
3. **Reusability**: Components can be reused across the app
4. **Readability**: Main component becomes a simple composition
5. **Performance**: Easier to memoize and optimize individual pieces
6. **Team Collaboration**: Multiple developers can work on different files

---

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Write tests before refactoring |
| State synchronization issues | Use context provider carefully |
| Import cycle dependencies | Plan module structure upfront |
| Performance regression | Profile before and after |

---

## Next Steps

1. **Get approval** on this refactoring plan
2. **Create feature branch**: `refactor/contract-upload-flow`
3. **Start with Phase 1.1**: Extract `useContractUpload` hook
4. **Test thoroughly** after each extraction
5. **Update documentation** as components are created

---

*Generated: March 22, 2026*  
*File analyzed: ContractUploadFlow.tsx (6,793 lines)*
