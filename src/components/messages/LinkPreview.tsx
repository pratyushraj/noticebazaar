import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LinkPreviewProps {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
}

// CreatorArmour specific preview data
const CREATORARMOUR_PREVIEW = {
  title: 'CreatorArmour - Legal & Tax Services for Content Creators',
  description: 'Protect your brand deals, track payments, and get legal support. Free for early creators.',
  image: undefined, // Will show gradient background if image not available
  domain: 'creatorarmour.com',
};

// Extract domain from URL
const getDomain = (url: string): string => {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
};

// Check if URL is CreatorArmour
const isCreatorArmourUrl = (url: string): boolean => {
  const domain = getDomain(url);
  return domain.includes('creatorarmour.com');
};

export const LinkPreview: React.FC<LinkPreviewProps> = ({
  url,
  title,
  description,
  image,
  domain,
}) => {
  // Use CreatorArmour preview if it's a CreatorArmour URL
  const isCreatorArmour = isCreatorArmourUrl(url);
  const previewData = isCreatorArmour ? CREATORARMOUR_PREVIEW : {
    title: title || getDomain(url),
    description: description || 'Click to visit this website',
    image: image,
    domain: domain || getDomain(url),
  };

  const fullUrl = url.startsWith('http') ? url : `https://${url}`;

  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 no-underline"
      onClick={(e) => e.stopPropagation()}
    >
      <Card className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-purple-400 transition-colors max-w-[280px]">
        <div className="w-full h-32 bg-gradient-to-br from-purple-600 to-pink-600 overflow-hidden flex items-center justify-center">
          {previewData.image ? (
            <img
              src={previewData.image}
              alt={previewData.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image on error, show gradient background
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="text-white/80 text-xs font-medium">CreatorArmour</div>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-start gap-2 mb-1">
            <Globe className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                {previewData.title}
              </h4>
              <p className="text-xs text-gray-500 line-clamp-2 mb-1">
                {previewData.description}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span className="truncate">{previewData.domain}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </a>
  );
};

// Utility function to extract URLs from text
export const extractUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
  const matches = text.match(urlRegex);
  return matches || [];
};


