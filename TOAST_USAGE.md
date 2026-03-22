# Toast Notification System

A comprehensive toast notification system built on top of [Sonner](https://sonner.emilkowal.ski/) with enhanced features for better user feedback.

## Features

- ✅ **Multiple toast types**: success, error, warning, info, loading
- ✅ **Promise-based toasts**: Automatic loading → success/error transitions
- ✅ **Action buttons**: Add undo, retry, and custom actions
- ✅ **Customizable**: Duration, position, icons, and more
- ✅ **TypeScript support**: Fully typed with great autocomplete
- ✅ **Backward compatible**: Works with existing code

## Quick Start

### Using the Hook (Recommended)

```tsx
import { useToast } from "@/hooks/useToast";

function MyComponent() {
  const toast = useToast();

  const handleSave = () => {
    toast.success("Changes saved successfully!");
  };

  const handleError = () => {
    toast.error("Something went wrong", {
      description: "Please try again later"
    });
  };

  return (
    <>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleError}>Test Error</button>
    </>
  );
}
```

### Using Utility Functions

For simple usage outside React components or for backward compatibility:

```tsx
import { showSuccess, showError } from "@/utils/toast";

// Simple toasts
showSuccess("Operation completed!");
showError("Failed to save", "Please check your connection");
```

## API Reference

### useToast Hook

The primary way to use toasts in React components:

```tsx
const toast = useToast();

// Available methods:
toast.success(message, options?)   // Success toast with ✓ icon
toast.error(message, options?)     // Error toast with ✕ icon
toast.warning(message, options?)   // Warning toast with ⚠ icon
toast.info(message, options?)      // Info toast with ℹ icon
toast.loading(message, options?)   // Loading toast with ⏳ icon
toast.promise(promise, messages, options?)  // Promise-based toast
toast.dismiss(toastId?)            // Dismiss toast(s)
toast.custom(message, options?)    // Custom toast
```

### Toast Options

```tsx
interface ToastOptions {
  // Message below the main text
  description?: string;
  
  // Duration in milliseconds (default: 4000)
  duration?: number;
  
  // Position on screen
  position?: "top-left" | "top-right" | "top-center" | 
             "bottom-left" | "bottom-right" | "bottom-center";
  
  // Custom icon (emoji or React node)
  icon?: string | ReactNode;
  
  // Action button
  action?: {
    label: string;
    onClick: () => void;
  };
  
  // Cancel button (secondary action)
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  
  // Called when toast is dismissed
  onDismiss?: (toast) => void;
  
  // Called when toast auto-closes
  onAutoClose?: (toast) => void;
  
  // Dismissible by user
  dismissible?: boolean;
}
```

## Usage Examples

### 1. Basic Toast Types

```tsx
const toast = useToast();

// Success
toast.success("Profile updated!");

// Error (longer duration by default)
toast.error("Network error", {
  description: "Please check your internet connection"
});

// Warning
toast.warning("Your session will expire in 5 minutes");

// Info
toast.info("New feature available!", {
  description: "Check out the new dashboard"
});

// Loading
const loadingId = toast.loading("Processing your request...");
// Later: toast.dismiss(loadingId);
```

### 2. Promise-Based Toasts

Automatically shows loading → success/error:

```tsx
const toast = useToast();

const handleSave = async () => {
  await toast.promise(saveData(), {
    loading: "Saving your changes...",
    success: "Changes saved successfully!",
    error: "Failed to save changes"
  });
};

// Dynamic messages based on result
const handleUpload = async () => {
  await toast.promise(uploadFile(file), {
    loading: "Uploading file...",
    success: (data) => `Uploaded ${data.filename}!`,
    error: (err) => `Upload failed: ${err.message}`
  });
};
```

### 3. Toast with Actions

```tsx
import { useToast, withAction, withActions } from "@/hooks/useToast";

const toast = useToast();

// Single action (Undo)
const handleDelete = () => {
  toast.success(
    "Item deleted",
    withAction(
      { label: "Undo", onClick: () => restoreItem() },
      { description: "This action can be undone" }
    )
  );
};

// Multiple actions (Retry + Dismiss)
const handleFailedRequest = () => {
  toast.error(
    "Connection failed",
    withActions([
      { label: "Retry", onClick: () => retryRequest() },
      { label: "Dismiss", onClick: () => {} }
    ], {
      description: "Unable to connect to server"
    })
  );
};
```

### 4. Custom Duration and Position

```tsx
const toast = useToast();

// Short duration (2 seconds)
toast.success("Copied to clipboard", {
  duration: 2000
});

// Long duration (10 seconds)
toast.error("Critical error", {
  duration: 10000,
  description: "Please contact support"
});

// Different position
toast.info("New message received", {
  position: "bottom-right"
});
```

### 5. Dismissing Toasts

```tsx
const toast = useToast();

// Dismiss a specific toast
const toastId = toast.loading("Processing...");
// Later:
toast.dismiss(toastId);

// Dismiss all toasts
toast.dismiss();

// With callback
toast.success("Item saved", {
  onDismiss: () => console.log("Toast dismissed")
});
```

### 6. Utility Functions (Non-Hook)

For use outside React components:

```tsx
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showLoading,
  dismissToast,
  showSuccessWithAction,
  showErrorWithRetry,
  showPromise
} from "@/utils/toast";

// Simple toasts
showSuccess("Operation completed!");
showError("Failed to save", "Please try again");
showWarning("Unsaved changes", "Your work will be lost");
showInfo("New feature", "Check it out!");

// With actions
showSuccessWithAction("Item deleted", "Undo", () => restoreItem());
showErrorWithRetry("Upload failed", () => retryUpload());

// Promise
showPromise(apiCall(), {
  loading: "Loading...",
  success: "Success!",
  error: "Failed"
});
```

### 7. Predefined Variants

Use common toast messages with predefined icons:

```tsx
import { useToast, toastVariants } from "@/hooks/useToast";

const toast = useToast();

// Success variants
toast.success(toastVariants.saved.message, { icon: toastVariants.saved.icon });
toast.success(toastVariants.deleted.message, { icon: toastVariants.deleted.icon });
toast.success(toastVariants.updated.message, { icon: toastVariants.updated.icon });

// Error variants
toast.error(toastVariants.networkError.message, { 
  icon: toastVariants.networkError.icon 
});

// Info variants
toast.info(toastVariants.copied.message, { 
  icon: toastVariants.copied.icon,
  duration: 2000 
});
```

## Best Practices

### 1. Choose the Right Type

- **Success**: Confirm completed actions (saved, deleted, updated)
- **Error**: Alert about failures (network errors, validation errors)
- **Warning**: Warn about potential issues (unsaved changes, session expiry)
- **Info**: Provide helpful information (new features, tips)
- **Loading**: Show ongoing processes (uploading, processing)

### 2. Write Clear Messages

```tsx
// ❌ Bad: Vague
toast.error("Error occurred");

// ✅ Good: Specific and actionable
toast.error("Failed to save profile", {
  description: "Please check your internet connection and try again"
});
```

### 3. Use Actions for Undo Operations

```tsx
// ✅ Good: Provide undo for destructive actions
const handleDelete = () => {
  deleteItem(itemId);
  toast.success("Item deleted", withAction(
    { label: "Undo", onClick: () => restoreItem(itemId) }
  ));
};
```

### 4. Use Promise Toasts for Async Operations

```tsx
// ❌ Bad: Manual loading management
const handleSave = async () => {
  const id = toast.loading("Saving...");
  try {
    await saveData();
    toast.dismiss(id);
    toast.success("Saved!");
  } catch (error) {
    toast.dismiss(id);
    toast.error("Failed");
  }
};

// ✅ Good: Automatic with promise toast
const handleSave = async () => {
  await toast.promise(saveData(), {
    loading: "Saving...",
    success: "Saved!",
    error: "Failed to save"
  });
};
```

### 5. Consider Duration

- **Success**: 3-4 seconds (default)
- **Error**: 5-6 seconds (longer to read)
- **Info**: 3-4 seconds
- **Warning**: 4-5 seconds
- **Loading**: Until operation completes

```tsx
toast.error("Critical error", {
  duration: 6000,  // Longer for important errors
  description: "Please save your work and contact support"
});
```

## Integration with Existing Code

The new system is backward compatible with existing toast usage:

```tsx
// Old code still works
import { showSuccess, showError } from "@/utils/toast";
showSuccess("Works!");
showError("Also works!");

// New code with hook
import { useToast } from "@/hooks/useToast";
const toast = useToast();
toast.success("Modern approach!");
```

## Examples by Use Case

### Form Submission

```tsx
const handleSubmit = async (data: FormData) => {
  await toast.promise submitForm(data), {
    loading: "Submitting form...",
    success: "Form submitted successfully!",
    error: (err) => `Submission failed: ${err.message}`
  });
};
```

### File Upload

```tsx
const handleUpload = async (file: File) => {
  await toast.promise(uploadFile(file), {
    loading: `Uploading ${file.name}...`,
    success: (result) => `${result.filename} uploaded!`,
    error: "Upload failed. Please try again."
  });
};
```

### Delete with Undo

```tsx
const handleDelete = async (id: string) => {
  await deleteItem(id);
  toast.success("Item deleted", {
    description: "This item has been removed",
    action: {
      label: "Undo",
      onClick: () => restoreItem(id)
    }
  });
};
```

### Network Error with Retry

```tsx
const fetchData = async () => {
  try {
    const data = await api.fetch();
    toast.success("Data loaded!");
    return data;
  } catch (error) {
    toast.error("Network error", {
      description: "Unable to fetch data",
      action: {
        label: "Retry",
        onClick: () => fetchData()
      }
    });
  }
};
```

### Copy to Clipboard

```tsx
const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.info("Copied to clipboard", {
    icon: "📋",
    duration: 2000
  });
};
```

## Troubleshooting

### Toast not appearing?

1. Check that `AppToaster` component is rendered in your app (it's in `App.tsx`)
2. Ensure you're calling toast methods correctly
3. Check browser console for errors

### Toast positioned incorrectly?

The default position is `top-center`. You can override:

```tsx
toast.success("Message", {
  position: "bottom-right"
});
```

Or update `AppToaster.tsx` to change the default position.

### Want to customize styling?

Edit `src/components/AppToaster.tsx` to customize the toast styles:

```tsx
<Sonner
  position="top-center"
  toastOptions={{
    classNames: {
      toast: "your-custom-classes",
      // ...
    }
  }}
/>
```

## Migration Guide

### From Old Utility Functions

```tsx
// Before
import { showSuccess } from "@/utils/toast";
showSuccess("Message");

// After (recommended)
import { useToast } from "@/hooks/useToast";
const toast = useToast();
toast.success("Message");
```

### From Direct Sonner Usage

```tsx
// Before
import { toast } from "sonner";
toast.success("Message");

// After (with enhanced features)
import { useToast } from "@/hooks/useToast";
const toast = useToast();
toast.success("Message", {
  icon: "✓",  // Default icon
  // Plus all the enhanced features
});
```

## TypeScript

All types are exported for TypeScript users:

```tsx
import type {
  ToastOptions,
  ToastAction,
  ToastVariant,
  PromiseToastOptions
} from "@/hooks/useToast";
```

## Resources

- [Sonner Documentation](https://sonner.emilkowal.ski/)
- [Toast Component Source](./src/components/ui/toast-provider.tsx)
- [Hook Source](./src/hooks/useToast.ts)
- [Utility Functions](./src/utils/toast.ts)
