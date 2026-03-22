/**
 * Toast Notification Utility
 * 
 * A simple wrapper around Sonner for toast notifications.
 * For advanced features, use the useToast hook from @/components/ui/toast-provider
 */

import { toast } from "sonner";

/**
 * Show a success toast notification
 */
export const showSuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
    duration: 4000,
  });
};

/**
 * Show an error toast notification
 */
export const showError = (message: string, description?: string) => {
  toast.error(message, {
    description,
    duration: 5000,
  });
};

/**
 * Show a warning toast notification
 */
export const showWarning = (message: string, description?: string) => {
  toast(message, {
    icon: '⚠️',
    description,
    duration: 4500,
    style: {
      backgroundColor: '#fef3c7',
      borderColor: '#f59e0b',
      color: '#92400e',
    },
  });
};

/**
 * Show an info toast notification
 */
export const showInfo = (message: string, description?: string) => {
  toast(message, {
    icon: 'ℹ️',
    description,
    duration: 4000,
    style: {
      backgroundColor: '#dbeafe',
      borderColor: '#3b82f6',
      color: '#1e40af',
    },
  });
};

/**
 * Show a loading toast notification
 * Returns the toast ID for later dismissal
 */
export const showLoading = (message: string) => {
  return toast.loading(message);
};

/**
 * Show a promise-based toast notification
 */
export const showPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) => {
  return toast.promise(promise, messages);
};

/**
 * Dismiss a specific toast by ID
 */
export const dismissToast = (toastId?: string | number) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toast notifications
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Show toast with action button
 */
export const showSuccessWithAction = (
  message: string,
  action: { label: string; onClick: () => void },
  description?: string
) => {
  toast.success(message, {
    description,
    action,
    duration: 5000,
  });
};

/**
 * Show error with retry action
 */
export const showErrorWithRetry = (
  message: string,
  onRetry: () => void,
  description?: string
) => {
  toast.error(message, {
    description,
    action: {
      label: 'Retry',
      onClick: onRetry,
    },
    duration: 6000,
  });
};

// Re-export toast from sonner for direct usage
export { toast } from "sonner";
