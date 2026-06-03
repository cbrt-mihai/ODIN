"use client";

import { useState } from "react";
import { Archive, FileDown, FileText, Loader2, Upload } from "lucide-react";
import { ImportWizard } from "@/components/import-export/import-wizard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

async function downloadFromUrl(url: string, fallbackName: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] ?? fallbackName;
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

function ExportButton({
  href,
  label,
  fallbackName,
  icon: Icon,
}: {
  href: string;
  label: string;
  fallbackName: string;
  icon: typeof FileText;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await downloadFromUrl(href, fallbackName);
          toast.success(`${label} downloaded`);
        } catch (err) {
          toast.error(
            `${label} failed`,
            err instanceof Error ? err.message : undefined,
          );
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}

function ZipReportButton({
  href,
  fallbackName,
}: {
  href: string;
  fallbackName: string;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await downloadFromUrl(href, fallbackName);
          toast.success("Zip report downloaded");
        } catch (err) {
          toast.error(
            "Zip report failed",
            err instanceof Error ? err.message : undefined,
          );
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Archive className="h-4 w-4" />
      )}
      Zip report
    </Button>
  );
}

export function EntityReportExportButtons({ entityId }: { entityId: string }) {
  const safeName = "entity-report";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ExportButton
        href={`/api/reports/entity/${entityId}`}
        label="HTML report"
        fallbackName={`${safeName}.html`}
        icon={FileText}
      />
      <ExportButton
        href={`/api/reports/entity/${entityId}/pdf`}
        label="PDF report"
        fallbackName={`${safeName}.pdf`}
        icon={FileDown}
      />
      <ZipReportButton
        href={`/api/reports/entity/${entityId}/zip`}
        fallbackName={`${safeName}.zip`}
      />
    </div>
  );
}

export function GroupReportExportButtons({ groupId }: { groupId: string }) {
  const safeName = "group-report";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ExportButton
        href={`/api/reports/group/${groupId}`}
        label="HTML report"
        fallbackName={`${safeName}.html`}
        icon={FileText}
      />
      <ExportButton
        href={`/api/reports/group/${groupId}/pdf`}
        label="PDF report"
        fallbackName={`${safeName}.pdf`}
        icon={FileDown}
      />
      <ZipReportButton
        href={`/api/reports/group/${groupId}/zip`}
        fallbackName={`${safeName}.zip`}
      />
    </div>
  );
}

export function CaseReportExportButtons({
  caseId,
  showZip = true,
  showImport = true,
}: {
  caseId: string;
  showZip?: boolean;
  showImport?: boolean;
}) {
  const toast = useToast();
  const [zipLoading, setZipLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ExportButton
        href={`/api/reports/case/${caseId}`}
        label="HTML report"
        fallbackName="case-report.html"
        icon={FileText}
      />
      <ExportButton
        href={`/api/reports/case/${caseId}/pdf`}
        label="PDF report"
        fallbackName="case-report.pdf"
        icon={FileDown}
      />
      <ZipReportButton
        href={`/api/reports/case/${caseId}/zip`}
        fallbackName="case-report.zip"
      />
      {showZip && (
        <Button
          variant="outline"
          size="sm"
          disabled={zipLoading}
          onClick={async () => {
            setZipLoading(true);
            try {
              await downloadFromUrl(
                `/api/export/case/${caseId}`,
                "case-export.zip",
              );
              toast.success("Export ZIP downloaded");
            } catch (err) {
              toast.error(
                "Export ZIP failed",
                err instanceof Error ? err.message : undefined,
              );
            } finally {
              setZipLoading(false);
            }
          }}
        >
          {zipLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          Export ZIP
        </Button>
      )}
      {showImport && (
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4" />
              Import case ZIP
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Import case ZIP</DialogTitle>
              <DialogDescription>
                Upload a case-scoped export ZIP. Review conflicts before
                applying changes.
              </DialogDescription>
            </DialogHeader>
            <ImportWizard
              caseOnly
              onComplete={() => {
                setImportOpen(false);
                toast.success("Case import complete");
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
