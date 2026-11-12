/// Starts the desktop app. All budget logic lives in the web code; Rust only provides
/// the window plus file access (backups), save dialogs and opening links or folders.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running Budget Tracker");
}
