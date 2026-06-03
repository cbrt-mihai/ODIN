"use client";

import { Globe, Link2, Mail, Phone } from "lucide-react";
import { IndicatorChip } from "@/components/investigation/indicator-chip";
import type { ExtractedIndicators, IndicatorItem } from "@/lib/osint/extract-indicators";

function IndicatorGroup({
  icon: Icon,
  label,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  items: IndicatorItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">
          {items.length}
        </span>
      </div>
      <div className="flex flex-wrap items-start gap-1.5">
        {items.map((item) => (
          <IndicatorChip
            key={item.value}
            value={item.value}
            sources={item.sources}
          />
        ))}
      </div>
    </div>
  );
}

export function IndicatorsPanel({
  indicators,
}: {
  indicators: ExtractedIndicators;
}) {
  const total =
    indicators.emails.length +
    indicators.urls.length +
    indicators.phones.length +
    indicators.domains.length;

  if (total === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No emails, URLs, phones, or domains detected in scope text.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <IndicatorGroup icon={Mail} label="Emails" items={indicators.emails} />
      <IndicatorGroup icon={Globe} label="Domains" items={indicators.domains} />
      <IndicatorGroup icon={Link2} label="URLs" items={indicators.urls} />
      <IndicatorGroup icon={Phone} label="Phones" items={indicators.phones} />
    </div>
  );
}
