function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderInline(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" class="text-accent-700 hover:text-accent-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');
  return html;
}

export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      html.push('<hr class="my-6 border-stone-200" />');
      i++;
      continue;
    }

    // Headings
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      html.push(`<h2 class="mt-8 mb-3 text-xl font-bold text-stone-900">${renderInline(h2[1])}</h2>`);
      i++;
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      html.push(`<h3 class="mt-6 mb-2 text-lg font-semibold text-stone-900">${renderInline(h3[1])}</h3>`);
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li class="mb-1">${renderInline(lines[i].replace(/^[-*]\s+/, ''))}</li>`);
        i++;
      }
      html.push(`<ul class="mb-4 ml-5 list-disc space-y-1 text-stone-600">${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li class="mb-1">${renderInline(lines[i].replace(/^\d+\.\s+/, ''))}</li>`);
        i++;
      }
      html.push(`<ol class="mb-4 ml-5 list-decimal space-y-1 text-stone-600">${items.join('')}</ol>`);
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-empty, non-special lines)
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^---+\s*$/.test(lines[i]) &&
      !/^##\s+/.test(lines[i]) &&
      !/^###\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      para.push(renderInline(lines[i]));
      i++;
    }
    html.push(`<p class="mb-4">${para.join('<br />')}</p>`);
  }

  return html.join('\n');
}
