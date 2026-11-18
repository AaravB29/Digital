/** What the app can do when it runs as an installed program (Windows or Android) instead of a web page. */
export interface NativeShell {
  kind: 'desktop' | 'android';
  /** Release tags for this platform start with this, e.g. "desktop-v1.2.0". */
  releasePrefix: 'desktop-v' | 'android-v';
  /** Desktop: the "Save as" dialog. Android: the share sheet (Files, Drive, email…). */
  saveFile(fileName: string, text: string): Promise<'saved' | 'cancelled'>;
  /** Writes today's backup (unless it exists, or `force`) and keeps only the newest 30. */
  runAutoBackup(buildJson: () => Promise<string>, force?: boolean): Promise<{ written: string | null; removed: number }>;
  /** Where the daily backups go, in words the user can find. */
  backupFolderLabel(): Promise<string>;
  /** Opens the backup folder, where the platform allows it. */
  openBackupFolder?: () => Promise<void>;
  /** Opens a web page in the normal browser, leaving the app as it is. */
  openInBrowser(url: string): Promise<void>;
}
