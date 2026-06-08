import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Upload, Play, CheckCircle, Video, FileText, Share2, Loader2, X, Trash2 } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils/api';

interface ShootVideo {
  id: string;
  workspace_id: string;
  file_url: string;
  file_name: string;
  is_selected: boolean;
  uploaded_by: string;
  category: string;
  approved_for_reel?: boolean;
  approved_for_story?: boolean;
  approved_for_ad?: boolean;
}

const SHOOT_CATEGORIES = [
  { id: 'interior', name: 'Interior Shoots', icon: '🏢' },
  { id: 'treatment', name: 'Treatment Shoots', icon: '🦷' },
  { id: 'doctor', name: 'Doctor Shoots', icon: '🩺' },
  { id: 'transform', name: 'Before/After Transform', icon: '✨' }
];

interface ShootWorkspaceProps {
  idOverride?: string;
  roleOverride?: string;
}

const isSafariOrIOS = () => {
  const ua = navigator.userAgent.toLowerCase();
  const isChrome = ua.includes('chrome') || ua.includes('crios');
  const isSafari = ua.includes('safari') && !isChrome;
  const isIOS = /iphone|ipad|ipod/.test(ua);
  return isSafari || isIOS;
};

const VideoThumbnail = ({ src, fileName }: { src: string; fileName: string }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // If it's a MOV file on a non-Safari browser, request a thumbnail from our backend API proxy (using FFmpeg)
    if (fileName.toLowerCase().endsWith('.mov') && !isSafariOrIOS()) {
      const apiUrl = `${getApiBaseUrl()}/api/video-thumbnail?url=${encodeURIComponent(src)}`;
      setThumbnail(apiUrl);
      return;
    }

    const video = document.createElement('video');
    video.src = src;
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.currentTime = 0.5;
    video.muted = true;
    video.playsInline = true;

    const handleSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setThumbnail(dataUrl);
        }
      } catch (err) {
        console.warn('Failed to extract video thumbnail:', err);
        // Fallback to server-side extraction
        const apiUrl = `${getApiBaseUrl()}/api/video-thumbnail?url=${encodeURIComponent(src)}`;
        setThumbnail(apiUrl);
      }
    };

    const handleError = () => {
      // Fallback to server-side extraction
      const apiUrl = `${getApiBaseUrl()}/api/video-thumbnail?url=${encodeURIComponent(src)}`;
      setThumbnail(apiUrl);
    };

    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };
  }, [src, fileName]);

  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900 to-neutral-950 w-full h-full text-center p-3">
        <Video className="w-6 h-6 text-amber-500 mb-1 opacity-70" />
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">MOV Format</span>
        <span className="text-[8px] text-neutral-600 mt-0.5">Click to play/download</span>
      </div>
    );
  }

  if (!thumbnail) {
    return (
      <div className="flex items-center justify-center bg-neutral-900 w-full h-full">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  return (
    <img 
      src={thumbnail} 
      alt="Video thumbnail" 
      className="w-full h-full object-cover" 
      onError={() => {
        // If server-side generation fails (e.g. backend down), trigger textual fallback card
        setFailed(true);
      }}
    />
  );
};

export default function ShootWorkspace({ idOverride, roleOverride }: ShootWorkspaceProps = {}) {
  const { id: routeId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  const id = idOverride || routeId;
  const role = roleOverride || searchParams.get('role') || 'influencer'; // 'influencer' or 'dentist'

  const [workspace, setWorkspace] = useState<any>(null);
  const [videos, setVideos] = useState<ShootVideo[]>([]);
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [activeModalVideo, setActiveModalVideo] = useState<ShootVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [scriptText, setScriptText] = useState('');
  const [songText, setSongText] = useState('');
  const [songText2, setSongText2] = useState('');
  const [hookText, setHookText] = useState('');
  const [hookText2, setHookText2] = useState('');
  const [captionText, setCaptionText] = useState('');
  const [savingScript, setSavingScript] = useState(false);
  const [creatorScriptText, setCreatorScriptText] = useState('');
  const [creatorSongText, setCreatorSongText] = useState('');
  const [creatorSongText2, setCreatorSongText2] = useState('');
  const [creatorHookText, setCreatorHookText] = useState('');
  const [creatorHookText2, setCreatorHookText2] = useState('');
  const [creatorCaptionText, setCreatorCaptionText] = useState('');
  const [savingSuggestions, setSavingSuggestions] = useState(false);
  const [selectedCategoryForUpload, setSelectedCategoryForUpload] = useState('treatment');
  const [guidelineTab, setGuidelineTab] = useState('treatment');

  useEffect(() => {
    if (id) {
      loadWorkspace(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadWorkspace = async (workspaceId: string) => {
    setLoading(true);
    try {
      const { data: wsData, error: wsError } = await supabase
        .from('shoot_workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();
        
      if (wsError) throw wsError;

      const { data: vidData, error: vidError } = await supabase
        .from('shoot_videos')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (vidError) throw vidError;

      // Merge local storage approvals if schema is not updated
      let loadedVideos = (vidData || []) as ShootVideo[];
      try {
        const storedApprovalsStr = localStorage.getItem(`shoot_approvals_${workspaceId}`);
        if (storedApprovalsStr) {
          const storedApprovals = JSON.parse(storedApprovalsStr);
          loadedVideos = loadedVideos.map(v => {
            const approval = storedApprovals.find((a: any) => a.id === v.id);
            if (approval) {
              return {
                ...v,
                approved_for_reel: approval.approved_for_reel ?? v.approved_for_reel,
                approved_for_story: approval.approved_for_story ?? v.approved_for_story,
                approved_for_ad: approval.approved_for_ad ?? v.approved_for_ad
              };
            }
            return v;
          });
        }
      } catch (err) {
        console.warn('Failed to parse stored approvals:', err);
      }

      setWorkspace(wsData);
      setScriptText(wsData.script || '');
      setSongText(wsData.song_option || '');
      setSongText2(wsData.song_option_2 || '');
      setHookText(wsData.hook_option || '');
      setHookText2(wsData.hook_option_2 || '');
      setCaptionText(wsData.caption_option || '');
      setCreatorScriptText(wsData.creator_script || '');
      setCreatorSongText(wsData.creator_song || '');
      setCreatorSongText2(wsData.creator_song_2 || '');
      setCreatorHookText(wsData.creator_hook || '');
      setCreatorHookText2(wsData.creator_hook_2 || '');
      setCreatorCaptionText(wsData.creator_caption || '');
      setVideos(loadedVideos);
    } catch (error: any) {
      console.error('Error loading workspace:', error);
      if (error.code === '42P01') {
        toast.error('Database tables not migrated yet. Showing mock data.');
        const songParam = searchParams.get('song') || '';
        const song2Param = searchParams.get('song2') || '';
        const hookParam = searchParams.get('hook') || '';
        const hook2Param = searchParams.get('hook2') || '';
        const captionParam = searchParams.get('caption') || '';
        setWorkspace({ 
          id: workspaceId, 
          title: 'Patliputra Dental Clinic Shoot', 
          song_option: songParam, 
          song_option_2: song2Param,
          hook_option: hookParam,
          hook_option_2: hook2Param,
          caption_option: captionParam,
          script: '1. Start with a premium pan shot of the clinic reception.\n2. Cut to the modern operatory chair explaining patient comfort.\n3. Close-up of Veneer before/after reveal!',
          creator_script: 'Hey everyone, today we are visiting Patliputra Clinic!',
          creator_song: 'Aesthetic Lo-fi Beats',
          creator_song_2: 'Trending Dental Pop track',
          creator_hook: 'Stop brushing your teeth like this!',
          creator_hook_2: '3 mistakes you make at the dentist!',
          creator_caption: 'Healthy teeth aesthetic vlog!'
        });
        setScriptText('1. Start with a premium pan shot of the clinic reception.\n2. Cut to the modern operatory chair explaining patient comfort.\n3. Close-up of Veneer before/after reveal!');
        setSongText(songParam);
        setSongText2(song2Param);
        setHookText(hookParam || 'Stop brushing your teeth like this!');
        setHookText2(hook2Param || '3 mistakes you make at the dentist!');
        setCaptionText(captionParam || 'Healthy teeth aesthetic vlog!');
        setCreatorScriptText('Hey everyone, today we are visiting Patliputra Clinic!');
        setCreatorSongText('Aesthetic Lo-fi Beats');
        setCreatorSongText2('Trending Dental Pop track');
        setCreatorHookText('Stop brushing your teeth like this!');
        setCreatorHookText2('3 mistakes you make at the dentist!');
        setCreatorCaptionText('Healthy teeth aesthetic vlog!');
        setVideos([
          { id: '1', workspace_id: workspaceId, file_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', file_name: 'clinic_tour_aesthetic.mp4', is_selected: true, uploaded_by: 'influencer', category: 'interior' },
          { id: '2', workspace_id: workspaceId, file_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', file_name: 'laser_whitening_setup.mp4', is_selected: false, uploaded_by: 'influencer', category: 'treatment' },
          { id: '3', workspace_id: workspaceId, file_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', file_name: 'doctor_intro_parmar.mp4', is_selected: true, uploaded_by: 'influencer', category: 'doctor' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!workspace) return;

    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const normalizedExt = (fileExt === 'mov' || fileExt === 'quicktime') ? 'mp4' : fileExt;
    const fileName = `${Math.random()}.${normalizedExt}`;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const filePath = user 
        ? `${user.id}/shoot-assets/${workspace.id}/${fileName}`
        : `shoot-assets/${workspace.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('creator-assets')
        .upload(filePath, file, {
          contentType: 'video/mp4',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('creator-assets')
        .getPublicUrl(filePath);

      const { data: newVideo, error: dbError } = await supabase
        .from('shoot_videos')
        .insert({
          workspace_id: workspace.id,
          file_url: publicUrlData.publicUrl,
          file_name: file.name,
          category: selectedCategoryForUpload,
          uploaded_by: role
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setVideos([...videos, newVideo]);
      toast.success('Video uploaded successfully!');

      // Trigger server-side transcoding for MOV files to guarantee compatibility across all browsers/Chrome
      if (file.name.toLowerCase().endsWith('.mov')) {
        const transcodeToast = toast.loading('Processing & standardizing video container for compatibility...');
        try {
          const transcodeRes = await fetch(`${getApiBaseUrl()}/api/video-transcode`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ videoId: newVideo.id })
          });
          const transcodeData = await transcodeRes.json();
          if (transcodeRes.ok && transcodeData.success) {
            toast.dismiss(transcodeToast);
            toast.success('Video processed successfully! Universal preview ready.');
             // Update the local video state with the new MP4 filename and the cache-busted transcoded URL
             setVideos(prev => prev.map(v => v.id === newVideo.id ? { 
               ...v, 
               file_name: v.file_name.replace(/\.mov$/i, '.mp4'),
               file_url: transcodeData.file_url || v.file_url 
             } : v));
          } else {
            toast.dismiss(transcodeToast);
            toast.warning('Processing failed, but raw video is uploaded.');
          }
        } catch (transcodeErr) {
          console.error('Transcode trigger error:', transcodeErr);
          toast.dismiss(transcodeToast);
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      if (error.message?.includes('fetch') || error.code === '42P01') {
        const mockUrl = URL.createObjectURL(file);
        const newMockVideo: ShootVideo = {
          id: Math.random().toString(),
          workspace_id: workspace.id,
          file_url: mockUrl,
          file_name: file.name,
          category: selectedCategoryForUpload,
          is_selected: false,
          uploaded_by: role
        };
        setVideos([...videos, newMockVideo]);
        toast.info('Uploaded locally to mock memory.');
      } else {
        toast.error('Failed to upload video');
      }
    } finally {
      setUploading(false);
    }
  };

  const deleteVideo = async (video: ShootVideo) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${video.file_name}"?`);
    if (!confirmDelete) return;

    try {
      // 1. Delete from DB
      const { error: dbError } = await supabase
        .from('shoot_videos')
        .delete()
        .eq('id', video.id);

      if (dbError) throw dbError;

      // 2. Delete from Storage (ignore errors since delete policy might restrict public delete)
      try {
        const urlParts = video.file_url.split('/creator-assets/');
        if (urlParts.length >= 2) {
          const storagePath = urlParts[1];
          await supabase.storage
            .from('creator-assets')
            .remove([storagePath]);
        }
      } catch (storageErr) {
        console.warn('Storage cleanup failed (ignoring):', storageErr);
      }

      setVideos(prev => prev.filter(v => v.id !== video.id));
      toast.success('Video deleted successfully.');
    } catch (error: any) {
      console.error('Delete error:', error);
      
      // Fallback for mock/local memory state deletion
      if (error.message?.includes('fetch') || error.code === '42P01') {
        setVideos(prev => prev.filter(v => v.id !== video.id));
        toast.info('Deleted from local mock memory.');
      } else {
        toast.error('Failed to delete video');
      }
    }
  };

  const toggleVideoSelection = async (videoId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('shoot_videos')
        .update({ is_selected: !currentStatus })
        .eq('id', videoId);

      if (error) throw error;

      setVideos(videos.map(v => v.id === videoId ? { ...v, is_selected: !currentStatus } : v));
      toast.success('Selection updated');
    } catch (error: any) {
      console.error('Update error:', error);
      setVideos(videos.map(v => v.id === videoId ? { ...v, is_selected: !currentStatus } : v));
      toast.info('Selection updated in mock memory');
    }
  };

  const toggleVideoApproval = async (videoId: string, approvalType: 'reel' | 'story' | 'ad', currentStatus: boolean) => {
    try {
      const field = `approved_for_${approvalType}`;
      const { error } = await supabase
        .from('shoot_videos')
        .update({ [field]: !currentStatus })
        .eq('id', videoId);

      if (error) throw error;

      const updated = videos.map(v => v.id === videoId ? { ...v, [field]: !currentStatus } : v);
      setVideos(updated);
      localStorage.setItem(`shoot_approvals_${id}`, JSON.stringify(updated.map(v => ({
        id: v.id,
        approved_for_reel: v.approved_for_reel,
        approved_for_story: v.approved_for_story,
        approved_for_ad: v.approved_for_ad
      }))));
      toast.success(`Approval for ${approvalType.toUpperCase()} updated`);
    } catch (error: any) {
      console.error('Update error:', error);
      const updated = videos.map(v => v.id === videoId ? { ...v, [`approved_for_${approvalType}`]: !currentStatus } : v);
      setVideos(updated);
      localStorage.setItem(`shoot_approvals_${id}`, JSON.stringify(updated.map(v => ({
        id: v.id,
        approved_for_reel: v.approved_for_reel,
        approved_for_story: v.approved_for_story,
        approved_for_ad: v.approved_for_ad
      }))));
      toast.info(`Updated locally (mock fallback)`);
    }
  };

  const saveScript = async () => {
    if (!workspace) return;
    setSavingScript(true);
    try {
      const { error } = await supabase
        .from('shoot_workspaces')
        .update({ 
          script: scriptText,
          song_option: songText,
          song_option_2: songText2,
          hook_option: hookText,
          hook_option_2: hookText2,
          caption_option: captionText
        })
        .eq('id', workspace.id);

      if (error) throw error;
      toast.success('Production specs & script saved!');
    } catch (error: any) {
      console.error('Script error:', error);
      setWorkspace({ 
        ...workspace, 
        script: scriptText,
        song_option: songText,
        song_option_2: songText2,
        hook_option: hookText,
        hook_option_2: hookText2,
        caption_option: captionText
      });
      toast.info('Saved production options to mock memory');
    } finally {
      setSavingScript(false);
    }
  };

  const saveCreatorSuggestions = async () => {
    if (!workspace) return;
    setSavingSuggestions(true);
    try {
      const { error } = await supabase
        .from('shoot_workspaces')
        .update({ 
          creator_script: creatorScriptText,
          creator_song: creatorSongText,
          creator_song_2: creatorSongText2,
          creator_hook: creatorHookText,
          creator_hook_2: creatorHookText2,
          creator_caption: creatorCaptionText
        })
        .eq('id', workspace.id);

      if (error) throw error;
      toast.success('Suggestions submitted!');
    } catch (error: any) {
      console.error('Suggestions save error:', error);
      setWorkspace({ 
        ...workspace, 
        creator_script: creatorScriptText,
        creator_song: creatorSongText,
        creator_song_2: creatorSongText2,
        creator_hook: creatorHookText,
        creator_hook_2: creatorHookText2,
        creator_caption: creatorCaptionText
      });
      toast.info('Saved suggestions to mock memory');
    } finally {
      setSavingSuggestions(false);
    }
  };

  const getCategoryDetails = (cat: string) => {
    return SHOOT_CATEGORIES.find(c => c.id === cat) || SHOOT_CATEGORIES[1];
  };

  const CATEGORY_GUIDELINES: Record<string, string[]> = {
    interior: [
      'Aesthetic clinic frontage & signage',
      'Clean, spacious waiting lounge & reception',
      'State-of-the-art dental chair setups',
      'Pan shots of premium hygiene/sterilization zones'
    ],
    treatment: [
      'Macro/close-up of advanced dental tech/equipment',
      'Sterilized instruments layout',
      'Patient comfortable and wearing bib/glasses',
      'Gentle close-up treatment procedure shots'
    ],
    doctor: [
      'Warm smile & welcome greeting to camera',
      'Direct advice/talking-head tip presentation',
      'Patient consulting with dental chart/model',
      'Doctor explaining procedures friendly'
    ],
    transform: [
      'High-res close-up of tooth problem/alignment',
      'Patient laughing/talking highlighting the smile',
      'Split-screen style reaction: Mirror reveal!',
      'Clean post-procedure sparkling smile'
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen dark bg-ds-bg flex items-center justify-center text-ds-accent">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!id || !workspace) {
    return (
      <div className="min-h-screen dark bg-ds-bg flex items-center justify-center text-ds-text">
        <p>Workspace not found. Check the URL.</p>
      </div>
    );
  }

  const categoryInfo = getCategoryDetails(guidelineTab);
  const guidelines = CATEGORY_GUIDELINES[guidelineTab] || CATEGORY_GUIDELINES.treatment;

  return (
    <div className="min-h-screen dark bg-ds-bg text-ds-text font-sans antialiased">
      <SEOHead 
        title={`${workspace.title} - Shoot Approval`} 
        description="Collaborative video approval and script feedback workspace." 
        image="https://creatorarmour.com/og-dentist-workspace.png"
      />

      <header className="border-b border-ds-border bg-ds-surface1 p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-black uppercase text-ds-text tracking-wide">{workspace.title}</h1>
            <p className="text-[10px] text-ds-text-muted font-mono uppercase tracking-wider mt-1.5">
              Role: <span className={role === 'dentist' ? 'text-ds-accent font-bold' : 'text-purple-400 font-bold'}>{role}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied!');
              }}
              className="flex items-center gap-2 bg-ds-surface3 hover:bg-ds-hover px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-ds-border text-ds-text"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Link
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <section className="lg:col-span-2 space-y-6">
          {role === 'influencer' && (
            <div className="bg-ds-surface1 border border-ds-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-ds-text-muted">Target Category:</label>
                <select 
                  value={selectedCategoryForUpload} 
                  onChange={(e) => setSelectedCategoryForUpload(e.target.value)}
                  className="bg-ds-surface3 border border-ds-border rounded-lg px-3 py-1.5 text-xs text-ds-text outline-none focus:border-ds-accent/50"
                >
                  {SHOOT_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              
              <label className="cursor-pointer bg-gradient-to-r from-ds-accent to-purple-600 hover:opacity-90 text-white px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Upload Clip to Category
                <input type="file" className="hidden" accept="video/*" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
          )}

          <div className="space-y-8">
            {SHOOT_CATEGORIES.map(cat => {
              const catVideos = videos.filter(v => v.category === cat.id);
              return (
                <div key={cat.id} className="bg-ds-surface2 border border-ds-border/50 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-ds-border pb-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-ds-text flex items-center gap-2">
                      <span className="text-sm">{cat.icon}</span> 
                      <span>{cat.name}</span>
                    </h3>
                    <span className="bg-ds-surface3 border border-ds-border text-ds-text-muted px-2.5 py-0.5 rounded-full text-[9px] font-mono">
                      {catVideos.length} {catVideos.length === 1 ? 'video' : 'videos'}
                    </span>
                  </div>
                  
                  {catVideos.length === 0 ? (
                    <div className="py-6 text-center text-xs text-ds-text-subtle border border-dashed border-ds-border rounded-xl bg-ds-bg/40">
                      No clips uploaded under this category yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {catVideos.map(video => (
                        <div key={video.id} className={`bg-ds-surface1 border rounded-xl overflow-hidden group ${video.is_selected ? 'border-ds-accent/60 shadow-[0_0_15px_var(--ds-accent-soft)]' : 'border-ds-border'}`}>
                          <div 
                            className="aspect-video bg-black relative flex items-center justify-center w-full cursor-pointer overflow-hidden group/thumb"
                            onClick={() => setActiveModalVideo(video)}
                          >
                            <VideoThumbnail src={video.file_url} fileName={video.file_name} />
                            
                            {/* Hover overlay with play button */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-all duration-200">
                              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white scale-90 group-hover/thumb:scale-100 transition-all duration-250 hover:bg-white/30">
                                <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                              </div>
                            </div>

                            {video.is_selected && (
                              <div className="absolute top-2 right-2 bg-ds-accent text-white px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg z-10">
                                <CheckCircle className="w-3 h-3" /> Selected
                              </div>
                            )}
                          </div>
                          
                          <div className="p-3 flex justify-between items-center gap-2 border-b border-ds-border/30">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteVideo(video);
                                }}
                                className="text-ds-text-subtle hover:text-rose-500 p-1 rounded hover:bg-ds-surface3 transition-colors shrink-0"
                                title="Delete video"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <p className="text-xs font-mono truncate text-ds-text-muted">{video.file_name}</p>
                            </div>
                            
                            {role === 'dentist' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleVideoSelection(video.id, video.is_selected);
                                }}
                                className={`text-[10px] px-2.5 py-1 rounded font-black uppercase transition-all shrink-0 ${video.is_selected ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                              >
                                {video.is_selected ? 'Deselect' : 'Select'}
                              </button>
                            )}
                          </div>

                          {/* Content Selection Mode approvals */}
                          <div className="px-3 py-2 flex flex-wrap gap-1.5 items-center justify-between bg-ds-bg/30">
                            <span className="text-[8px] font-black uppercase tracking-wider text-ds-text-subtle">Approvals:</span>
                            <div className="flex gap-1">
                              {role === 'dentist' ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleVideoApproval(video.id, 'reel', !!video.approved_for_reel);
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all border ${
                                      video.approved_for_reel 
                                        ? 'bg-ds-accent-soft text-ds-accent border-ds-accent-soft-border font-black' 
                                        : 'bg-ds-surface3 text-ds-text-subtle border-ds-border hover:text-ds-text'
                                    }`}
                                  >
                                    🎬 Reel
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleVideoApproval(video.id, 'story', !!video.approved_for_story);
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all border ${
                                      video.approved_for_story 
                                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 font-black' 
                                        : 'bg-ds-surface3 text-ds-text-subtle border-ds-border hover:text-ds-text'
                                    }`}
                                  >
                                    📖 Story
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleVideoApproval(video.id, 'ad', !!video.approved_for_ad);
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all border ${
                                      video.approved_for_ad 
                                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-black' 
                                        : 'bg-ds-surface3 text-ds-text-subtle border-ds-border hover:text-ds-text'
                                    }`}
                                  >
                                    📢 Ad
                                  </button>
                                </>
                              ) : (
                                <>
                                  {video.approved_for_reel && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-ds-accent-soft text-ds-accent border border-ds-accent-soft-border">
                                      🎬 Reel
                                    </span>
                                  )}
                                  {video.approved_for_story && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                      📖 Story
                                    </span>
                                  )}
                                  {video.approved_for_ad && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      📢 Ad
                                    </span>
                                  )}
                                  {!video.approved_for_reel && !video.approved_for_story && !video.approved_for_ad && (
                                    <span className="text-[8px] font-black uppercase text-ds-text-subtle italic">Pending Review</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-ds-surface1 border border-ds-border rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-ds-text flex items-center gap-2">
              <span>📋</span> Guidelines Directory
            </h3>

            {workspace.song_option && (
              <div className="bg-ds-accent-soft border border-ds-accent-soft-border rounded-lg p-3 flex items-start gap-2.5">
                <span className="text-ds-accent mt-0.5">🎵</span>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-ds-accent">Background Audio / Song 1</div>
                  <div className="text-xs text-ds-text font-bold mt-0.5 select-all">{workspace.song_option}</div>
                </div>
              </div>
            )}

            {workspace.song_option_2 && (
              <div className="bg-ds-accent-soft border border-ds-accent-soft-border rounded-lg p-3 flex items-start gap-2.5">
                <span className="text-ds-accent mt-0.5">🎵</span>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-ds-accent">Background Audio / Song 2</div>
                  <div className="text-xs text-ds-text font-bold mt-0.5 select-all">{workspace.song_option_2}</div>
                </div>
              </div>
            )}

            {workspace.hook_option && (
              <div className="bg-ds-surface3 border border-ds-border rounded-lg p-3 flex items-start gap-2.5">
                <span className="text-ds-accent mt-0.5">🪝</span>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-ds-accent">Video Hook 1</div>
                  <div className="text-xs text-ds-text font-bold mt-0.5 select-all">{workspace.hook_option}</div>
                </div>
              </div>
            )}

            {workspace.hook_option_2 && (
              <div className="bg-ds-surface3 border border-ds-border rounded-lg p-3 flex items-start gap-2.5">
                <span className="text-ds-accent mt-0.5">🪝</span>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-ds-accent">Video Hook 2</div>
                  <div className="text-xs text-ds-text font-bold mt-0.5 select-all">{workspace.hook_option_2}</div>
                </div>
              </div>
            )}

            {workspace.caption_option && (
              <div className="bg-ds-surface3 border border-ds-border rounded-lg p-3 flex items-start gap-2.5">
                <span className="text-ds-accent mt-0.5">📝</span>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-ds-accent">Video Caption</div>
                  <div className="text-xs text-ds-text font-bold mt-0.5 select-all">{workspace.caption_option}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-1 border border-ds-border rounded-lg p-0.5 bg-ds-surface3">
              {SHOOT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setGuidelineTab(cat.id)}
                  title={cat.name}
                  className={`py-1 rounded text-center text-xs transition-all ${guidelineTab === cat.id ? 'bg-ds-accent-soft text-ds-accent border border-ds-accent-soft-border shadow-sm' : 'text-ds-text-subtle hover:text-ds-text'}`}
                >
                  {cat.icon}
                </button>
              ))}
            </div>

            <div className="bg-ds-surface3 border border-ds-border rounded-lg p-3.5 space-y-2.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-ds-text flex items-center gap-1.5">
                <span>{categoryInfo.icon}</span>
                <span>{categoryInfo.name}</span>
              </div>
              <ul className="space-y-2">
                {guidelines.map((guide, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-ds-text-muted leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-ds-accent mt-1.5 shrink-0" />
                    <span>{guide}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Final Script & Song Section */}
          <div className="bg-ds-surface1 border border-ds-border rounded-xl p-5 flex flex-col space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-ds-text flex items-center gap-2">
              <FileText className="w-4 h-4 text-ds-accent" /> Final Production specs
            </h3>
            
            <div className="space-y-4 bg-ds-surface2/30 border border-ds-border rounded-lg p-3">
              {role === 'dentist' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-ds-text-muted mb-1">Final Background Audio 1</label>
                    <input 
                      type="text"
                      value={songText}
                      onChange={(e) => setSongText(e.target.value)}
                      placeholder="e.g., Trending Instagram audio track, upbeat jazz"
                      className="w-full bg-ds-surface3 border border-ds-border rounded-lg px-3 py-1.5 text-xs text-ds-text placeholder:text-ds-text-subtle focus:border-ds-accent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-ds-text-muted mb-1">Final Background Audio 2</label>
                    <input 
                      type="text"
                      value={songText2}
                      onChange={(e) => setSongText2(e.target.value)}
                      placeholder="e.g., Soft instrumental, second audio option"
                      className="w-full bg-ds-surface3 border border-ds-border rounded-lg px-3 py-1.5 text-xs text-ds-text placeholder:text-ds-text-subtle focus:border-ds-accent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-ds-text-muted mb-1">Final Video Hook 1</label>
                    <input 
                      type="text"
                      value={hookText}
                      onChange={(e) => setHookText(e.target.value)}
                      placeholder="e.g., Did you know scaling doesn't loosen teeth?"
                      className="w-full bg-ds-surface3 border border-ds-border rounded-lg px-3 py-1.5 text-xs text-ds-text placeholder:text-ds-text-subtle focus:border-ds-accent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-ds-text-muted mb-1">Final Video Hook 2</label>
                    <input 
                      type="text"
                      value={hookText2}
                      onChange={(e) => setHookText2(e.target.value)}
                      placeholder="e.g., Stop brushing your teeth like this!"
                      className="w-full bg-ds-surface3 border border-ds-border rounded-lg px-3 py-1.5 text-xs text-ds-text placeholder:text-ds-text-subtle focus:border-ds-accent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-ds-text-muted mb-1">Final Video Caption</label>
                    <textarea
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                      placeholder="e.g., Healthy smiles start here! Book consult today."
                      className="w-full h-32 bg-ds-surface3 border border-ds-border rounded-lg p-3 text-xs text-ds-text placeholder:text-ds-text-subtle focus:border-ds-accent outline-none resize-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-ds-text-muted mb-1">Final Script directions</label>
                    <textarea
                      value={scriptText}
                      onChange={(e) => setScriptText(e.target.value)}
                      placeholder="Write the final script and directions here..."
                      className="w-full h-64 bg-ds-surface3 border border-ds-border rounded-lg p-3 text-xs text-ds-text placeholder:text-ds-text-subtle focus:border-ds-accent outline-none resize-none transition-all"
                    />
                  </div>

                  <button 
                    onClick={saveScript}
                    disabled={savingScript}
                    className="w-full bg-ds-accent hover:bg-ds-accent-2 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {savingScript ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Save Production Specs
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {workspace.song_option ? (
                    <div className="bg-ds-accent-soft border border-ds-accent-soft-border rounded-lg p-2.5 flex items-start gap-2">
                      <span className="text-ds-accent text-xs">🎵</span>
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-wider text-ds-accent">Chosen Background Audio 1</div>
                        <div className="text-xs text-ds-text font-bold mt-0.5 select-all">{workspace.song_option}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-ds-text-subtle italic">No final audio 1 specified yet.</div>
                  )}

                  {workspace.song_option_2 ? (
                    <div className="bg-ds-accent-soft border border-ds-accent-soft-border rounded-lg p-2.5 flex items-start gap-2">
                      <span className="text-ds-accent text-xs">🎵</span>
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-wider text-ds-accent">Chosen Background Audio 2</div>
                        <div className="text-xs text-ds-text font-bold mt-0.5 select-all">{workspace.song_option_2}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-ds-text-subtle italic">No final audio 2 specified yet.</div>
                  )}

                  {workspace.hook_option ? (
                    <div className="bg-ds-surface3 border border-ds-border rounded-lg p-2.5 flex items-start gap-2">
                      <span className="text-ds-accent text-xs">🪝</span>
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-wider text-ds-accent">Chosen Video Hook 1</div>
                        <div className="text-xs text-ds-text font-bold mt-0.5 select-all">{workspace.hook_option}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-ds-text-subtle italic">No final hook 1 specified yet.</div>
                  )}

                  {workspace.hook_option_2 ? (
                    <div className="bg-ds-surface3 border border-ds-border rounded-lg p-2.5 flex items-start gap-2">
                      <span className="text-ds-accent text-xs">🪝</span>
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-wider text-ds-accent">Chosen Video Hook 2</div>
                        <div className="text-xs text-ds-text font-bold mt-0.5 select-all">{workspace.hook_option_2}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-ds-text-subtle italic">No final hook 2 specified yet.</div>
                  )}

                  {workspace.caption_option ? (
                    <div className="bg-ds-surface3 border border-ds-border rounded-lg p-2.5 flex items-start gap-2">
                      <span className="text-ds-accent text-xs">📝</span>
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-wider text-ds-accent">Chosen Video Caption</div>
                        <div className="text-xs text-ds-text font-bold mt-0.5 select-all">{workspace.caption_option}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-ds-text-subtle italic">No final caption specified yet.</div>
                  )}

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-ds-text-muted mb-1">Final Script</div>
                    {workspace.script ? (
                      <p className="text-xs text-ds-text-muted whitespace-pre-wrap leading-relaxed bg-ds-surface3 border border-ds-border rounded p-2.5 font-mono">{workspace.script}</p>
                    ) : (
                      <div className="text-[10px] text-ds-text-subtle italic bg-ds-surface3 border border-dashed border-ds-border p-3 rounded text-center">
                        The dentist will save the final script here.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Creator Suggestions Section */}
          <div className="bg-ds-surface1 border border-ds-border rounded-xl p-5 flex flex-col space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-ds-text flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" /> Creator Suggestions
            </h3>
            
            <div className="space-y-4 bg-ds-surface2/30 border border-ds-border rounded-lg p-3">
              {role === 'influencer' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-ds-text-muted mb-1">Suggest a Song / Audio 1</label>
                    <input 
                      type="text"
                      value={creatorSongText}
                      onChange={(e) => setCreatorSongText(e.target.value)}
                      placeholder="e.g., Lofi aesthetic, trending audio link"
                      className="w-full bg-ds-surface3 border border-ds-border rounded-lg px-3 py-1.5 text-xs text-ds-text placeholder:text-ds-text-subtle focus:border-ds-accent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-ds-text-muted mb-1">Suggest a Song / Audio 2</label>
                    <input 
                      type="text"
                      value={creatorSongText2}
                      onChange={(e) => setCreatorSongText2(e.target.value)}
                      placeholder="e.g., Electronic beats, alternate audio track"
                      className="w-full bg-ds-surface3 border border-ds-border rounded-lg px-3 py-1.5 text-xs text-ds-text placeholder:text-ds-text-subtle focus:border-ds-accent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-ds-text-muted mb-1">Suggest a Video Hook 1</label>
                    <input 
                      type="text"
                      value={creatorHookText}
                      onChange={(e) => setCreatorHookText(e.target.value)}
                      placeholder="e.g., 3 mistakes you make at the dentist!"
                      className="w-full bg-ds-surface3 border border-ds-border rounded-lg px-3 py-1.5 text-xs text-ds-text placeholder:text-ds-text-subtle focus:border-ds-accent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-ds-text-muted mb-1">Suggest a Video Hook 2</label>
                    <input 
                      type="text"
                      value={creatorHookText2}
                      onChange={(e) => setCreatorHookText2(e.target.value)}
                      placeholder="e.g., Why scaling is actually good for you!"
                      className="w-full bg-ds-surface3 border border-ds-border rounded-lg px-3 py-1.5 text-xs text-ds-text placeholder:text-ds-text-subtle focus:border-ds-accent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-ds-text-muted mb-1">Suggest a Caption</label>
                    <textarea
                      value={creatorCaptionText}
                      onChange={(e) => setCreatorCaptionText(e.target.value)}
                      placeholder="e.g., Alternative dental vlog caption idea!"
                      className="w-full h-32 bg-ds-surface3 border border-ds-border rounded-lg p-3 text-xs text-ds-text placeholder:text-ds-text-subtle focus:border-ds-accent outline-none resize-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-ds-text-muted mb-1">Suggest Script adjustments</label>
                    <textarea
                      value={creatorScriptText}
                      onChange={(e) => setCreatorScriptText(e.target.value)}
                      placeholder="Suggest video captions or script ideas here..."
                      className="w-full h-64 bg-ds-surface3 border border-ds-border rounded-lg p-3 text-xs text-ds-text placeholder:text-ds-text-subtle focus:border-ds-accent outline-none resize-none transition-all"
                    />
                  </div>

                  <button 
                    onClick={saveCreatorSuggestions}
                    disabled={savingSuggestions}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {savingSuggestions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Submit Suggestions
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-ds-text-muted flex justify-between items-center">
                      <span>Suggested Song 1</span>
                      {workspace.creator_song && (
                        <button 
                          onClick={() => {
                            setSongText(workspace.creator_song);
                            toast.success('Song 1 copied to editor input');
                          }}
                          className="text-[9px] text-ds-accent hover:underline font-bold uppercase"
                        >
                          Use Song 1
                        </button>
                      )}
                    </div>
                    {workspace.creator_song ? (
                      <div className="text-xs text-ds-text font-bold select-all mt-1 bg-ds-surface3 border border-ds-border p-2 rounded">
                        🎵 {workspace.creator_song}
                      </div>
                    ) : (
                      <div className="text-[10px] text-ds-text-subtle italic mt-1">No song suggestion 1 yet.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-ds-text-muted flex justify-between items-center">
                      <span>Suggested Song 2</span>
                      {workspace.creator_song_2 && (
                        <button 
                          onClick={() => {
                            setSongText2(workspace.creator_song_2);
                            toast.success('Song 2 copied to editor input');
                          }}
                          className="text-[9px] text-ds-accent hover:underline font-bold uppercase"
                        >
                          Use Song 2
                        </button>
                      )}
                    </div>
                    {workspace.creator_song_2 ? (
                      <div className="text-xs text-ds-text font-bold select-all mt-1 bg-ds-surface3 border border-ds-border p-2 rounded">
                        🎵 {workspace.creator_song_2}
                      </div>
                    ) : (
                      <div className="text-[10px] text-ds-text-subtle italic mt-1">No song suggestion 2 yet.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-ds-text-muted flex justify-between items-center">
                      <span>Suggested Hook 1</span>
                      {workspace.creator_hook && (
                        <button 
                          onClick={() => {
                            setHookText(workspace.creator_hook);
                            toast.success('Hook 1 copied to editor input');
                          }}
                          className="text-[9px] text-ds-accent hover:underline font-bold uppercase"
                        >
                          Use Hook 1
                        </button>
                      )}
                    </div>
                    {workspace.creator_hook ? (
                      <div className="text-xs text-ds-text font-bold select-all mt-1 bg-ds-surface3 border border-ds-border p-2 rounded">
                        🪝 {workspace.creator_hook}
                      </div>
                    ) : (
                      <div className="text-[10px] text-ds-text-subtle italic mt-1">No hook suggestion 1 yet.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-ds-text-muted flex justify-between items-center">
                      <span>Suggested Hook 2</span>
                      {workspace.creator_hook_2 && (
                        <button 
                          onClick={() => {
                            setHookText2(workspace.creator_hook_2);
                            toast.success('Hook 2 copied to editor input');
                          }}
                          className="text-[9px] text-ds-accent hover:underline font-bold uppercase"
                        >
                          Use Hook 2
                        </button>
                      )}
                    </div>
                    {workspace.creator_hook_2 ? (
                      <div className="text-xs text-ds-text font-bold select-all mt-1 bg-ds-surface3 border border-ds-border p-2 rounded">
                        🪝 {workspace.creator_hook_2}
                      </div>
                    ) : (
                      <div className="text-[10px] text-ds-text-subtle italic mt-1">No hook suggestion 2 yet.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-ds-text-muted flex justify-between items-center">
                      <span>Suggested Caption</span>
                      {workspace.creator_caption && (
                        <button 
                          onClick={() => {
                            setCaptionText(workspace.creator_caption);
                            toast.success('Caption copied to editor input');
                          }}
                          className="text-[9px] text-ds-accent hover:underline font-bold uppercase"
                        >
                          Use Caption
                        </button>
                      )}
                    </div>
                    {workspace.creator_caption ? (
                      <div className="text-xs text-ds-text font-bold select-all mt-1 bg-ds-surface3 border border-ds-border p-2 rounded">
                        📝 {workspace.creator_caption}
                      </div>
                    ) : (
                      <div className="text-[10px] text-ds-text-subtle italic mt-1">No caption suggestion yet.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-ds-text-muted flex justify-between items-center">
                      <span>Suggested Script</span>
                      {workspace.creator_script && (
                        <button 
                          onClick={() => {
                            setScriptText(workspace.creator_script);
                            toast.success('Script copied to editor input');
                          }}
                          className="text-[9px] text-ds-accent hover:underline font-bold uppercase"
                        >
                          Use Script
                        </button>
                      )}
                    </div>
                    {workspace.creator_script ? (
                      <p className="text-xs text-ds-text-muted whitespace-pre-wrap leading-relaxed mt-1 bg-ds-surface3 border border-ds-border p-2.5 rounded font-mono">{workspace.creator_script}</p>
                    ) : (
                      <div className="text-[10px] text-ds-text-subtle italic mt-1 bg-ds-surface3 border border-dashed border-ds-border p-3 rounded text-center">
                        Influencer suggestions will display here.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FINAL PRODUCTION HANDOFF PACK */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="bg-ds-surface1 border-2 border-ds-accent/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-ds-accent/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ds-border pb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⭐</span>
              <div>
                <h3 className="text-sm font-black uppercase text-ds-text tracking-widest">Final Production Handoff Pack</h3>
                <p className="text-[9px] text-ds-text-subtle font-mono uppercase tracking-wider mt-0.5">Editor Deliverable Package</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                const reels = videos.filter(v => v.approved_for_reel).map(v => `• ${v.file_name} (${v.file_url})`).join('\n') || 'None';
                const stories = videos.filter(v => v.approved_for_story).map(v => `• ${v.file_name} (${v.file_url})`).join('\n') || 'None';
                const ads = videos.filter(v => v.approved_for_ad).map(v => `• ${v.file_name} (${v.file_url})`).join('\n') || 'None';
                
                const packText = `--- FINAL PRODUCTION HANDOFF PACK ---
WORKSPACE: ${workspace.title}

APPROVED REEL CLIPS:
${reels}

APPROVED STORY CLIPS:
${stories}

APPROVED AD CLIPS:
${ads}

FINAL MUSIC/AUDIO:
Song 1: ${songText || 'Not specified'}
Song 2: ${songText2 || 'Not specified'}

FINAL HOOKS:
Hook 1: ${hookText || 'Not specified'}
Hook 2: ${hookText2 || 'Not specified'}

FINAL CAPTION:
${captionText || 'Not specified'}

FINAL SCRIPT DIRECTIONS:
${scriptText || 'Not specified'}`;

                navigator.clipboard.writeText(packText);
                toast.success('Production Pack copied to clipboard!');
              }}
              className="px-5 py-2.5 bg-ds-accent hover:bg-ds-accent-2 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-2 active:scale-95 animate-pulse"
            >
              📋 Copy Handoff Pack
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-ds-accent">Approved Channel Assets</h4>
                <div className="mt-2.5 space-y-3">
                  <div className="bg-ds-surface2 border border-ds-border rounded-xl p-3 space-y-1.5">
                    <span className="text-[9px] font-black uppercase text-cyan-400">🎬 Approved for Reels:</span>
                    <ul className="text-[10px] text-ds-text-muted space-y-1">
                      {videos.filter(v => v.approved_for_reel).map((v, i) => (
                        <li key={i} className="truncate font-mono">✓ {v.file_name}</li>
                      ))}
                      {videos.filter(v => v.approved_for_reel).length === 0 && (
                        <li className="italic text-ds-text-subtle text-[9px]">No Reel clips approved yet.</li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-ds-surface2 border border-ds-border rounded-xl p-3 space-y-1.5">
                    <span className="text-[9px] font-black uppercase text-purple-400">📖 Approved for Stories:</span>
                    <ul className="text-[10px] text-ds-text-muted space-y-1">
                      {videos.filter(v => v.approved_for_story).map((v, i) => (
                        <li key={i} className="truncate font-mono">✓ {v.file_name}</li>
                      ))}
                      {videos.filter(v => v.approved_for_story).length === 0 && (
                        <li className="italic text-ds-text-subtle text-[9px]">No Story clips approved yet.</li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-ds-surface2 border border-ds-border rounded-xl p-3 space-y-1.5">
                    <span className="text-[9px] font-black uppercase text-amber-400">📢 Approved for Ads:</span>
                    <ul className="text-[10px] text-ds-text-muted space-y-1">
                      {videos.filter(v => v.approved_for_ad).map((v, i) => (
                        <li key={i} className="truncate font-mono">✓ {v.file_name}</li>
                      ))}
                      {videos.filter(v => v.approved_for_ad).length === 0 && (
                        <li className="italic text-ds-text-subtle text-[9px]">No Ad clips approved yet.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-ds-accent">Production Specification Summary</h4>
              <div className="bg-ds-surface2 border border-ds-border rounded-xl p-4 space-y-3.5 text-xs">
                <div>
                  <span className="block text-[8px] font-black text-ds-text-subtle uppercase">Audio Mappings</span>
                  <p className="font-bold text-ds-text mt-0.5">1: {songText || 'Pending'}</p>
                  <p className="font-bold text-ds-text mt-0.5">2: {songText2 || 'Pending'}</p>
                </div>
                <div>
                  <span className="block text-[8px] font-black text-ds-text-subtle uppercase">Hook Mappings</span>
                  <p className="font-bold text-ds-text mt-0.5">1: {hookText || 'Pending'}</p>
                  <p className="font-bold text-ds-text mt-0.5">2: {hookText2 || 'Pending'}</p>
                </div>
                <div>
                  <span className="block text-[8px] font-black text-ds-text-subtle uppercase">Caption Handoff</span>
                  <p className="text-ds-text-muted italic truncate mt-0.5">{captionText || 'Pending'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal (Google Photos style) */}
      {activeModalVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4">
          <div className="relative w-full max-w-4xl bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
              <h3 className="text-sm font-bold truncate text-neutral-200">{activeModalVideo.file_name}</h3>
              <button 
                onClick={() => setActiveModalVideo(null)} 
                className="p-1 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Player Container (Google Photos style fluid sizing) */}
            <div className="flex-1 min-h-[50vh] md:min-h-[60vh] max-h-[75vh] bg-black flex items-center justify-center relative p-2 md:p-4 overflow-hidden">
              {videoErrors[activeModalVideo.id] ? (
                <div className="flex flex-col items-center justify-center p-6 text-center max-w-md">
                  <Video className="w-12 h-12 text-amber-500 mb-3 animate-pulse" />
                  <h4 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">Preview Unplayable on this Browser</h4>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    This video format or codec is not supported by your browser natively. The video has been uploaded successfully. You can download and preview it locally, or view it on a compatible device/browser.
                  </p>
                  <a 
                    href={activeModalVideo.file_url} 
                    download={activeModalVideo.file_name}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Download Video
                  </a>
                </div>
              ) : (
                <video 
                  src={activeModalVideo.file_url} 
                  controls 
                  autoPlay 
                  playsInline 
                  preload="metadata" 
                  onError={() => setVideoErrors(prev => ({ ...prev, [activeModalVideo.id]: true }))}
                  className="max-w-full max-h-[70vh] w-auto h-auto object-contain rounded-lg shadow-2xl" 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
