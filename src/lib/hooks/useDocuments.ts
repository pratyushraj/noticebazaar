import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Document } from '@/types';
import { useSupabaseQuery } from './useSupabaseQuery';
import { useSupabaseMutation } from './useSupabaseMutation';

interface UseDocumentsOptions {
  clientId?: string;
  enabled?: boolean;
  page?: number; // New: current page number (1-indexed)
  pageSize?: number; // New: number of items per page
  limit?: number; // New: limit the number of results
  joinProfile?: boolean; // New option to control joining
  isFavorite?: boolean; // New: filter by favorite status
  searchTerm?: string; // New: search by document name
  caseId?: string | null; // New: filter by case ID
  categoryId?: string | null; // New: filter by category ID
  statusFilter?: Document['status'] | 'All'; // New: filter by document status
  sortBy?: 'uploaded_at' | 'name'; // New: sort by column
  sortOrder?: 'asc' | 'desc'; // New: sort order
}

export const useDocuments = (options?: UseDocumentsOptions) => {
  const { 
    clientId, 
    enabled = true, 
    page, 
    pageSize, 
    limit, 
    joinProfile = true, 
    isFavorite,
    searchTerm,
    caseId,
    categoryId, // Added categoryId
    statusFilter,
    sortBy = 'uploaded_at', // Default sort by uploaded_at
    sortOrder = 'desc', // Default sort order descending
  } = options || {};

  return useSupabaseQuery<{ data: Document[], count: number | null }, Error>(
    ['documents', clientId, page, pageSize, limit, joinProfile, isFavorite, searchTerm, caseId, categoryId, statusFilter, sortBy, sortOrder],
    async () => {
      // Join profiles, cases, and categories
      const selectStatement = `
        *,
        profiles!client_id(first_name, last_name),
        cases!case_id(title),
        categories!category_id(name, is_system_category)
      `;

      let query = supabase
        .from('documents')
        .select(selectStatement, { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' }); // Apply sorting here

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (isFavorite !== undefined) {
        query = query.eq('is_favorite', isFavorite);
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      // Filter by caseId or categoryId, or for unlinked documents
      if (caseId !== undefined) {
        if (caseId === null) {
          // Documents not linked to any case
          query = query.is('case_id', null);
        } else {
          query = query.eq('case_id', caseId);
        }
      }

      if (categoryId !== undefined) {
        if (categoryId === null) {
          // Documents not linked to any category
          query = query.is('category_id', null);
        } else {
          query = query.eq('category_id', categoryId);
        }
      }
      
      if (statusFilter && statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      if (limit && !page && !pageSize) {
        query = query.limit(limit);
      } else if (page && pageSize) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }
      return { data: data as Document[], count };
    },
    {
      enabled: enabled,
      errorMessage: 'Failed to fetch documents',
    }
  );
};

export const useDocumentById = (documentId: string | undefined, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {};

  return useSupabaseQuery<Document, Error>(
    ['document', documentId],
    async () => {
      if (!documentId) {
        throw new Error('Document ID is required');
      }
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *, 
          profiles!client_id(first_name, last_name),
          cases!case_id(title),
          categories!category_id(name, is_system_category)
        `)
        .eq('id', documentId)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as Document;
    },
    {
      enabled: enabled && !!documentId,
      errorMessage: 'Failed to fetch document details',
    }
  );
};

interface AddDocumentVariables {
  file?: File | null; // Made optional and allows null
  documentName: string;
  userId: string;
  profileId: string;
  caseId?: string | null;
  categoryId?: string | null;
  status?: Document['status'];
  url?: string; // Added optional URL field
}

export const useAddDocument = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, AddDocumentVariables>(
    async ({ file, documentName, userId, profileId, caseId = null, categoryId = null, status = 'Approved', url: providedUrl }) => {
      let finalDocumentUrl: string | null = providedUrl || null;

      // Only attempt to upload if a file is provided AND it has content
      if (file && file.size > 0) {
        const fileExtension = file.name.split('.').pop();
        
        // Sanitize the document name to create a safe filename
        const sanitizedDocumentName = documentName
          .trim()
          .replace(/\s/g, '_') // Replace spaces with underscores
          .replace(/[^a-zA-Z0-9_.-]/g, ''); // Remove any other invalid characters

        const filePath = `${userId}/${Date.now()}-${sanitizedDocumentName}.${fileExtension}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('client-documents')
          .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
          // Attempt to remove the uploaded file if public URL cannot be retrieved
          await supabase.storage.from('client-documents').remove([filePath]);
          throw new Error('Failed to get public URL for the uploaded document.');
        }
        finalDocumentUrl = publicUrlData.publicUrl;
      } else if (!finalDocumentUrl) { // If no file (or empty file) and no URL provided, use a generic placeholder
        finalDocumentUrl = 'https://example.com/placeholder-document.pdf'; // A generic placeholder URL
      }

      if (!finalDocumentUrl) {
        throw new Error('Document URL is missing after upload or explicit provision.');
      }

      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          client_id: profileId,
          name: documentName.trim(),
          url: finalDocumentUrl,
          is_favorite: false, // Default to not favorite on upload
          case_id: caseId, // Insert caseId
          category_id: categoryId, // Insert categoryId
          status: status, // Insert status
        });

      if (insertError) {
        // Attempt to remove the uploaded file if database insert fails
        if (file && file.size > 0 && finalDocumentUrl && finalDocumentUrl.includes(userId)) { // Check if it's an uploaded file
          const filePath = finalDocumentUrl.split('/client-documents/')[1];
          await supabase.storage.from('client-documents').remove([filePath]);
        }
        throw new Error(`Failed to record document in database: ${insertError.message}`);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      },
      errorMessage: 'Failed to upload document',
    }
  );
};

interface UpdateDocumentVariables {
  id: string;
  is_favorite?: boolean;
  name?: string;
  status?: Document['status']; // Added status for updates
  case_id?: string | null; // Added case_id for updates
  category_id?: string | null; // Added category_id for updates
}

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, UpdateDocumentVariables>(
    async ({ id, ...updates }) => {
      const { error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      },
      errorMessage: 'Failed to update document',
    }
  );
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useSupabaseMutation<void, Error, { id: string; url: string }>(
    async ({ id, url }) => {
      // Only attempt to delete from storage if the URL is not a placeholder
      if (url && !url.includes('example.com/placeholder-document.pdf')) { // Check for placeholder URL
        const urlParts = url.split('/client-documents/');
        if (urlParts.length < 2) {
          // If it's not a placeholder and not a valid Supabase URL, log and continue to DB delete
          console.warn('Invalid document URL for storage deletion, skipping storage removal:', url);
        } else {
          const filePath = urlParts[1];
          const { error: storageError } = await supabase.storage
            .from('client-documents')
            .remove([filePath]);

          if (storageError) {
            throw new Error(`Failed to delete file from storage: ${storageError.message}`);
          }
        }
      }

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (dbError) {
        throw new Error(`Failed to delete document record: ${dbError.message}`);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['activity_log'] });
      },
      successMessage: 'Document deleted successfully!',
      errorMessage: 'Failed to delete document',
    }
  );
};