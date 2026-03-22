import { createContext, useContext, useCallback, ReactNode } from 'react';
import { toast, ExternalToast } from 'sonner';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastOptions extends ExternalToast {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

interface PromiseToastOptions<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: Error) => string);
  loadingOptions?: ToastOptions;
  successOptions?: ToastOptions;
  errorOptions?: ToastOptions;
}

interface ToastContextValue {
  success: (message: string, options?: ToastOptions) => string | number;
  error: (message: string, options?: ToastOptions) => string | number;
  warning: (message: string, options?: ToastOptions) => string | number;
  info: (message: string, options?: ToastOptions) => string | number;
  loading: (message: string, options?: ToastOptions) => string | number;
  promise: <T>(promise: Promise<T>, options: PromiseToastOptions<T>) => Promise<T>;
  dismiss: (toastId?: string | number) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const createToast = useCallback((type: ToastType) => {
    return (message: string, options?: ToastOptions) => {
      const toastOptions: ExternalToast = {
        duration: options?.duration ?? (type === 'error' ? 5000 : 4000),
        description: options?.description,
        action: options?.action ? {
          label: options.action.label,
          onClick: options.action.onClick,
        } : undefined,
        cancel: options?.cancel ? {
          label: options.cancel.label,
          onClick: options.cancel.onClick,
        } : undefined,
        onDismiss: options?.onDismiss,
        onAutoClose: options?.onAutoClose,
        ...options,
      };

      // Handle warning with custom styling
      if (type === 'warning') {
        return toast(message, {
          ...toastOptions,
          icon: '⚠️',
          style: {
            backgroundColor: '#fef3c7',
            borderColor: '#f59e0b',
            color: '#92400e',
          },
        });
      }

      // Handle info with custom styling
      if (type === 'info') {
        return toast(message, {
          ...toastOptions,
          icon: 'ℹ️',
          style: {
            backgroundColor: '#dbeafe',
            borderColor: '#3b82f6',
            color: '#1e40af',
          },
        });
      }

      return toast[type](message, toastOptions);
    };
  }, []);

  const success = useCallback(createToast('success'), [createToast]);
  const error = useCallback(createToast('error'), [createToast]);
  const warning = useCallback(createToast('warning'), [createToast]);
  const info = useCallback(createToast('info'), [createToast]);
  const loadingToast = useCallback(createToast('loading'), [createToast]);

  const promiseToast = useCallback(<T,>(promise: Promise<T>, options: PromiseToastOptions<T>): Promise<T> => {
    return toast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
      ...options.loadingOptions,
    });
  }, []);

  const dismiss = useCallback((toastId?: string | number) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  const dismissAll = useCallback(() => {
    toast.dismiss();
  }, []);

  const value: ToastContextValue = {
    success,
    error,
    warning,
    info,
    loading: loadingToast,
    promise: promiseToast,
    dismiss,
    dismissAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Standalone functions for backward compatibility and convenience
export const toastUtils = {
  success: (message: string, options?: ToastOptions) => 
    toast.success(message, { duration: 4000, ...options }),
  
  error: (message: string, options?: ToastOptions) => 
    toast.error(message, { duration: 5000, ...options }),
  
  warning: (message: string, options?: ToastOptions) => 
    toast(message, {
      icon: '⚠️',
      duration: 4500,
      style: {
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
        color: '#92400e',
      },
      ...options,
    }),
  
  info: (message: string, options?: ToastOptions) => 
    toast(message, {
      icon: 'ℹ️',
      duration: 4000,
      style: {
        backgroundColor: '#dbeafe',
        borderColor: '#3b82f6',
        color: '#1e40af',
      },
      ...options,
    }),
  
  loading: (message: string, options?: ToastOptions) => 
    toast.loading(message, options),
  
  promise: <T,>(promise: Promise<T>, options: PromiseToastOptions<T>) => 
    toast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
    }),
  
  dismiss: (toastId?: string | number) => 
    toast.dismiss(toastId),
  
  dismissAll: () => 
    toast.dismiss(),
};
