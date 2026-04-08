'use client';

import { useState, useCallback } from 'react';
import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  url: string;
  title?: string;
}

export default function ShareButton({ url, title = 'Check out this flight deal!' }: Readonly<ShareButtonProps>) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or API failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [url, title]);

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-body text-muted hover:bg-off hover:text-ink transition-colors"
        aria-label="Share"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs font-body font-medium text-white shadow-lg animate-fade-in">
          Copied!
        </span>
      )}
    </div>
  );
}
