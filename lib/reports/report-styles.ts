import { TIMELINE_REPORT_STYLES, TIMELINE_REPORT_SCRIPT } from "@/lib/reports/timeline-html";

export const REPORT_BASE_STYLES = `
  :root { color-scheme: light; }
  body {
    font-family: system-ui, -apple-system, Segoe UI, sans-serif;
    max-width: 960px;
    margin: 2rem auto;
    padding: 0 1.25rem 3rem;
    color: #18181b;
    line-height: 1.5;
    font-size: 0.9rem;
  }
  h1 { font-size: 1.65rem; margin: 0 0 0.5rem; line-height: 1.25; }
  h2 {
    font-size: 1.1rem;
    margin: 2rem 0 0.75rem;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid #e4e4e7;
  }
  h3 { font-size: 0.95rem; margin: 1.25rem 0 0.5rem; color: #3f3f46; }
  h4 { font-size: 0.85rem; margin: 1rem 0 0.35rem; color: #52525b; }
  .meta { color: #71717a; font-size: 0.85rem; margin: 0.25rem 0; }
  .toc { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 1rem 1.25rem; margin: 1.5rem 0; }
  .toc ul { margin: 0.5rem 0 0; padding-left: 1.25rem; }
  .toc a { color: #2563eb; text-decoration: none; }
  .toc a:hover { text-decoration: underline; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin: 0.5rem 0 1rem; }
  th, td { border: 1px solid #e4e4e7; padding: 0.45rem 0.65rem; text-align: left; vertical-align: top; }
  th { background: #f4f4f5; font-weight: 600; }
  tr:nth-child(even) td { background: #fafafa; }
  .desc, .body-pre {
    white-space: pre-wrap;
    font-family: inherit;
    font-size: 0.875rem;
    background: #f9fafb;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    margin: 0.5rem 0 1rem;
  }
  .desc.markdown { white-space: normal; }
  .desc.markdown p { margin: 0.35rem 0; }
  .desc.markdown ul, .desc.markdown ol { margin: 0.35rem 0; padding-left: 1.25rem; }
  .card {
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    padding: 1rem 1.15rem;
    margin: 1rem 0;
    background: #fff;
  }
  .card h3 { margin-top: 0; }
  .muted { color: #71717a; font-size: 0.8rem; }
  .footnote { color: #71717a; font-size: 0.78rem; margin-top: 0.25rem; }
  .tag { display: inline-block; background: #f4f4f5; border-radius: 4px; padding: 0.1rem 0.4rem; margin: 0.1rem 0.2rem 0.1rem 0; font-size: 0.75rem; }
  .proof-list { margin: 0.5rem 0; padding-left: 1.1rem; }
  .proof-list li { margin-bottom: 0.35rem; }
  .mono { font-family: ui-monospace, monospace; font-size: 0.75rem; word-break: break-all; }
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
    margin: 0.75rem 0 1.25rem;
  }
  .gallery-item {
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }
  .gallery-item img, .gallery-item video {
    display: block;
    width: 100%;
    max-height: 220px;
    object-fit: contain;
    background: #f4f4f5;
  }
  .gallery-item figcaption {
    padding: 0.55rem 0.65rem;
    font-size: 0.78rem;
    color: #52525b;
  }
  .profile-image {
    max-width: 220px;
    max-height: 220px;
    border-radius: 8px;
    border: 1px solid #e4e4e7;
    margin: 0.5rem 0 1rem;
    object-fit: contain;
    background: #f4f4f5;
  }
  a { color: #2563eb; }
  ${TIMELINE_REPORT_STYLES}
  @media print {
    .timeline-wrap, .timeline-track, .timeline-body-scroll, .timeline-axis-scroll, .timeline-canvas, .timeline-axis-canvas { overflow: visible !important; max-height: none !important; }
  }
`;

export function reportDocumentShell(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <style>${REPORT_BASE_STYLES}</style>
</head>
<body>
${body}
<script>${TIMELINE_REPORT_SCRIPT}</script>
</body>
</html>`;
}
