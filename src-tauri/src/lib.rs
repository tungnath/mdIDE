use serde::Serialize;
use std::{fs, io, thread, time::Duration};

#[derive(Serialize, Clone)]
struct MdFile {
    name: String,
    path: String,
}

fn is_markdown_ext(path: &std::path::Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| {
            let e = e.to_lowercase();
            e == "md" || e == "markdown"
        })
        .unwrap_or(false)
}

#[tauri::command]
fn list_md_files(dir: String) -> Result<Vec<MdFile>, String> {
    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    let mut files: Vec<MdFile> = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_file() && is_markdown_ext(&path) {
            let name = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();
            files.push(MdFile {
                name,
                path: path.to_string_lossy().to_string(),
            });
        }
    }
    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(files)
}

// Windows AV/indexer scans can transiently lock a just-touched file, so a
// single failed read/write isn't necessarily a real error - retry briefly
// before giving up.
fn with_retries<T>(mut op: impl FnMut() -> io::Result<T>) -> Result<T, String> {
    let mut last_err = None;
    for attempt in 0..4u64 {
        match op() {
            Ok(v) => return Ok(v),
            Err(e) => {
                last_err = Some(e);
                if attempt < 3 {
                    thread::sleep(Duration::from_millis(80 * (attempt + 1)));
                }
            }
        }
    }
    Err(last_err.map(|e| e.to_string()).unwrap_or_default())
}

#[tauri::command]
fn read_md_file(path: String) -> Result<String, String> {
    let bytes = with_retries(|| fs::read(&path))?;
    // Lossy-decode rather than hard-failing on any non-strict-UTF-8 byte,
    // so a file with an encoding quirk still opens (with replacement
    // characters) instead of refusing to open at all.
    Ok(String::from_utf8_lossy(&bytes).into_owned())
}

// Generic (not markdown-specific) - also used to write exported .html/.txt
// files, since Tauri's WebView2 host doesn't reliably turn a blob-URL
// download into an actual saved file the way a real browser tab does.
#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    with_retries(|| fs::write(&path, &contents))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            list_md_files,
            read_md_file,
            write_text_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
