"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGroup } from "@/lib/actions/groups";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create group"}
    </Button>
  );
}

export function CreateGroupForm() {
  return (
    <form action={createGroup} className="flex gap-3">
      <Input
        name="title"
        required
        placeholder="Group title"
        className="max-w-md"
      />
      <SubmitButton />
    </form>
  );
}
