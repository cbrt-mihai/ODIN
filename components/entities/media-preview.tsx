"use client";

import { FileText, Mic, Video } from "lucide-react";
import { mediaPreviewKind, type MediaPreviewKind } from "@/lib/media/preview";
import { cn } from "@/lib/utils";

export function MediaPreview({
  href,
  title = "",
  mimeType,
  filename,
  url,
  path,
  fallbackScreenshot,
  variant = "detail",
}: {
  href: string | null;
  title?: string;
  mimeType?: string;
  filename?: string;
  url?: string;
  path?: string;
  fallbackScreenshot?: boolean;
  variant?: "detail" | "compact" | "thumb" | "dialog";
}) {
  const kind = mediaPreviewKind({
    mimeType,
    filename,
    url,
    path,
    fallbackScreenshot,
  });

  if (!kind || !href) return null;

  const isDetail = variant === "detail";
  const isDialog = variant === "dialog";
  const isThumb = variant === "thumb";
  const isExpanded = isDetail || isDialog;

  if (kind === "image") {
    const img = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={href}
        alt={title}
        className={cn(
          "block bg-zinc-950/80",
          isThumb ? "h-full w-full object-cover" : "object-contain",
          isDialog &&
            "mx-auto max-h-[min(50vh,28rem)] w-auto max-w-full",
          isDetail && !isDialog && "max-h-56 w-auto max-w-full",
          !isThumb && !isDetail && !isDialog && "max-h-36 w-full",
        )}
      />
    );
    if (isThumb) return img;
    return (
      <PreviewLink href={href} isDetail={isExpanded} isDialog={isDialog}>
        {img}
      </PreviewLink>
    );
  }

  if (kind === "video") {
    if (isThumb) {
      return (
        <ThumbFrame href={href}>
          <video
            src={href}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
            <Video className="h-8 w-8 text-white/90 drop-shadow" />
          </span>
        </ThumbFrame>
      );
    }
    return (
      <video
        src={href}
        controls
        playsInline
        preload="metadata"
        className={cn(
          "rounded-md border border-zinc-800 bg-zinc-950",
          isDialog
            ? "mx-auto max-h-[min(50vh,28rem)] w-full max-w-full"
            : isDetail
              ? "mx-auto max-h-56 max-w-[min(100%,20rem)] w-full"
              : "h-44 w-full",
        )}
      />
    );
  }

  if (kind === "audio") {
    if (isThumb) {
      return (
        <ThumbFrame href={href}>
          <div className="flex h-full flex-col items-center justify-center gap-1.5 bg-violet-950/20">
            <Mic className="h-7 w-7 text-violet-400/90" />
            <span className="text-[10px] font-medium uppercase tracking-wide text-violet-300/90">
              Audio
            </span>
          </div>
        </ThumbFrame>
      );
    }
    return (
      <audio
        src={href}
        controls
        preload="metadata"
        className={cn(
          "w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1",
          isDialog
            ? "mx-auto max-w-full"
            : isDetail
              ? "mx-auto max-w-[min(100%,20rem)]"
              : "",
        )}
      />
    );
  }

  if (isThumb) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 bg-red-950/20">
        <FileText className="h-7 w-7 text-red-400/80" />
        <span className="text-[10px] font-medium uppercase tracking-wide text-red-300/90">
          PDF
        </span>
      </div>
    );
  }

  return (
    <iframe
      src={href}
      title={title}
      className={cn(
        "rounded-md border border-zinc-800 bg-zinc-950",
        isDialog
          ? "mx-auto h-[min(50vh,28rem)] w-full max-w-full"
          : isDetail
            ? "mx-auto h-44 max-w-[min(100%,20rem)] w-full"
            : "h-44 w-full",
      )}
    />
  );
}

export function MediaPreviewBadge({ kind }: { kind: MediaPreviewKind }) {
  if (kind === "video") {
    return (
      <span className="text-[10px] font-medium uppercase tracking-wide text-sky-300/90">
        Video
      </span>
    );
  }
  if (kind === "audio") {
    return (
      <span className="text-[10px] font-medium uppercase tracking-wide text-violet-300/90">
        Audio
      </span>
    );
  }
  if (kind === "pdf") {
    return (
      <span className="text-[10px] font-medium uppercase tracking-wide text-red-300/90">
        PDF
      </span>
    );
  }
  return null;
}

function PreviewLink({
  href,
  isDetail,
  isDialog,
  children,
}: {
  href: string;
  isDetail: boolean;
  isDialog?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-block overflow-hidden rounded-md border border-zinc-800 bg-zinc-950",
        isDialog
          ? "max-w-full"
          : isDetail
            ? "max-w-[min(100%,16rem)]"
            : "max-w-xs",
      )}
    >
      {children}
    </a>
  );
}

function ThumbFrame({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="relative block h-full w-full overflow-hidden"
    >
      {children}
    </a>
  );
}
