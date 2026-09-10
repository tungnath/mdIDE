<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { EditorState, type Extension } from "@codemirror/state";
  import { markdown } from "@codemirror/lang-markdown";
  import { languages } from "@codemirror/language-data";
  import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
  import { tags as t } from "@lezer/highlight";

  let {
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  } = $props();

  let container: HTMLDivElement;
  let view: EditorView | undefined;

  // Base editor chrome - reads the same design tokens as the rest of the
  // app, so it follows the current design set (Harbor/Sage) and light/dark
  // automatically, unlike a fixed pre-built theme package.
  const chromeTheme = EditorView.theme({
    "&": {
      backgroundColor: "var(--editor-bg)",
      color: "var(--text)",
      height: "100%",
    },
    ".cm-content": { caretColor: "var(--text)" },
    ".cm-gutters": {
      backgroundColor: "var(--editor-bg)",
      color: "var(--gutter)",
      border: "none",
    },
    ".cm-activeLine": { backgroundColor: "var(--surface-alt)" },
    ".cm-activeLineGutter": { backgroundColor: "var(--surface-alt)" },
    ".cm-selectionBackground": { backgroundColor: "var(--accent-soft) !important" },
    "&.cm-focused .cm-selectionBackground": { backgroundColor: "var(--accent-soft) !important" },
    "&.cm-focused": { outline: "none" },
  });

  // Token colors for markdown syntax and any fenced-in code language,
  // mapped onto the app's own accent tokens instead of a borrowed palette.
  const tokenHighlight = HighlightStyle.define([
    { tag: t.heading, color: "var(--accent2)", fontWeight: "700" },
    { tag: t.strong, fontWeight: "700" },
    { tag: t.emphasis, fontStyle: "italic" },
    { tag: [t.link, t.url], color: "var(--accent)" },
    { tag: t.monospace, color: "var(--accent2)" },
    { tag: t.quote, color: "var(--text-muted)", fontStyle: "italic" },
    { tag: t.contentSeparator, color: "var(--border-strong)" },
    { tag: [t.list, t.processingInstruction], color: "var(--text-muted)" },
    { tag: [t.keyword, t.operator, t.number, t.bool, t.null], color: "var(--accent2)" },
    { tag: [t.string, t.regexp], color: "var(--accent)" },
    { tag: [t.className, t.typeName, t.tagName], color: "var(--accent)" },
    { tag: t.comment, color: "var(--text-muted)", fontStyle: "italic" },
    { tag: t.invalid, color: "var(--danger)" },
  ]);

  function buildExtensions(): Extension[] {
    return [
      basicSetup,
      markdown({ codeLanguages: languages }),
      EditorView.lineWrapping,
      chromeTheme,
      syntaxHighlighting(tokenHighlight),
      EditorView.theme({
        "&": { fontSize: "14.5px" },
        ".cm-content": {
          fontFamily: "var(--font-mono)",
          padding: "1.25rem 0",
        },
        ".cm-scroller": {
          lineHeight: "1.6",
          scrollbarWidth: "thin",
          scrollbarColor: "var(--border-strong) transparent",
        },
        ".cm-scroller::-webkit-scrollbar": { width: "8px", height: "8px" },
        ".cm-scroller::-webkit-scrollbar-track": { background: "transparent" },
        ".cm-scroller::-webkit-scrollbar-thumb": {
          background: "var(--border-strong)",
          borderRadius: "8px",
          border: "2px solid var(--editor-bg)",
          backgroundClip: "padding-box",
        },
        ".cm-scroller::-webkit-scrollbar-thumb:hover": {
          background: "var(--text-muted)",
          backgroundClip: "padding-box",
        },
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      }),
    ];
  }

  onMount(() => {
    view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: buildExtensions(),
      }),
      parent: container,
    });
  });

  onDestroy(() => view?.destroy());

  $effect(() => {
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }
  });

</script>

<div class="editor-host" bind:this={container}></div>

<style>
  .editor-host {
    flex: 1;
    overflow: hidden;
    height: 100%;
  }

  .editor-host :global(.cm-editor) {
    height: 100%;
  }
</style>
