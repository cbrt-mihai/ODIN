"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addInboxItem } from "@/lib/actions/inbox";

export function InboxCaptureForm() {
  const router = useRouter();
  const [contentType, setContentType] = useState<"text" | "url" | "image">("text");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await addInboxItem({ contentType, content, notes });
      setContent("");
      setNotes("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-lg">
      <div className="space-y-1">
        <Label>Type</Label>
        <Select
          value={contentType}
          onValueChange={(v) => setContentType(v as "text" | "url" | "image")}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="image">Image URL</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Content</Label>
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading}>
        Capture
      </Button>
    </form>
  );
}
