"use client";

import Link from "next/link";
import { ExternalLink, Link2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export type LinkDestinationVariant = "internal" | "external" | "email";

interface LinkDestinationButtonProps {
  href: string;
  variant: LinkDestinationVariant;
  title?: string;
  className?: string;
}

export function LinkDestinationButton({
  href,
  variant,
  title,
  className,
}: LinkDestinationButtonProps) {
  const label =
    title ??
    (variant === "external"
      ? "Open external link"
      : variant === "email"
        ? "Send email"
        : "Go to linked record");

  const icon =
    variant === "external" ? (
      <ExternalLink className="h-3.5 w-3.5" />
    ) : variant === "email" ? (
      <Mail className="h-3.5 w-3.5" />
    ) : (
      <Link2 className="h-3.5 w-3.5" />
    );

  const buttonClass = cn(
    "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
    "border border-zinc-700 bg-zinc-800/80 text-zinc-400",
    "transition-colors hover:border-zinc-500 hover:bg-zinc-700 hover:text-zinc-100",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
    className,
  );

  if (variant === "internal") {
    return (
      <Link href={href} className={buttonClass} title={label} aria-label={label}>
        {icon}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target={variant === "external" ? "_blank" : undefined}
      rel={variant === "external" ? "noreferrer" : undefined}
      className={buttonClass}
      title={label}
      aria-label={label}
    >
      {icon}
    </a>
  );
}
