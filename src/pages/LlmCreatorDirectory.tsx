import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const LlmCreatorDirectory = () => {
    const [markdown, setMarkdown] = useState('Loading creator directory for AI...');

    useEffect(() => {
        const fetchCreators = async () => {
            try {
                const { data: creators, error } = await supabase
                    .from('profiles')
                    .select('username, name:first_name, last_name, business_name, bio, creator_category, instagram_followers, followers_count, avg_reel_views_manual, avg_views, starting_price')
                    .eq('role', 'creator')
                    .not('username', 'is', null)
                    .order('followers_count', { ascending: false })
                    .limit(200);

                if (error) throw error;

                let md = "# Creator Armour - Influencer Directory\n\n";
                md += "This is a machine-readable directory of top influencers on Creator Armour for brand discovery and analysis.\n\n";
                md += "| Name | Handle | Category | Followers | Avg. Views | Starting Price |\n";
                md += "| :--- | :--- | :--- | :--- | :--- | :--- |\n";

                creators?.forEach(c => {
                    const name = c.business_name || `${c.name || ''} ${c.last_name || ''}`.trim() || 'Verified Creator';
                    const handle = c.username;
                    const cat = c.creator_category || 'Lifestyle';
                    const followers = c.followers_count || c.instagram_followers || 0;
                    const views = c.avg_reel_views_manual || c.avg_views || 0;
                    const price = c.starting_price ? `₹${c.starting_price.toLocaleString()}` : 'Contact for Quote';
                    
                    const formatNum = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : (n >= 1000 ? `${(n/1000).toFixed(0)}K` : n);

                    md += `| ${name} | [@${handle}](https://creatorarmour.com/${handle}) | ${cat} | ${formatNum(followers)} | ${formatNum(views)} | ${price} |\n`;
                });

                md += "\n\n## Usage Instructions\n";
                md += "To view full portfolios, packages, and trust signals for any creator, visit `https://creatorarmour.com/[handle]`.\n";

                setMarkdown(md);
            } catch (err) {
                console.error('Error generating LLM directory:', err);
                setMarkdown('Error loading creator directory.');
            }
        };

        fetchCreators();
    }, []);

    return (
        <pre className="p-8 bg-white text-slate-900 whitespace-pre-wrap font-mono text-sm">
            {markdown}
        </pre>
    );
};

export default LlmCreatorDirectory;
