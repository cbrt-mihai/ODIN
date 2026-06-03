"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  attachPlaybookToCase,
  detachPlaybookFromCase,
  togglePlaybookStep,
} from "@/lib/actions/cases";
import type { Case, Playbook } from "@/lib/types";

export function CasePlaybooksPanel({
  caseData,
  playbooks,
}: {
  caseData: Case;
  playbooks: Playbook[];
}) {
  const router = useRouter();
  const [attachId, setAttachId] = useState("");
  const [loading, setLoading] = useState(false);

  const attached = playbooks.filter((p) =>
    (caseData.playbookIds ?? []).includes(p.id),
  );
  const available = playbooks.filter(
    (p) => !(caseData.playbookIds ?? []).includes(p.id),
  );

  async function attach() {
    if (!attachId) return;
    setLoading(true);
    try {
      await attachPlaybookToCase(caseData.id, attachId);
      setAttachId("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Playbooks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {available.length > 0 && (
          <div className="flex flex-wrap items-end gap-2">
            <Select value={attachId} onValueChange={setAttachId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Attach playbook…" />
              </SelectTrigger>
              <SelectContent>
                {available.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={attach}
              disabled={!attachId || loading}
            >
              Attach
            </Button>
          </div>
        )}

        {attached.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No playbooks attached. Create playbooks under Playbooks in the
            sidebar.
          </p>
        ) : (
          attached.map((pb) => {
            const progress = caseData.playbookProgress.find(
              (p) => p.playbookId === pb.id,
            );
            const done = new Set(progress?.completedStepIds ?? []);
            const steps = [...pb.steps].sort((a, b) => a.order - b.order);

            return (
              <div
                key={pb.id}
                className="rounded-lg border border-zinc-800 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{pb.title}</p>
                    {pb.description && (
                      <p className="text-xs text-zinc-500">{pb.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-zinc-500"
                    onClick={async () => {
                      await detachPlaybookFromCase(caseData.id, pb.id);
                      router.refresh();
                    }}
                  >
                    Remove
                  </Button>
                </div>
                {steps.length === 0 ? (
                  <p className="text-xs text-zinc-500">No steps defined.</p>
                ) : (
                  <ul className="space-y-2">
                    {steps.map((step) => (
                      <li key={step.id} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={done.has(step.id)}
                          className="mt-1"
                          onChange={async (e) => {
                            await togglePlaybookStep(
                              caseData.id,
                              pb.id,
                              step.id,
                              e.target.checked,
                            );
                            router.refresh();
                          }}
                        />
                        <div className="text-sm">
                          <span
                            className={
                              done.has(step.id)
                                ? "text-zinc-500 line-through"
                                : ""
                            }
                          >
                            {step.title}
                          </span>
                          {step.toolId && (
                            <Link
                              href={`/tools/${step.toolId}`}
                              className="ml-2 text-xs text-blue-400 hover:underline"
                            >
                              Tool
                            </Link>
                          )}
                          {step.resourceId && (
                            <Link
                              href={`/resources/${step.resourceId}`}
                              className="ml-2 text-xs text-blue-400 hover:underline"
                            >
                              Resource
                            </Link>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-zinc-500">
                  {done.size} / {steps.length} steps complete
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
