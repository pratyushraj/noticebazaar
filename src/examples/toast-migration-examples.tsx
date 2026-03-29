/**
 * Example: Migrating to Enhanced Toast System
 * 
 * This file shows examples of how to migrate from the old toast usage
 * to the new enhanced toast system.
 */

// ============================================
// OLD WAY - Direct Import from Sonner
// ============================================

// Before:
import { toast } from "sonner";

function OldComponent() {
  const handleSave = async () => {
    try {
      await saveData();
      toast.success("Data saved!");
    } catch (error) {
      toast.error("Failed to save");
    }
  };

  return <button type="button" onClick={handleSave}>Save</button>;
}

// ============================================
// NEW WAY - Using Enhanced Hook
// ============================================

// After:
import { useToast } from "@/hooks/useToast";

function NewComponent() {
  const toast = useToast();

  const handleSave = async () => {
    // Simpler with promise toast
    await toast.promise(saveData(), {
      loading: "Saving your data...",
      success: "Data saved successfully!",
      error: "Failed to save data"
    });
  };

  const handleDelete = async (id: string) => {
    await deleteItem(id);
    // Now with undo action!
    toast.success("Item deleted", {
      description: "This action can be undone",
      action: {
        label: "Undo",
        onClick: () => restoreItem(id)
      }
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast.info("Copied to clipboard", {
      icon: "📋",
      duration: 2000
    });
  };

  return (
    <>
      <button type="button" onClick={handleSave}>Save</button>
      <button type="button" onClick={() => handleDelete(123)}>Delete</button>
      <button type="button" onClick={handleCopy}>Copy</button>
    </>
  );
}

// ============================================
// UTILITY FUNCTIONS - Backward Compatible
// ============================================

// The old utility functions still work:
import { showSuccess, showError, showWarning, showInfo } from "@/utils/toast";

function UtilityExample() {
  const handleClick = () => {
    showSuccess("Works as before!");
    showError("Also works!", "With description");
    showWarning("New!", "This was added");
    showInfo("Info message", "With details");
  };

  return <button type="button" onClick={handleClick}>Test Utilities</button>;
}

// ============================================
// COMPLETE MIGRATION EXAMPLE
// ============================================

// Before (from NewsletterSignup.tsx):
import { toast } from 'sonner';

function OldNewsletterSignup() {
  const handleSubmit = async (email: string) => {
    try {
      await subscribe(email);
      toast.success('Subscribed!', {
        description: 'You will receive our newsletter.'
      });
    } catch (error) {
      toast.error('Subscription failed', {
        description: error.message
      });
    }
  };
}

// After (with enhanced toast):
import { useToast } from '@/hooks/useToast';

function NewNewsletterSignup() {
  const toast = useToast();

  const handleSubmit = async (email: string) => {
    await toast.promise(subscribe(email), {
      loading: 'Subscribing...',
      success: 'Subscribed! You will receive our newsletter.',
      error: (err) => `Subscription failed: ${err.message}`
    });
  };
}

// ============================================
// EXAMPLES FROM EXISTING CODE
// ============================================

// Example 1: ActivityHub.tsx - Toggle Favorite
// Before:
toast.success(`Document ${!currentStatus ? 'added to' : 'removed from'} favorites!`);
toast.error('Failed to update favorite status', { description: error.message });

// After:
const toast = useToast();
toast.success(`Document ${!currentStatus ? 'added to' : 'removed from'} favorites!`);
toast.error('Failed to update favorite status', { 
  description: error.message,
  action: { label: 'Retry', onClick: () => toggleFavorite() }
});

// Example 2: ChaseAllOverduesButton.tsx
// Before:
toast.success(`Sent payment reminders to ${count} brands!`, {
  description: 'Brands will be notified via email'
});
toast.error('Failed to send some reminders', {
  description: error.message
});

// After:
const toast = useToast();
await toast.promise(sendReminders(overdueDeals), {
  loading: 'Sending reminders...',
  success: (count) => `Sent reminders to ${count} brands!`,
  error: 'Failed to send reminders'
});

// Example 3: ProfileMenu.tsx
// Before:
toast.success("Logged out successfully");

// After:
const toast = useToast();
toast.success("Logged out successfully", {
  description: "See you soon!",
  duration: 3000
});

// ============================================
// ACTION BUTTONS EXAMPLE
// ============================================

function ActionButtonsExample() {
  const toast = useToast();

  const handleDelete = () => {
    // With undo action
    toast.success("Item deleted", {
      description: "Click undo to restore",
      action: {
        label: "Undo",
        onClick: () => {
          // Restore the item
          toast.success("Item restored!");
        }
      }
    });
  };

  const handleFailedUpload = () => {
    // With retry action
    toast.error("Upload failed", {
      description: "File too large. Max size is 5MB",
      action: {
        label: "Choose another file",
        onClick: () => fileInputRef.current?.click()
      }
    });
  };

  const handleNetworkError = () => {
    // With retry and dismiss
    toast.error("Connection lost", {
      description: "Unable to sync data",
      action: {
        label: "Retry",
        onClick: () => syncData()
      },
      cancel: {
        label: "Dismiss"
      }
    });
  };

  return (
    <>
      <button type="button" onClick={handleDelete}>Delete Item</button>
      <button type="button" onClick={handleFailedUpload}>Upload File</button>
      <button type="button" onClick={handleNetworkError}>Test Network</button>
    </>
  );
}

// ============================================
// BEST PRACTICES
// ============================================

/*
1. Use promise toasts for async operations:
   ✓ await toast.promise(apiCall(), { loading, success, error })
   ✗ toast.loading(); try { await api(); toast.success(); } catch { toast.error(); }

2. Add undo actions for destructive operations:
   ✓ toast.success("Deleted", { action: { label: "Undo", onClick: restore } })
   ✗ toast.success("Deleted")

3. Use appropriate durations:
   - Success: 3-4 seconds (default)
   - Error: 5-6 seconds (longer to read)
   - Info: 2-3 seconds (short)
   - Loading: Until complete

4. Write clear, specific messages:
   ✓ toast.error("Failed to save profile", { description: "Name is required" })
   ✗ toast.error("Error occurred")

5. Use the right toast type:
   - success: Confirm completed actions
   - error: Alert about failures
   - warning: Warn about potential issues
   - info: Provide helpful information
   - loading: Show ongoing processes
*/
