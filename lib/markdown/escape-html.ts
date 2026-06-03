export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function wikilinkSpan(label: string): string {
  return `<span class="wikilink">${escapeHtml(label)}</span>`;
}
