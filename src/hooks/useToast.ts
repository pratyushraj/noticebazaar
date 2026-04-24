

import { toast, ExternalToast } from "sonner";

// Types for toast options
export type ToastVariant = "success" | "error" | "warning" | "info" | "loading";

export interface ToastOptions extends ExternalToast {
  duration?: number;
  position?: "top-left" | "top-right" | "top-center" | "bottom-left" | "bottom-right" | "bottom-center";
  dismissible?: boolean;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
}

export interface PromiseToastOptions {
  loading: string;
  success: string | ((data: any) => string);
  error: string | ((error: any) => string);
}

/**
 * Enhanced useToast hook for better user feedback
 * 
 * Provides methods for:
 * - success(message, options?)
 * - error(message, options?)
 * - warning(message, options?)
 * - info(message, options?)
 * - loading(message, options?)
 * - promise(promise, {loading, success, error})
 * - dismiss(toastId?)
 * 
 * @example
 * const toast = useToast();
 * toast.success("Operation successful!");
 * toast.error("Something went wrong", { description: "Please try again" });
 * toast.promise(saveData(), {
 *   loading: "Saving...",
 *   success: "Data saved!",
 *   error: "Failed to save"
 * });
 */
export function useToast() {
  const success = (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...options,
      icon: options?.icon || "✓",
    });
  };

  const error = (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...options,
      icon: options?.icon || "✕",
      duration: options?.duration || 5000, // Longer duration for errors
    });
  };

  const warning = (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      ...options,
      icon: options?.icon || "⚠",
      duration: options?.duration || 4500,
    });
  };

  const info = (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      ...options,
      icon: options?.icon || "ℹ",
    });
  };

  const loading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...options,
      icon: options?.icon || "⏳",
    });
  };

  const promise = async <T,>(
    promise: Promise<T>,
    messages: PromiseToastOptions,
    options?: ToastOptions
  ): Promise<T> => {
    return toast.promise(promise, {
      ...options,
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  };

  const dismiss = (toastId?: string | number) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  const custom = (message: string | React.ReactNode, options?: ToastOptions) => {
    return toast(message, options);
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    promise,
    dismiss,
    custom,
  };
}

/**
 * Helper function to add action buttons to toasts
 * 
 * @example
 * const toast = useToast();
 * toast.success(
 *   "Item deleted",
 *   withAction("Undo", () => restoreItem())
 * );
 */
export function withAction(action: ToastAction, options?: ToastOptions): ToastOptions {
  return {
    ...options,
    action: {
      label: action.label,
      onClick: action.onClick,
    },
  };
}

/**
 * Helper function to add multiple action buttons
 * Supports up to 2 actions (using action and cancel in Sonner)
 * 
 * @example
 * const toast = useToast();
 * toast.error(
 *   "Connection failed",
 *   withActions([
 *     { label: "Retry", onClick: () => retry() },
 *     { label: "Dismiss", onClick: () => {} }
 *   ])
 * );
 */
export function withActions(
  actions: ToastAction[],
  options?: ToastOptions
): ToastOptions {
  if (actions.length === 0) {
    return options || {};
  }

  if (actions.length === 1) {
    return {
      ...options,
      action: {
        label: actions[0].label,
        onClick: actions[0].onClick,
      },
    };
  }

  // For 2 or more actions, use action and cancel
  return {
    ...options,
    action: {
      label: actions[0].label,
      onClick: actions[0].onClick,
    },
    cancel: {
      label: actions[1].label,
      onClick: actions[1].onClick,
    },
  };
}

/**
 * Predefined toast variants for common use cases
 */
export const toastVariants = {
  // Success variants
  saved: { message: "Changes saved successfully", icon: "💾" },
  deleted: { message: "Item deleted", icon: "🗑️" },
  updated: { message: "Updated successfully", icon: "✨" },
  created: { message: "Created successfully", icon: "🎉" },
  
  // Error variants
  networkError: { message: "Network error. Please check your connection.", icon: "🌐" },
  unauthorized: { message: "You're not authorized to perform this action", icon: "🔒" },
  notFound: { message: "Item not found", icon: "🔍" },
  
  // Warning variants
  unsavedChanges: { message: "You have unsaved changes", icon: "⚠️" },
  sessionExpiring: { message: "Your session will expire soon", icon: "⏰" },
  
  // Info variants
  copied: { message: "Copied to clipboard", icon: "📋" },
  uploaded: { message: "File uploaded successfully", icon: "📤" },
};

// Export types
export type { ExternalToast };
