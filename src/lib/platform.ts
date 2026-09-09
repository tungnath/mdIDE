import { isTauri, invoke } from "@tauri-apps/api/core";
import { downloadBlob } from "./download";

export type BackendKind = "tauri" | "fsa" | "fallback";

export interface FileEntry {
  name: string;
  id: string;
  kind: "tauri" | "fsa";
  path?: string; // tauri only
  handle?: FileSystemFileHandle; // fsa only
}

export interface Folder {
  name: string;
  kind: "tauri" | "fsa";
  path?: string; // tauri only
  handle?: FileSystemDirectoryHandle; // fsa only
}

export interface OpenDoc {
  name: string;
  path: string;
  canSaveInPlace: boolean;
  /** True for a document that has no backing file yet (e.g. pasted from the
   * clipboard) - saving it must go through saveAsNewFile() rather than
   * doc.save(), which has nowhere to write to. */
  isUntitled?: boolean;
  read(): Promise<string>;
  save(content: string): Promise<void>;
}

function basename(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

function isMarkdownName(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".md") || lower.endsWith(".markdown");
}

const hasFsAccess =
  typeof window !== "undefined" &&
  "showDirectoryPicker" in window &&
  "showOpenFilePicker" in window;

export const backendKind: BackendKind = isTauri()
  ? "tauri"
  : hasFsAccess
    ? "fsa"
    : "fallback";

export const supportsFolderBrowsing = backendKind !== "fallback";
export const supportsSaveInPlace = backendKind !== "fallback";

// ---------- Tauri backend ----------

async function tauriPickFolder(): Promise<Folder | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({ directory: true, multiple: false });
  if (!selected || typeof selected !== "string") return null;
  return { kind: "tauri", name: basename(selected), path: selected };
}

async function tauriListMarkdownFiles(folder: Folder): Promise<FileEntry[]> {
  const raw = await invoke<{ name: string; path: string }[]>(
    "list_md_files",
    { dir: folder.path },
  );
  return raw.map((f) => ({
    kind: "tauri" as const,
    id: f.path,
    name: f.name,
    path: f.path,
  }));
}

async function tauriPickFile(): Promise<OpenDoc | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    multiple: false,
    filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
  });
  if (!selected || typeof selected !== "string") return null;
  return tauriOpenDoc({
    kind: "tauri",
    id: selected,
    name: basename(selected),
    path: selected,
  });
}

function tauriOpenDoc(entry: FileEntry): OpenDoc {
  return {
    name: entry.name,
    path: entry.path!,
    canSaveInPlace: true,
    read: () => invoke<string>("read_md_file", { path: entry.path }),
    save: (content: string) =>
      invoke<void>("write_md_file", { path: entry.path, contents: content }),
  };
}

async function tauriSaveAsNewFile(
  suggestedName: string,
  content: string,
): Promise<OpenDoc | null> {
  const { save } = await import("@tauri-apps/plugin-dialog");
  const path = await save({
    defaultPath: suggestedName,
    filters: [{ name: "Markdown", extensions: ["md", "markdown"] }],
  });
  if (!path) return null;
  await invoke<void>("write_md_file", { path, contents: content });
  return tauriOpenDoc({ kind: "tauri", id: path, name: basename(path), path });
}

async function tauriReadClipboardText(): Promise<string | null> {
  const { readText } = await import("@tauri-apps/plugin-clipboard-manager");
  const text = await readText();
  return text || null;
}

// ---------- File System Access API backend (Chrome/Edge) ----------

async function fsaPickFolder(): Promise<Folder | null> {
  try {
    // @ts-expect-error - not in TS lib yet on all targets
    const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker();
    return { kind: "fsa", name: handle.name, handle };
  } catch {
    return null; // user cancelled
  }
}

async function fsaListMarkdownFiles(folder: Folder): Promise<FileEntry[]> {
  const dir = folder.handle!;
  const entries: FileEntry[] = [];
  // @ts-expect-error - async iterator not in older TS lib defs
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === "file" && isMarkdownName(name)) {
      entries.push({ kind: "fsa", id: name, name, handle });
    }
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return entries;
}

