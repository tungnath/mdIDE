import { renderMarkdown } from "./markdown";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// A compact, self-contained stylesheet so an exported .html file looks
// reasonable on its own, without depending on the app's theme system (which
// needs JS to toggle data-theme - not meaningful in a static export).
const STANDALONE_CSS = `
  body { margin: 0; background: #f7f7f8; }
  .prose {
    max-width: 780px; margin: 0 auto; padding: 3rem 2rem 6rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.7; font-size: 16px; color: #1c1c1f;
  }
  .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 { font-weight: 650; line-height: 1.3; margin: 1.8em 0 0.6em; }
  .prose h1 { font-size: 2em; border-bottom: 1px solid #e3e3e7; padding-bottom: 0.3em; }
  .prose h2 { font-size: 1.5em; border-bottom: 1px solid #e3e3e7; padding-bottom: 0.25em; }
  .prose h3 { font-size: 1.2em; }
  .prose p, .prose ul, .prose ol, .prose blockquote, .prose table, .prose pre { margin: 0.8em 0; }
  .prose a { color: #4457e8; text-decoration: none; }
  .prose a:hover { text-decoration: underline; }
  .prose img { max-width: 100%; border-radius: 6px; }
  .prose ul, .prose ol { padding-left: 1.6em; }
  .prose blockquote { margin-left: 0; padding: 0.2em 1em; border-left: 3px solid #4457e8; color: #75757e; background: #f0f0f2; border-radius: 0 6px 6px 0; }
  .prose code { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; font-size: 0.88em; background: #f0f0f3; padding: 0.15em 0.4em; border-radius: 4px; }
  .prose pre { background: #f0f0f3; border: 1px solid #e3e3e7; border-radius: 8px; padding: 1em; overflow-x: auto; }
  .prose pre code { background: none; padding: 0; font-size: 0.85em; line-height: 1.55; }
  .prose table { border-collapse: collapse; width: 100%; font-size: 0.92em; display: block; overflow-x: auto; }
  .prose th, .prose td { border: 1px solid #e3e3e7; padding: 0.5em 0.8em; text-align: left; }
  .prose th { background: #f0f0f2; font-weight: 600; }
  .prose hr { border: none; border-top: 1px solid #e3e3e7; margin: 2em 0; }
`;

export function renderStandaloneHtml(source: string, title: string): string {
  const body = renderMarkdown(source);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STANDALONE_CSS}</style>
</head>
<body>
<div class="prose">${body}</div>
</body>
</html>
`;
}

// The visible, human-readable text of the rendered preview - not the raw
// markdown source (that's already what Save/Open give you), and not a tag
// dump either: what you'd get selecting-all in the preview and copying.
export function extractPlainText(source: string): string {
  const html = renderMarkdown(source);
  const container = document.createElement("div");
  container.innerHTML = html;
  // innerText needs layout to compute correctly (block-level line breaks,
  // collapsed whitespace) - textContent alone won't insert those breaks.
  container.style.cssText = "position:absolute;left:-99999px;top:0;";
  document.body.appendChild(container);
  const text = container.innerText;
  document.body.removeChild(container);
  return text;
}

export function baseNameWithoutExt(name: string): string {
  return name.replace(/\.(md|markdown)$/i, "") || "document";
}
