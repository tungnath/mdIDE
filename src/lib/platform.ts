import { isTauri, invoke } from "@tauri-apps/api/core";

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
        save: async (content: string) => {
          const blob = new Blob([content], { type: "text/markdown" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.name;
          a.click();
          URL.revokeObjectURL(url);
        },
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
