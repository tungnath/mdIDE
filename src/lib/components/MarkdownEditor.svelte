<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { EditorState, StateEffect, type Extension } from "@codemirror/state";
  import { markdown } from "@codemirror/lang-markdown";
  import { languages } from "@codemirror/language-data";
  import { oneDark } from "@codemirror/theme-one-dark";

  let {
    value,
    dark,
    onChange,
  }: {
    value: string;
    dark: boolean;
    onChange: (v: string) => void;
  } = $props();

  let container: HTMLDivElement;
  let view: EditorView | undefined;

  const lightTheme = EditorView.theme({
    "&": {
      backgroundColor: "var(--surface)",
      color: "var(--text)",
      height: "100%",
    },
    ".cm-content": { caretColor: "var(--text)" },
    ".cm-gutters": {
      backgroundColor: "var(--surface)",
      color: "var(--text-muted)",
      border: "none",
    },
    ".cm-activeLine": { backgroundColor: "var(--surface-alt)" },
    ".cm-activeLineGutter": { backgroundColor: "var(--surface-alt)" },
    "&.cm-focused": { outline: "none" },
  });

  function buildExtensions(isDark: boolean): Extension[] {
    return [
      basicSetup,
      markdown({ codeLanguages: languages }),
      EditorView.lineWrapping,
      isDark ? oneDark : lightTheme,
      EditorView.theme({
        "&": { fontSize: "14.5px" },
        ".cm-content": {
          fontFamily: "var(--font-mono)",
          padding: "1.25rem 0",
        },
        ".cm-scroller": {
          lineHeight: "1.6",
          scrollbarWidth: "thin",
          scrollbarColor: "var(--border) transparent",
        },
        ".cm-scroller::-webkit-scrollbar": { width: "8px", height: "8px" },
        ".cm-scroller::-webkit-scrollbar-track": { background: "transparent" },
        ".cm-scroller::-webkit-scrollbar-thumb": {
          background: "var(--border)",
          borderRadius: "8px",
          border: "2px solid var(--surface)",
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
        extensions: buildExtensions(dark),
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

  $effect(() => {
    if (view) {
      view.dispatch({ effects: StateEffect.reconfigure.of(buildExtensions(dark)) });
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
