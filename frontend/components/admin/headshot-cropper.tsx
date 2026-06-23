"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/** Render the selected crop area to a square canvas and return it as a JPEG blob. */
async function cropToBlob(src: string, area: Area, size = 512): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
      "image/jpeg",
      0.9,
    );
  });
}

export function HeadshotCropper({
  file,
  busy,
  onCancel,
  onCropped,
}: {
  file: File;
  busy: boolean;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const [src, setSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  async function confirm() {
    if (!area) return;
    onCropped(await cropToBlob(src, area));
  }

  return (
    <div className="space-y-3">
      <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted">
        {src && (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
          />
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="zoom" className="text-xs text-muted-foreground">
          Zoom
        </Label>
        <input
          id="zoom"
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={confirm} disabled={busy || !area}>
          {busy ? "Saving…" : "Save headshot"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
