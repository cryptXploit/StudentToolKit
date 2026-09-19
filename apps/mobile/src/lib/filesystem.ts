import { Filesystem, Directory } from '@capacitor/filesystem';
import { db } from '@student-os/storage';

/**
 * Saves a base64 string to the Capacitor Filesystem.
 * Returns the URI path of the saved file.
 */
export async function saveBase64ToDisk(base64Data: string, filename: string): Promise<string> {
  // Strip prefix if it exists (e.g. data:image/jpeg;base64,)
  let rawData = base64Data;
  if (base64Data.includes('base64,')) {
    rawData = base64Data.split('base64,')[1];
  }

  const result = await Filesystem.writeFile({
    path: `DocumentVault/${filename}`,
    data: rawData,
    directory: Directory.Data,
    recursive: true
  });
  
  return result.uri;
}

/**
 * Deletes a file from the Capacitor Filesystem.
 */
export async function deleteFileFromDisk(fileUri: string): Promise<void> {
  try {
    const filename = fileUri.split('/').pop();
    if (!filename) return;
    
    await Filesystem.deleteFile({
      path: `DocumentVault/${filename}`,
      directory: Directory.Data
    });
  } catch (error) {
    console.warn("Failed to delete physical file", error);
  }
}

/**
 * Async Out-Of-Band Migration.
 * Moves base64 strings from IDB to Disk to prevent OOM errors.
 */
export async function runOutOfBandFilesystemMigration() {
  try {
    const docs = await db.documents.toArray();
    for (const doc of docs) {
      if (doc.fileData || doc.imageData) {
        try {
          const base64 = doc.fileData || doc.imageData;
          const ext = doc.mimeType === 'application/pdf' ? 'pdf' : (doc.mimeType === 'image/png' ? 'png' : 'jpg');
          const safeName = `${doc.id}-${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
          const fileUri = await saveBase64ToDisk(base64!, safeName);
          
          // Update row: set URI and DESTROY base64 properties to free memory
          await db.documents.update(doc.id, {
            fileUri,
            fileData: undefined,
            imageData: undefined
          });
          
          console.log(`Migrated ${doc.id} to disk`);
        } catch (err) {
          console.error("Migration failed for doc", doc.id, err);
        }
      }
    }
  } catch (e) {
    console.error("Failed to run OOB filesystem migration", e);
  }
}
