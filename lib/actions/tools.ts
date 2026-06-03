"use server";

import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "@/lib/storage/activity";
import { getTools, saveTools } from "@/lib/storage";
import { moveToolToTrash } from "@/lib/storage/trash";
import type { Tool, ToolKind } from "@/lib/types";

/** Legacy tools.json may still contain internal_script entries from older versions. */
function normalizeTool(raw: Tool & { kind?: string; script?: unknown }): Tool {
  const kind = raw.kind as string | undefined;
  const tool = raw as Tool & { script?: { installHint?: string } };
  if (kind !== "internal_script") {
    const { script: _s, ...rest } = tool;
    return rest as Tool;
  }
  return {
    id: tool.id,
    name: tool.name,
    description: [tool.description, tool.script?.installHint]
      .filter(Boolean)
      .join("\n\n"),
    category: tool.category,
    tags: tool.tags ?? [],
    kind: "external",
    url: tool.url,
    createdAt: tool.createdAt,
    updatedAt: tool.updatedAt,
  };
}

export async function listTools() {
  const { tools } = await getTools();
  return tools.map(normalizeTool).sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getToolById(id: string) {
  const { tools } = await getTools();
  const tool = tools.find((t) => t.id === id);
  return tool ? normalizeTool(tool) : null;
}

export async function saveTool(input: {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  kind: ToolKind;
  url?: string;
  page?: Tool["page"];
}) {
  const { tools } = await getTools();
  const now = new Date().toISOString();
  let tool: Tool;
  if (input.id) {
    const existing = tools.find((t) => t.id === input.id);
    if (!existing) throw new Error("Tool not found");
    const base = normalizeTool(existing);
    tool = {
      ...base,
      name: input.name.trim(),
      description: input.description,
      category: input.category,
      kind: input.kind,
      url: input.kind === "external" ? input.url : undefined,
      page: input.kind === "internal_page" ? input.page ?? base.page : undefined,
      tags: input.tags ?? base.tags,
      updatedAt: now,
    };
    const idx = tools.findIndex((t) => t.id === input.id);
    tools[idx] = tool;
  } else {
    tool = {
      id: uuidv4(),
      name: input.name.trim(),
      description: input.description,
      category: input.category,
      tags: input.tags ?? [],
      kind: input.kind,
      url: input.kind === "external" ? input.url : undefined,
      page:
        input.kind === "internal_page"
          ? input.page ?? { format: "markdown", flavor: "rich", body: "" }
          : undefined,
      createdAt: now,
      updatedAt: now,
    };
    tools.push(tool);
  }
  await saveTools({ tools });
  await logActivity({
    action: input.id ? "update" : "create",
    targetType: "tool",
    targetId: tool.id,
    summary: `${input.id ? "Updated" : "Created"} tool "${tool.name}"`,
  });
  revalidatePath("/tools");
  revalidatePath(`/tools/${tool.id}`);
  return tool;
}

export async function deleteTool(id: string) {
  const { tools } = await getTools();
  const tool = tools.find((t) => t.id === id);
  if (!tool) return;
  await moveToolToTrash(normalizeTool(tool));
  await logActivity({
    action: "delete",
    targetType: "tool",
    targetId: id,
    summary: `Moved tool "${tool.name}" to trash`,
  });
  revalidatePath("/tools");
  revalidatePath("/trash");
}
