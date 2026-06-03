import { ExportImportPanel } from "@/components/import-export/export-import-panel";

export default function ImportExportPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Import / Export</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Backup and restore your investigation data as a ZIP archive.
        </p>
      </div>
      <ExportImportPanel />
    </div>
  );
}
