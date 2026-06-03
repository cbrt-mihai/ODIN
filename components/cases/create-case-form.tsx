"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCase } from "@/lib/actions/cases";

export function CreateCaseForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const c = await createCase(
        title,
        description.trim() || undefined,
      );
      startTransition(() => {
        router.push(`/cases/${c.id}`);
        router.refresh();
      });
    } finally {
      setSubmitting(false);
    }
  }

  const loading = submitting || isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="case-title">Case title</Label>
        <Input
          id="case-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Operation Nightfall"
          className="max-w-lg"
          disabled={loading}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="case-description">
          Description{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </Label>
        <Textarea
          id="case-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary or goals for this investigation"
          rows={3}
          className="max-w-lg resize-y"
          disabled={loading}
        />
      </div>
      <Button type="submit" disabled={loading || !title.trim()}>
        {loading ? "Opening case…" : "Create case"}
      </Button>
      {isPending && (
        <p className="text-xs text-zinc-500">
          Loading your case workspace…
        </p>
      )}
    </form>
  );
}
