import { useMutation, UseMutationOptions, QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCallback } from 'react';

interface SupabaseMutationOptions<TData, TError, TVariables, TContext> extends UseMutationOptions<TData, TError, TVariables, TContext> {
  successMessage?: string;
  errorMessage?: string;
}

export const useSupabaseMutation = <TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  mutationFn: UseMutationOptions<TData, TError, TVariables, TContext>['mutationFn'], // mutationFn is now a required parameter
  options?: Omit<SupabaseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> // Omit mutationFn from options
) => {
  const { successMessage, errorMessage, onSuccess: originalOnSuccess, onError: originalOnError, ...restOptions } = options || {};

  const onSuccess = useCallback(
    (data: TData, variables: TVariables, context: TContext | undefined) => {
      if (successMessage) {
        toast.success(successMessage);
      }
      originalOnSuccess?.(data, variables, context);
    },
    [successMessage, originalOnSuccess]
  );

  const onError = useCallback(
    (error: TError, variables: TVariables, context: TContext | undefined) => {
      const message = errorMessage || 'An unexpected error occurred.';
      toast.error(message, { description: (error as Error).message });
      originalOnError?.(error, variables, context);
    },
    [errorMessage, originalOnError]
  );

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    ...restOptions,
    onSuccess,
    onError,
  });
};