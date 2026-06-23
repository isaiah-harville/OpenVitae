"use client";

import { X } from "lucide-react";
import { useState } from "react";

export function ScreenshotGallery({ urls }: { urls: string[] }) {
  const [active, setActive] = useState<number | null>(null);

  if (urls.length === 0) return null;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {urls.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setActive(i)}
            className="overflow-hidden rounded-lg border transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img
              src={url}
              alt={`Screenshot ${i + 1}`}
              className="aspect-video w-full object-cover"
            />
          </button>
        ))}
      </div>

      {active !== null && (
        <button
          type="button"
          aria-label="Close"
          onClick={() => setActive(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
        >
          <X className="absolute right-4 top-4 size-6 text-white/80" />
          <img
            src={urls[active]}
            alt={`Screenshot ${active + 1}`}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </button>
      )}
    </>
  );
}
