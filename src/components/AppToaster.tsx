"use client";

import { Toaster as Sonner, toast } from "sonner";

/**
 * App Toaster Component
 * 
 * This component renders the toast notification system.
 * It's already integrated in App.tsx and works out of the box.
 * 
 * Usage:
 * import { useToast } from "@/hooks/useToast";
 * const toast = useToast();
 * toast.success("Message!");
 */
const AppToaster = () => {
  return (
    <Sonner
      position="top-center"
      className="toaster group"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-background",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:opacity-90",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:border-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toast]:border-green-500/30 dark:group-[.toast]:border-green-500/30",
          error: "group-[.toast]:border-destructive/30 dark:group-[.toast]:border-destructive/30",
          warning: "group-[.toast]:border-yellow-500/30 dark:group-[.toast]:border-yellow-500/30",
          info: "group-[.toast]:border-info/30 dark:group-[.toast]:border-info/30",
        },
      }}
      expand={false}
      visibleToasts={2}
      duration={3000}
    />
  );
};

export default AppToaster;

// Export toast for direct usage if needed
export { toast };
