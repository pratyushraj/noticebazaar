import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Upload, Play, X, CheckCircle2, AlertCircle, 
    Loader2, Video, Plus, Trash2, Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DiscoveryVideoUploadProps {
    userId: string;
    isDark: boolean;
    discoveryVideoUrl: string | null;
    portfolioVideos: string[] | null;
    onUpdate: (data: { discovery_video_url?: string | null, portfolio_videos?: string[] | null }) => void;
}

export const DiscoveryVideoUpload: React.FC<DiscoveryVideoUploadProps> = ({
    userId,
    isDark,
    discoveryVideoUrl,
    portfolioVideos = [],
    onUpdate
}) => {
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedSlot, setSelectedSlot] = useState<'primary' | number | null>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || selectedSlot === null) return;

        // Validation
        if (!file.type.startsWith('video/')) {
            toast.error('Please select a video file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Video size must be less than 10MB', {
                description: 'Try a shorter clip or compress the video.'
            });
            return;
        }

        setUploadingId(selectedSlot.toString());
        setUploadProgress(10);

        try {
            const fileExt = file.name.split('.').pop();
            const slotName = selectedSlot === 'primary' ? 'hero' : `sample-${selectedSlot}`;
            const filePath = `${userId}/videos/${slotName}_${Date.now()}.${fileExt}`;

            // Upload
            setUploadProgress(30);
            const { error: uploadError, data } = await supabase.storage
                .from('creator-assets')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            setUploadProgress(80);
            const { data: { publicUrl } } = supabase.storage
                .from('creator-assets')
                .getPublicUrl(filePath);

            // Update state and parent
            if (selectedSlot === 'primary') {
                onUpdate({ discovery_video_url: publicUrl });
            } else {
                const newPortfolio = [...(portfolioVideos || [])];
                newPortfolio[selectedSlot as number] = publicUrl;
                onUpdate({ portfolio_videos: newPortfolio });
            }

            setUploadProgress(100);
            toast.success('Video uploaded successfully!');
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Failed to upload video', { description: error.message });
        } finally {
            setUploadingId(null);
            setUploadProgress(0);
            setSelectedSlot(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeVideo = (slot: 'primary' | number) => {
        if (slot === 'primary') {
            onUpdate({ discovery_video_url: null });
        } else {
            const newPortfolio = [...(portfolioVideos || [])];
            newPortfolio.splice(slot as number, 1);
            onUpdate({ portfolio_videos: newPortfolio });
        }
        toast.info('Video removed');
    };

    const VideoSlot = ({ 
        slot, 
        url, 
        label, 
        isPrimary = false 
    }: { 
        slot: 'primary' | number, 
        url: string | null, 
        label: string, 
        isPrimary?: boolean 
    }) => {
        const isCurrentUploading = uploadingId === slot.toString();
        
        return (
            <div className="flex flex-col gap-2">
                <div className={cn(
                    "relative rounded-2xl border aspect-[9/16] overflow-hidden group transition-all duration-300",
                    isDark ? "bg-[#0B1324] border-white/5" : "bg-slate-100 border-slate-200",
                    isPrimary ? "ring-2 ring-primary/20" : ""
                )}>
                    {url ? (
                        <>
                            <video 
                                src={url} 
                                className="w-full h-full object-cover"
                                muted 
                                loop 
                                playsInline
                                onMouseOver={e => e.currentTarget.play()}
                                onMouseOut={e => e.currentTarget.pause()}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                <button 
                                    onClick={() => removeVideo(slot)}
                                    className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="text-[10px] text-white font-bold px-2 py-1 bg-white/10 backdrop-blur-md rounded-lg">
                                    Preview
                                </div>
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={() => { setSelectedSlot(slot); fileInputRef.current?.click(); }}
                            disabled={!!uploadingId}
                            className="w-full h-full flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
                        >
                            {isCurrentUploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="relative w-12 h-12">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path
                                                className={isDark ? "stroke-white/10" : "stroke-slate-200"}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                strokeWidth="3"
                                            />
                                            <motion.path
                                                className="stroke-primary"
                                                strokeDasharray={`${uploadProgress}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-primary uppercase">Uploading</span>
                                </div>
                            ) : (
                                <>
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center",
                                        isDark ? "bg-white/5 text-white/40" : "bg-white text-slate-400 shadow-sm"
                                    )}>
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className={cn("text-[10px] font-bold uppercase tracking-wider opacity-60", isDark ? "text-white" : "text-slate-600")}>
                                        Upload
                                    </span>
                                </>
                            )}
                        </button>
                    )}
                    
                    {isPrimary && (
                        <div className="absolute top-3 left-3 bg-primary text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-lg shadow-primary/20">
                            Hero Pitch
                        </div>
                    )}
                </div>
                <p className={cn("text-[10px] font-bold uppercase tracking-widest text-center opacity-40", isDark ? "text-white" : "text-slate-900")}>
                    {label}
                </p>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="video/*" 
                className="hidden" 
            />

            <div className="grid grid-cols-2 gap-4">
                {/* Hero Pitch Slot */}
                <VideoSlot 
                    slot="primary" 
                    url={discoveryVideoUrl} 
                    label="Discovery Pitch" 
                    isPrimary={true} 
                />

                {/* Vertical scroll or grid for portfolo */}
                <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
                    {[0, 1, 2].map((idx) => (
                        <div key={idx} className={idx === 2 ? "col-span-2" : ""}>
                            <VideoSlot 
                                slot={idx} 
                                url={portfolioVideos?.[idx] || null} 
                                label={`Work ${idx + 1}`} 
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className={cn(
                "p-4 rounded-2xl border flex items-start gap-4",
                isDark ? "bg-blue-500/5 border-blue-500/10" : "bg-blue-50 border-blue-100"
            )}>
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className={cn("text-[13px] font-bold", isDark ? "text-blue-100" : "text-blue-900")}>Discovery Guidelines</p>
                    <ul className={cn("text-[11px] font-medium opacity-70 list-disc pl-4 space-y-1", isDark ? "text-blue-100" : "text-blue-800")}>
                        <li>Vertical (9:16) aspect ratio works best</li>
                        <li>Keep Discovery Pitch under 20 seconds</li>
                        <li>Muted videos autoplay for brands - be visual!</li>
                        <li>Max file size: 10MB per video</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
