import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Upload, Play, CheckCircle, Video, FileText, Share2, Loader2 } from 'lucide-react';

interface ShootVideo {
  id: string;
  workspace_id: string;
  file_url: string;
  file_name: string;
  is_selected: boolean;
  uploaded_by: string;
  category: string;
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

export default function ShootWorkspace({ idOverride, roleOverride }: ShootWorkspaceProps = {}) {
  const { id: routeId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  const id = idOverride || routeId;
  const role = roleOverride || searchParams.get('role') || 'influencer'; // 'influencer' or 'dentist'

  const [workspace, setWorkspace] = useState<any>(null);
  const [videos, setVideos] = useState<ShootVideo[]>([]);
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
      setVideos(vidData || []);
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
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `shoot-assets/${workspace.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('creator-assets')
        .upload(filePath, file);

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
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-cyan-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!id || !workspace) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-white">
        <p>Workspace not found. Check the URL.</p>
      </div>
    );
  }

  const categoryInfo = getCategoryDetails(guidelineTab);
  const guidelines = CATEGORY_GUIDELINES[guidelineTab] || CATEGORY_GUIDELINES.treatment;

  return (
    <div className="min-h-screen bg-[#030712] text-[#f3f4f6] font-sans antialiased">
      <SEOHead 
        title={`${workspace.title} - Shoot Approval`} 
        description="Collaborative video approval and script feedback workspace." 
        image="https://creatorarmour.com/og-dentist-workspace.png"
      />

      <header className="border-b border-white/[0.06] bg-[#090d16] p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-black uppercase text-white tracking-wide">{workspace.title}</h1>
            <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider mt-1.5">
              Role: <span className={role === 'dentist' ? 'text-cyan-400' : 'text-purple-400'}>{role}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied!');
              }}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/10"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Link
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <section className="lg:col-span-2 space-y-6">
          {role === 'influencer' && (
            <div className="bg-[#090d16] border border-white/[0.06] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Target Category:</label>
                <select 
                  value={selectedCategoryForUpload} 
                  onChange={(e) => setSelectedCategoryForUpload(e.target.value)}
                  className="bg-black/60 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50"
                >
                  {SHOOT_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              
              <label className="cursor-pointer bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
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
                <div key={cat.id} className="bg-[#090d16]/30 border border-white/[0.04] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                      <span className="text-sm">{cat.icon}</span> 
                      <span>{cat.name}</span>
                    </h3>
                    <span className="bg-white/5 border border-white/[0.06] text-neutral-400 px-2.5 py-0.5 rounded-full text-[9px] font-mono">
                      {catVideos.length} {catVideos.length === 1 ? 'video' : 'videos'}
                    </span>
                  </div>
                  
                  {catVideos.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-500 border border-dashed border-white/[0.04] rounded-xl bg-black/10">
                      No clips uploaded under this category yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {catVideos.map(video => (
                        <div key={video.id} className={`bg-[#090d16] border rounded-xl overflow-hidden group ${video.is_selected ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-white/[0.06]'}`}>
                          <div className="aspect-video bg-black relative flex items-center justify-center">
                            <video src={video.file_url} controls className="max-w-full max-h-full object-contain" />
                            {video.is_selected && (
                              <div className="absolute top-2 right-2 bg-emerald-500 text-black px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                                <CheckCircle className="w-3 h-3" /> Selected
                              </div>
                            )}
                          </div>
                          <div className="p-3 flex justify-between items-center">
                            <p className="text-xs font-mono truncate text-neutral-300 w-3/4">{video.file_name}</p>
                            
                            {role === 'dentist' && (
                              <button 
                                onClick={() => toggleVideoSelection(video.id, video.is_selected)}
                                className={`text-[10px] px-2.5 py-1 rounded font-black uppercase transition-all ${video.is_selected ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                              >
                                {video.is_selected ? 'Deselect' : 'Select'}
                              </button>
                            )}
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
          <div className="bg-[#090d16] border border-white/[0.06] rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <span>📋</span> Guidelines Directory
            </h3>

            {workspace.song_option && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 flex items-start gap-2.5">
                <span className="text-purple-400 mt-0.5">🎵</span>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-purple-400">Background Audio / Song 1</div>
                  <div className="text-xs text-neutral-200 font-bold mt-0.5 select-all">{workspace.song_option}</div>
                </div>
              </div>
            )}

            {workspace.song_option_2 && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 flex items-start gap-2.5">
                <span className="text-purple-400 mt-0.5">🎵</span>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-purple-400">Background Audio / Song 2</div>
                  <div className="text-xs text-neutral-200 font-bold mt-0.5 select-all">{workspace.song_option_2}</div>
                </div>
              </div>
            )}

            {workspace.hook_option && (
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 flex items-start gap-2.5">
                <span className="text-cyan-400 mt-0.5">🪝</span>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-cyan-400">Video Hook 1</div>
                  <div className="text-xs text-neutral-200 font-bold mt-0.5 select-all">{workspace.hook_option}</div>
                </div>
              </div>
            )}

            {workspace.hook_option_2 && (
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 flex items-start gap-2.5">
                <span className="text-cyan-400 mt-0.5">🪝</span>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-cyan-400">Video Hook 2</div>
                  <div className="text-xs text-neutral-200 font-bold mt-0.5 select-all">{workspace.hook_option_2}</div>
                </div>
              </div>
            )}

            {workspace.caption_option && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-start gap-2.5">
                <span className="text-emerald-400 mt-0.5">📝</span>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Video Caption</div>
                  <div className="text-xs text-neutral-200 font-bold mt-0.5 select-all">{workspace.caption_option}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-1 border border-white/[0.06] rounded-lg p-0.5 bg-black/40">
              {SHOOT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setGuidelineTab(cat.id)}
                  title={cat.name}
                  className={`py-1 rounded text-center text-xs transition-all ${guidelineTab === cat.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  {cat.icon}
                </button>
              ))}
            </div>

            <div className="bg-white/[0.01] border border-white/[0.04] rounded-lg p-3.5 space-y-2.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <span>{categoryInfo.icon}</span>
                <span>{categoryInfo.name}</span>
              </div>
              <ul className="space-y-2">
                {guidelines.map((guide, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-neutral-300 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                    <span>{guide}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Final Script & Song Section */}
          <div className="bg-[#090d16] border border-white/[0.06] rounded-xl p-5 flex flex-col space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Final Production specs
            </h3>
            
            <div className="space-y-4 bg-black/20 border border-white/[0.04] rounded-lg p-3">
              {role === 'dentist' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Final Background Audio 1</label>
                    <input 
                      type="text"
                      value={songText}
                      onChange={(e) => setSongText(e.target.value)}
                      placeholder="e.g., Trending Instagram audio track, upbeat jazz"
                      className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Final Background Audio 2</label>
                    <input 
                      type="text"
                      value={songText2}
                      onChange={(e) => setSongText2(e.target.value)}
                      placeholder="e.g., Soft instrumental, second audio option"
                      className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Final Video Hook 1</label>
                    <input 
                      type="text"
                      value={hookText}
                      onChange={(e) => setHookText(e.target.value)}
                      placeholder="e.g., Did you know scaling doesn't loosen teeth?"
                      className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Final Video Hook 2</label>
                    <input 
                      type="text"
                      value={hookText2}
                      onChange={(e) => setHookText2(e.target.value)}
                      placeholder="e.g., Stop brushing your teeth like this!"
                      className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Final Video Caption</label>
                    <textarea
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                      placeholder="e.g., Healthy smiles start here! Book consult today."
                      className="w-full h-32 bg-black/40 border border-white/[0.06] rounded-lg p-3 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none resize-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Final Script directions</label>
                    <textarea
                      value={scriptText}
                      onChange={(e) => setScriptText(e.target.value)}
                      placeholder="Write the final script and directions here..."
                      className="w-full h-64 bg-black/40 border border-white/[0.06] rounded-lg p-3 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none resize-none transition-all"
                    />
                  </div>

                  <button 
                    onClick={saveScript}
                    disabled={savingScript}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-black py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {savingScript ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Save Production Specs
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {workspace.song_option ? (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5 flex items-start gap-2">
                      <span className="text-purple-400 text-xs">🎵</span>
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-wider text-purple-400">Chosen Background Audio 1</div>
                        <div className="text-xs text-neutral-200 font-bold mt-0.5 select-all">{workspace.song_option}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-neutral-500 italic">No final audio 1 specified yet.</div>
                  )}

                  {workspace.song_option_2 ? (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5 flex items-start gap-2">
                      <span className="text-purple-400 text-xs">🎵</span>
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-wider text-purple-400">Chosen Background Audio 2</div>
                        <div className="text-xs text-neutral-200 font-bold mt-0.5 select-all">{workspace.song_option_2}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-neutral-500 italic">No final audio 2 specified yet.</div>
                  )}

                  {workspace.hook_option ? (
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2.5 flex items-start gap-2">
                      <span className="text-cyan-400 text-xs">🪝</span>
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-wider text-cyan-400">Chosen Video Hook 1</div>
                        <div className="text-xs text-neutral-200 font-bold mt-0.5 select-all">{workspace.hook_option}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-neutral-500 italic">No final hook 1 specified yet.</div>
                  )}

                  {workspace.hook_option_2 ? (
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2.5 flex items-start gap-2">
                      <span className="text-cyan-400 text-xs">🪝</span>
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-wider text-cyan-400">Chosen Video Hook 2</div>
                        <div className="text-xs text-neutral-200 font-bold mt-0.5 select-all">{workspace.hook_option_2}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-neutral-500 italic">No final hook 2 specified yet.</div>
                  )}

                  {workspace.caption_option ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 flex items-start gap-2">
                      <span className="text-emerald-400 text-xs">📝</span>
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-wider text-emerald-400">Chosen Video Caption</div>
                        <div className="text-xs text-neutral-200 font-bold mt-0.5 select-all">{workspace.caption_option}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-neutral-500 italic">No final caption specified yet.</div>
                  )}

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Final Script</div>
                    {workspace.script ? (
                      <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed bg-black/30 border border-white/[0.04] rounded p-2.5 font-mono">{workspace.script}</p>
                    ) : (
                      <div className="text-[10px] text-neutral-500 italic bg-black/20 border border-dashed border-white/[0.04] p-3 rounded text-center">
                        The dentist will save the final script here.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Creator Suggestions Section */}
          <div className="bg-[#090d16] border border-white/[0.06] rounded-xl p-5 flex flex-col space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" /> Creator Suggestions
            </h3>
            
            <div className="space-y-4 bg-black/20 border border-white/[0.04] rounded-lg p-3">
              {role === 'influencer' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Suggest a Song / Audio 1</label>
                    <input 
                      type="text"
                      value={creatorSongText}
                      onChange={(e) => setCreatorSongText(e.target.value)}
                      placeholder="e.g., Lofi aesthetic, trending audio link"
                      className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Suggest a Song / Audio 2</label>
                    <input 
                      type="text"
                      value={creatorSongText2}
                      onChange={(e) => setCreatorSongText2(e.target.value)}
                      placeholder="e.g., Electronic beats, alternate audio track"
                      className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Suggest a Video Hook 1</label>
                    <input 
                      type="text"
                      value={creatorHookText}
                      onChange={(e) => setCreatorHookText(e.target.value)}
                      placeholder="e.g., 3 mistakes you make at the dentist!"
                      className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Suggest a Video Hook 2</label>
                    <input 
                      type="text"
                      value={creatorHookText2}
                      onChange={(e) => setCreatorHookText2(e.target.value)}
                      placeholder="e.g., Why scaling is actually good for you!"
                      className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Suggest a Caption</label>
                    <textarea
                      value={creatorCaptionText}
                      onChange={(e) => setCreatorCaptionText(e.target.value)}
                      placeholder="e.g., Alternative dental vlog caption idea!"
                      className="w-full h-32 bg-black/40 border border-white/[0.06] rounded-lg p-3 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none resize-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Suggest Script adjustments</label>
                    <textarea
                      value={creatorScriptText}
                      onChange={(e) => setCreatorScriptText(e.target.value)}
                      placeholder="Suggest video captions or script ideas here..."
                      className="w-full h-64 bg-black/40 border border-white/[0.06] rounded-lg p-3 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none resize-none transition-all"
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
                    <div className="text-[9px] font-black uppercase tracking-wider text-neutral-400 flex justify-between items-center">
                      <span>Suggested Song 1</span>
                      {workspace.creator_song && (
                        <button 
                          onClick={() => {
                            setSongText(workspace.creator_song);
                            toast.success('Song 1 copied to editor input');
                          }}
                          className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold uppercase"
                        >
                          Use Song 1
                        </button>
                      )}
                    </div>
                    {workspace.creator_song ? (
                      <div className="text-xs text-white font-bold select-all mt-1 bg-black/30 border border-white/[0.04] p-2 rounded">
                        🎵 {workspace.creator_song}
                      </div>
                    ) : (
                      <div className="text-[10px] text-neutral-500 italic mt-1">No song suggestion 1 yet.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-neutral-400 flex justify-between items-center">
                      <span>Suggested Song 2</span>
                      {workspace.creator_song_2 && (
                        <button 
                          onClick={() => {
                            setSongText2(workspace.creator_song_2);
                            toast.success('Song 2 copied to editor input');
                          }}
                          className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold uppercase"
                        >
                          Use Song 2
                        </button>
                      )}
                    </div>
                    {workspace.creator_song_2 ? (
                      <div className="text-xs text-white font-bold select-all mt-1 bg-black/30 border border-white/[0.04] p-2 rounded">
                        🎵 {workspace.creator_song_2}
                      </div>
                    ) : (
                      <div className="text-[10px] text-neutral-500 italic mt-1">No song suggestion 2 yet.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-neutral-400 flex justify-between items-center">
                      <span>Suggested Hook 1</span>
                      {workspace.creator_hook && (
                        <button 
                          onClick={() => {
                            setHookText(workspace.creator_hook);
                            toast.success('Hook 1 copied to editor input');
                          }}
                          className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold uppercase"
                        >
                          Use Hook 1
                        </button>
                      )}
                    </div>
                    {workspace.creator_hook ? (
                      <div className="text-xs text-white font-bold select-all mt-1 bg-black/30 border border-white/[0.04] p-2 rounded">
                        🪝 {workspace.creator_hook}
                      </div>
                    ) : (
                      <div className="text-[10px] text-neutral-500 italic mt-1">No hook suggestion 1 yet.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-neutral-400 flex justify-between items-center">
                      <span>Suggested Hook 2</span>
                      {workspace.creator_hook_2 && (
                        <button 
                          onClick={() => {
                            setHookText2(workspace.creator_hook_2);
                            toast.success('Hook 2 copied to editor input');
                          }}
                          className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold uppercase"
                        >
                          Use Hook 2
                        </button>
                      )}
                    </div>
                    {workspace.creator_hook_2 ? (
                      <div className="text-xs text-white font-bold select-all mt-1 bg-black/30 border border-white/[0.04] p-2 rounded">
                        🪝 {workspace.creator_hook_2}
                      </div>
                    ) : (
                      <div className="text-[10px] text-neutral-500 italic mt-1">No hook suggestion 2 yet.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-neutral-400 flex justify-between items-center">
                      <span>Suggested Caption</span>
                      {workspace.creator_caption && (
                        <button 
                          onClick={() => {
                            setCaptionText(workspace.creator_caption);
                            toast.success('Caption copied to editor input');
                          }}
                          className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold uppercase"
                        >
                          Use Caption
                        </button>
                      )}
                    </div>
                    {workspace.creator_caption ? (
                      <div className="text-xs text-white font-bold select-all mt-1 bg-black/30 border border-white/[0.04] p-2 rounded">
                        📝 {workspace.creator_caption}
                      </div>
                    ) : (
                      <div className="text-[10px] text-neutral-500 italic mt-1">No caption suggestion yet.</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-neutral-400 flex justify-between items-center">
                      <span>Suggested Script</span>
                      {workspace.creator_script && (
                        <button 
                          onClick={() => {
                            setScriptText(workspace.creator_script);
                            toast.success('Script copied to editor input');
                          }}
                          className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold uppercase"
                        >
                          Use Script
                        </button>
                      )}
                    </div>
                    {workspace.creator_script ? (
                      <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed mt-1 bg-black/30 border border-white/[0.04] p-2.5 rounded font-mono">{workspace.creator_script}</p>
                    ) : (
                      <div className="text-[10px] text-neutral-500 italic mt-1 bg-black/20 border border-dashed border-white/[0.04] p-3 rounded text-center">
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
    </div>
  );
}