async function fsaPickFile(): Promise<OpenDoc | null> {
  try {
    // @ts-expect-error - not in TS lib yet on all targets
    const [handle]: FileSystemFileHandle[] = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: "Markdown",
          accept: { "text/markdown": [".md", ".markdown"] },
        },
      ],
    });
    if (!handle) return null;
    return fsaOpenDoc({ kind: "fsa", id: handle.name, name: handle.name, handle });
  } catch {
    return null; // user cancelled
  }
}

function fsaOpenDoc(entry: FileEntry): OpenDoc {
  const handle = entry.handle!;
  return {
    name: entry.name,
    path: entry.name,
    canSaveInPlace: true,
    read: async () => {
      const file = await handle.getFile();
      return file.text();
    },
    save: async (content: string) => {
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
    },
  };
}

async function fsaSaveAsNewFile(
  suggestedName: string,
  content: string,
): Promise<OpenDoc | null> {
  try {
    // @ts-expect-error - not in TS lib yet on all targets
    const handle: FileSystemFileHandle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: "Markdown",
          accept: { "text/markdown": [".md", ".markdown"] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    return fsaOpenDoc({ kind: "fsa", id: handle.name, name: handle.name, handle });
  } catch {
    return null; // user cancelled, or picker unsupported
  }
}

// ---------- Fallback backend (Firefox/Safari): read via <input>, save via download ----------

function fallbackPickFile(): Promise<OpenDoc | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,text/markdown";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      resolve({
        name: file.name,
        path: file.name,
        canSaveInPlace: false,
        read: () => file.text(),
        save: async (content: string) =>
          downloadBlob(content, file.name, "text/markdown"),
      });
    };
    input.click();
  });
}

// ---------- Unified API ----------

export async function pickFolder(): Promise<Folder | null> {
  if (backendKind === "tauri") return tauriPickFolder();
  if (backendKind === "fsa") return fsaPickFolder();
  return null;
}

export async function listMarkdownFiles(folder: Folder): Promise<FileEntry[]> {
  if (folder.kind === "tauri") return tauriListMarkdownFiles(folder);
  return fsaListMarkdownFiles(folder);
}

export async function openEntry(entry: FileEntry): Promise<OpenDoc> {
  if (entry.kind === "tauri") return tauriOpenDoc(entry);
  return fsaOpenDoc(entry);
}

export async function pickFile(): Promise<OpenDoc | null> {
  if (backendKind === "tauri") return tauriPickFile();
  if (backendKind === "fsa") return fsaPickFile();
  return fallbackPickFile();
}

/** A document with content already in hand but no backing file - saving it
 * always goes through saveAsNewFile() rather than doc.save(). */
export function createUntitledDoc(name: string): OpenDoc {
  return {
    name,
    path: "",
    canSaveInPlace: false,
    isUntitled: true,
    read: async () => "",
    save: async () => {
      throw new Error("Untitled documents must be saved via Save As");
    },
  };
}

export async function readClipboardText(): Promise<string | null> {
  if (backendKind === "tauri") return tauriReadClipboardText();
  if (typeof navigator === "undefined" || !navigator.clipboard?.readText) return null;
  try {
    const text = await navigator.clipboard.readText();
    return text || null;
  } catch {
    return null; // permission denied, or blocked outside a secure context
  }
}

/** Prompts for a save location and writes `content` there, returning an
 * OpenDoc bound to that new location (or null if the user cancelled). In
 * the fallback backend there's no real handle to bind to, so this just
 * triggers a download and returns null - the document stays untitled. */
export async function saveAsNewFile(
  suggestedName: string,
  content: string,
): Promise<OpenDoc | null> {
  if (backendKind === "tauri") return tauriSaveAsNewFile(suggestedName, content);
  if (backendKind === "fsa") return fsaSaveAsNewFile(suggestedName, content);
  downloadBlob(content, suggestedName, "text/markdown");
  return null;
}
