import { SettingsForm } from "@/components/settings/settings-form";
import { getSettings } from "@/lib/storage";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Theme, entity types, field types, confidence types, templates, and
          settings backup.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
