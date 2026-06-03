"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { findDuplicateCandidates } from "@/lib/actions/duplicates";
import { listEntities } from "@/lib/actions/entities";
import { buildEntityIdentityMap, entityPickerLabel } from "@/lib/entities/identity";
import type { Entity } from "@/lib/types";

export function DuplicateWarning({ name }: { name: string }) {
  const [dupes, setDupes] = useState<Entity[]>([]);
  const [allEntities, setAllEntities] = useState<Entity[]>([]);

  useEffect(() => {
    listEntities().then(setAllEntities);
  }, []);

  useEffect(() => {
    if (name.trim().length < 3) {
      setDupes([]);
      return;
    }
    const t = setTimeout(() => {
      findDuplicateCandidates(name).then(setDupes);
    }, 400);
    return () => clearTimeout(t);
  }, [name]);

  const identityMap = useMemo(
    () => buildEntityIdentityMap([...allEntities, ...dupes]),
    [allEntities, dupes],
  );

  if (dupes.length === 0) return null;

  return (
    <div className="rounded-md border border-amber-800/50 bg-amber-950/30 p-3 text-sm">
      <p className="font-medium text-amber-200">Possible duplicates</p>
      <p className="mt-1 text-xs text-amber-200/70">
        Same or similar name — open the right record or add a disambiguator when
        creating.
      </p>
      <ul className="mt-2 space-y-1">
        {dupes.map((e) => (
          <li key={e.id}>
            <Link
              href={`/entities/${e.id}`}
              className="text-blue-400 hover:underline"
            >
              {entityPickerLabel(e, identityMap)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
