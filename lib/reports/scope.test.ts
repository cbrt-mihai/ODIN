import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  collectCaseReportEntityIds,
  collectGroupReportEntityIds,
  caseEntitySourceLabel,
} from "./scope";
import type { Case, Group } from "@/lib/types";

describe("report scope", () => {
  it("collects entity ids from direct links, groups, and cases", () => {
    const caseData = {
      id: "c1",
      entityIds: ["e1"],
    } as Case;
    const linkedCases = [{ id: "c2", entityIds: ["e2"] } as Case];
    const linkedGroups = [{ id: "g1", entityIds: ["e3"] } as Group];

    assert.deepEqual(
      collectCaseReportEntityIds(caseData, linkedCases, linkedGroups).sort(),
      ["e1", "e2", "e3"],
    );
  });

  it("labels entity sources for case reports", () => {
    const caseData = { id: "c1", title: "Main", entityIds: ["e1"] } as Case;
    const linkedCases = [
      { id: "c2", title: "Other", entityIds: ["e2"] } as Case,
    ];
    const linkedGroups = [
      { id: "g1", title: "Cluster", entityIds: ["e3", "e1"] } as Group,
    ];

    assert.equal(
      caseEntitySourceLabel("e1", caseData, linkedCases, linkedGroups),
      "Direct · Group: Cluster",
    );
    assert.equal(
      caseEntitySourceLabel("e2", caseData, linkedCases, linkedGroups),
      "Case: Other",
    );
  });

  it("collects group report entity ids from linked cases and groups", () => {
    const group = { id: "g1", entityIds: ["e1"] } as Group;
    const linkedCases = [{ id: "c1", entityIds: ["e2"] } as Case];
    const linkedGroups = [{ id: "g2", entityIds: ["e3"] } as Group];

    assert.deepEqual(
      collectGroupReportEntityIds(group, linkedCases, linkedGroups).sort(),
      ["e1", "e2", "e3"],
    );
  });
});
