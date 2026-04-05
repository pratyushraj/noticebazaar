import { useState } from 'react';

const InfluencerRateCalculator = () => {
  const [platform, setPlatform] = useState('instagram');
  const [niche, setNiche] = useState('lifestyle');
  const [followers, setFollowers] = useState(10000);
  const [rate, setRate] = useState(0);

  const calculateRate = () => {
    const baseRates: Record<number, number> = { 10000: 5000, 50000: 15000, 100000: 30000 };
    const platformMultipliers: Record<string, number> = { instagram: 1, youtube: 2.5, tiktok: 1.2 };
    const nicheFactors: Record<string, number> = { tech: 1.5, beauty: 1.2, lifestyle: 1.0 };
    
    // Simple logic for the draft
    const base = baseRates[followers] || 10000;
    const result = base * platformMultipliers[platform] * nicheFactors[niche];
    setRate(result);
  };

  return (
    <div className="p-6 bg-card rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Influencer Rate Calculator</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Platform</label>
          <select onChange={(e) => setPlatform(e.target.value)} className="w-full mt-1 p-2 border rounded">
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium">Niche</label>
          <select onChange={(e) => setNiche(e.target.value)} className="w-full mt-1 p-2 border rounded">
            <option value="lifestyle">Lifestyle</option>
            <option value="tech">Tech</option>
            <option value="beauty">Beauty</option>
          </select>
        </div>

        <button type="button" onClick={calculateRate} className="w-full bg-indigo-600 text-foreground p-2 rounded hover:bg-indigo-700">
          Calculate Rate
        </button>

        {rate > 0 && (
          <div className="mt-4 p-4 bg-indigo-50 rounded text-center">
            <p className="text-sm">Estimated Deal Rate</p>
            <p className="text-2xl font-bold text-indigo-700">₹{rate.toLocaleString()}</p>
            <a href="/contract-generator" className="mt-4 block w-full bg-green-600 text-foreground p-2 rounded hover:bg-green-700 text-sm font-bold">
              Generate Protected Contract
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfluencerRateCalculator;
