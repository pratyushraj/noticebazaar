import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Video, Plus, Link as LinkIcon, Share2 } from 'lucide-react';


export default function CreateShootWorkspace() {
  const [title, setTitle] = useState('');
  const [songOption, setSongOption] = useState('');
  const [hookOption, setHookOption] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdUrl, setCreatedUrl] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a workspace title');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shoot_workspaces')
        .insert({ 
          title: title.trim(), 
          song_option: songOption.trim(),
          hook_option: hookOption.trim()
        })
        .select()
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/shoot-workspace/${data.id}`;
      setCreatedUrl(url);
      toast.success('Workspace created successfully!');
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      
      // Fallback for demo without migration
      if (error.code === '42P01') {
        const fakeId = 'demo-workspace-id';
        const url = `${window.location.origin}/shoot-workspace/${fakeId}?song=${encodeURIComponent(songOption.trim())}&hook=${encodeURIComponent(hookOption.trim())}`;
        setCreatedUrl(url);
        toast.info('Using local mock workspace since DB is not migrated.');
      } else {
        toast.error('Failed to create workspace');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-[#f3f4f6] font-sans antialiased flex items-center justify-center p-6">
      <SEOHead title="Create Shoot Workspace" description="Create a new workspace for video review." />
      
      <div className="max-w-md w-full bg-[#090d16] border border-white/[0.06] rounded-2xl p-8 space-y-6">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Video className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-xl font-black uppercase text-white tracking-wide">New Shoot Workspace</h1>
          <p className="text-xs text-neutral-400">Create a shared link for influencers to upload videos and dentists to review.</p>
        </div>

        {!createdUrl ? (
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">Workspace Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Dentist Shoot with Priya"
                className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">Song / Audio Choice (Optional)</label>
              <input 
                type="text" 
                value={songOption}
                onChange={(e) => setSongOption(e.target.value)}
                placeholder="e.g., Trending Instagram Reel Audio, Soft Lofi, Upbeat Pop"
                className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5">Video Hook Choice (Optional)</label>
              <input 
                type="text" 
                value={hookOption}
                onChange={(e) => setHookOption(e.target.value)}
                placeholder="e.g., Did you know scaling doesn't loosen teeth?, Stop doing this!"
                className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-cyan-500/50 outline-none transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white py-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Workspace
            </button>
          </form>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-sm font-bold text-emerald-400 mb-1">Workspace Ready!</p>
              <p className="text-xs text-emerald-500/70">Share these links with the team.</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5 flex justify-between">
                  <span>Influencer Upload Link</span>
                  <button onClick={() => navigator.clipboard.writeText(`${createdUrl}?role=influencer`)} className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    <Share2 className="w-3 h-3" /> Copy
                  </button>
                </label>
                <div className="bg-black/40 border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] text-neutral-300 font-mono truncate select-all">
                  {createdUrl}?role=influencer
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1.5 flex justify-between">
                  <span>Dentist Review Link</span>
                  <button onClick={() => navigator.clipboard.writeText(`${createdUrl}?role=dentist`)} className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    <Share2 className="w-3 h-3" /> Copy
                  </button>
                </label>
                <div className="bg-black/40 border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] text-neutral-300 font-mono truncate select-all">
                  {createdUrl}?role=dentist
                </div>
              </div>
            </div>

            <button 
              onClick={() => window.open(`${createdUrl}?role=dentist`, '_blank')}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-4"
            >
              <LinkIcon className="w-4 h-4" />
              Open My Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
