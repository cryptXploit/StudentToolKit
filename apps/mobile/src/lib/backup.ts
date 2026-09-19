import { db } from '@student-os/storage';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import JSZip from 'jszip';

export async function generateEcosystemBackup() {
  const profile = await db.profile.toArray();
  const events = await db.events.toArray();
  const semesters = await db.semesters.toArray();
  const courses = await db.courses.toArray();
  const routine = await db.routine.toArray();
  const attendance = await db.attendance.toArray();
  const documents = await db.documents.toArray();

  const backupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    data: {
      profile,
      events,
      semesters,
      courses,
      routine,
      attendance,
      documents
    }
  };

  const json = JSON.stringify(backupData, null, 2);
  const zip = new JSZip();
  zip.file('ecosystem.json', json);

  for (const doc of documents) {
    if (doc.fileUri) {
      try {
        const fileData = await Filesystem.readFile({
          path: doc.fileUri
        });
        
        const parts = doc.fileUri.split('/');
        const filename = parts[parts.length - 1];
        
        zip.file('documents/' + filename, fileData.data, { base64: true });
      } catch (e) {
        console.error('Failed to read file for backup:', doc.fileUri, e);
      }
    }
  }

  const zipBase64 = await zip.generateAsync({ type: 'base64' });
  const backupFilename = `prepia-backup-${new Date().toISOString().split('T')[0]}.zip`;

  const savedFile = await Filesystem.writeFile({
    path: backupFilename,
    data: zipBase64,
    directory: Directory.Cache
  });

  await Share.share({
    title: 'Prepia Backup',
    url: savedFile.uri,
    dialogTitle: 'Save your Prepia Academic Memory'
  });
}

export async function restoreEcosystemBackup(file: File) {
  const zip = await JSZip.loadAsync(file);
  
  const ecosystemFile = zip.file('ecosystem.json');
  if (!ecosystemFile) {
    throw new Error('Invalid backup file. ecosystem.json missing.');
  }

  const jsonString = await ecosystemFile.async('string');
  const parsed = JSON.parse(jsonString);
  
  if (!parsed || !parsed.data) {
    throw new Error('Invalid backup file format.');
  }

  // CRITICAL: Atomic transaction across all 7 tables
  await db.transaction(
    'rw', 
    [db.profile, db.events, db.semesters, db.courses, db.routine, db.attendance, db.documents], 
    async () => {
      // Clear existing data
      await db.profile.clear();
      await db.events.clear();
      await db.semesters.clear();
      await db.courses.clear();
      await db.routine.clear();
      await db.attendance.clear();
      await db.documents.clear();
      
      // Bulk add new data safely
      if (parsed.data.profile?.length) await db.profile.bulkAdd(parsed.data.profile);
      if (parsed.data.events?.length) await db.events.bulkAdd(parsed.data.events);
      if (parsed.data.semesters?.length) await db.semesters.bulkAdd(parsed.data.semesters);
      if (parsed.data.courses?.length) await db.courses.bulkAdd(parsed.data.courses);
      if (parsed.data.routine?.length) await db.routine.bulkAdd(parsed.data.routine);
      if (parsed.data.attendance?.length) await db.attendance.bulkAdd(parsed.data.attendance);
      if (parsed.data.documents?.length) await db.documents.bulkAdd(parsed.data.documents);
    }
  );

  // Restore the physical files
  const documentFiles = zip.folder('documents');
  if (documentFiles) {
    for (const relativePath in documentFiles.files) {
      const zipFile = documentFiles.files[relativePath];
      if (!zipFile.dir) {
        const parts = relativePath.split('/');
        const filename = parts[parts.length - 1];
        
        try {
          const base64Data = await zipFile.async('base64');
          await Filesystem.writeFile({
            path: `DocumentVault/${filename}`,
            data: base64Data,
            directory: Directory.Data,
            recursive: true
          });
        } catch (e) {
          console.error('Failed to restore document file:', relativePath, e);
        }
      }
    }
  }
}
