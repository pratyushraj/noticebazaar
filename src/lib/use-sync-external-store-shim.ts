// ESM shim for use-sync-external-store/shim
// Re-exports React's built-in useSyncExternalStore to maintain single React instance
import { useSyncExternalStore } from 'react';
export { useSyncExternalStore };
export default useSyncExternalStore;

