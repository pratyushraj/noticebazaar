
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

export interface SignatureStatus {
    signed: boolean;
    signedAt?: string;
    signerEmail?: string;
    signerName?: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface DealSignatures {
    creatorSignature: SignatureStatus | null;
    brandSignature: SignatureStatus | null;
    isCreatorSigned: boolean;
    isBrandSigned: boolean;
}

export const useDealSignatures = (dealId: string | undefined, enabled: boolean = true) => {
    const { session } = useSession();

    return useQuery({
        queryKey: ['deal-signatures', dealId],
        enabled: !!dealId && !!session?.access_token && enabled,
        refetchInterval: (query) => {
            const data = query.state.data as DealSignatures | undefined;
            // Poll every 3 seconds if NOT fully signed (or if data is missing)
            const creatorSigned = data?.isCreatorSigned;
            const brandSigned = data?.isBrandSigned;

            if (creatorSigned && brandSigned) {
                return false; // Stop polling when both are signed
            }
            return 3000; // Poll every 3s otherwise
        },
        refetchOnWindowFocus: true,
        queryFn: async (): Promise<DealSignatures> => {
            if (!dealId) throw new Error('No deal ID');

            // 1. Fetch from Supabase Table (Primary Source)
            // We use 'as any' to bypass strict type checks if the table schema isn't fully generated
            const { data: dbSignatures, error: dbError } = await (supabase
                .from('contract_signatures' as any) as any)
                .select('*')
                .eq('deal_id', dealId);

            if (dbError) throw dbError;

            // Cast to any[] to avoid strict type checking on the rows
            const signatures = (dbSignatures || []) as any[];

            const creatorSigRecord = signatures.find((s: any) => s.signer_role === 'creator' && s.signed === true);
            const brandSigRecord = signatures.find((s: any) => s.signer_role === 'brand' && s.signed === true);

            const brandSigned = !!brandSigRecord;

            return {
                creatorSignature: creatorSigRecord ? {
                    signed: true,
                    signedAt: creatorSigRecord.signed_at,
                    signerEmail: creatorSigRecord.signer_email,
                    signerName: creatorSigRecord.signer_name,
                } : null,
                brandSignature: brandSigned ? {
                    signed: true,
                    signedAt: brandSigRecord?.signed_at || new Date().toISOString(),
                } : null,
                isCreatorSigned: !!creatorSigRecord,
                isBrandSigned: brandSigned
            };
        }
    });
};
