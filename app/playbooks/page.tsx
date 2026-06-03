import { PlaybookManager } from "@/components/playbooks/playbook-manager";
import { listPlaybooks } from "@/lib/actions/playbooks";
import { listResources } from "@/lib/actions/resources";
import { listTools } from "@/lib/actions/tools";

export default async function PlaybooksPage() {
  const [playbooks, tools, resources] = await Promise.all([
    listPlaybooks(),
    listTools(),
    listResources(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Playbooks</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Reusable investigation checklists and workflows.
        </p>
      </div>
      <PlaybookManager
        playbooks={playbooks}
        tools={tools}
        resources={resources}
      />
    </div>
  );
}
