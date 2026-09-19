import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '@student-os/storage';
import { Trash2, FolderLock, ArrowLeft, ChevronRight, FileText, Image as ImageIcon, BookOpen, FileUp, Folder } from 'lucide-react';
import { Card, Input, Button, Alert } from '@student-os/ui';
import { hapticImpact } from '../../lib/haptics';
import { FileOpener } from '@capacitor-community/file-opener';
import { saveBase64ToDisk, deleteFileFromDisk } from '../../lib/filesystem';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

function generateSafeId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function DocumentVaultScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  // Drill-Down State as Requested
  const [selectedSemester, setSelectedSemester] = useState<any | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  useEffect(() => {
    const state = location.state as any;
    if (state && state.initialSemesterId && state.initialCourseId) {
      setSelectedSemester({ id: state.initialSemesterId, name: 'Semester' });
      setSelectedCourse({ id: state.initialCourseId, name: state.initialCourseName || 'Course' });
      
      // Clear state so manual back navigation doesn't get stuck
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Data State
  const [semesters, setSemesters] = useState<any[] | undefined>(undefined);
  const [courses, setCourses] = useState<any[] | undefined>(undefined);
  const [documents, setDocuments] = useState<any[] | undefined>(undefined);
  
  // Upload State
  const [title, setTitle] = useState('');
  const [previewFile, setPreviewFile] = useState<{ data: string, type: string, size: number, isImage: boolean } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetching Data (Sorted natively in-memory)
  const fetchSemesters = async () => {
    try {
      if (!db || typeof db.semesters === 'undefined') return;
      const data = await db.semesters.toArray();
      data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      // Compute counts for semesters? Not requested, just courses.
      
      const legacyDocs = await db.documents.where({ courseId: 'unassigned' }).count();
      if (legacyDocs > 0 && !data.find(s => s.id === 'legacy')) {
        data.unshift({ id: 'legacy', name: 'Legacy Documents' } as any);
      }

      setSemesters(data);
    } catch (e) {
      console.error(e);
      setSemesters([]);
    }
  };

  const fetchCourses = async (sem: any) => {
    try {
      setCourses(undefined);
      if (sem.id === 'legacy') {
        const count = await db.documents.where({ courseId: 'unassigned' }).count();
        setCourses([{ id: 'unassigned', name: 'Unassigned Documents', docCount: count }]);
        return;
      }
      
      const data = await db.courses.where({ semesterId: sem.id }).toArray();
      // Get document counts for each course
      const dataWithCounts = await Promise.all(data.map(async (c) => {
        const docCount = await db.documents.where({ courseId: c.id }).count();
        return { ...c, docCount };
      }));
      setCourses(dataWithCounts);
    } catch (e) {
      console.error(e);
      setCourses([]);
    }
  };

  const fetchDocuments = async (course: any) => {
    try {
      setDocuments(undefined);
      const data = await db.documents.where({ courseId: course.id }).toArray();
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDocuments(data);
    } catch (e) {
      console.error(e);
      setDocuments([]);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  // Handlers
  const handleSelectSemester = (sem: any) => {
    setSelectedSemester(sem);
    fetchCourses(sem);
  };

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    fetchDocuments(course);
  };

  const handleBack = () => {
    if (selectedCourse) {
      setSelectedCourse(null);
      setPreviewFile(null);
      if (selectedSemester) fetchCourses(selectedSemester); // Refresh counts when going back
    } else if (selectedSemester) {
      setSelectedSemester(null);
    } else {
      navigate(-1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaveError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      setSaveError("File is too large. Max 20MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const isImage = file.type.startsWith('image/');
      
      setPreviewFile({
        data: result,
        type: file.type,
        size: file.size,
        isImage
      });
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, "")); // Strip extension for title
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!title.trim() || !previewFile || !selectedCourse) return;

    try {
      const docId = generateSafeId();
      const ext = previewFile.type === 'application/pdf' ? 'pdf' : (previewFile.type === 'image/png' ? 'png' : 'jpg');
      const safeName = `${docId}-${title.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
      
      const fileUri = await saveBase64ToDisk(previewFile.data, safeName);
      
      const putPromise = db.documents.put({
        id: docId,
        courseId: selectedCourse.id,
        semesterId: selectedSemester?.id === 'legacy' ? undefined : selectedSemester?.id,
        title: title.trim(),
        fileUri: fileUri,
        mimeType: previewFile.type,
        size: previewFile.size,
        createdAt: new Date().toISOString()
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("DATABASE HANGING: Dexie is not responding.")), 2000)
      );
      
      await Promise.race([putPromise, timeoutPromise]);

      setTitle('');
      setPreviewFile(null);
      hapticImpact('light');
      
      await fetchDocuments(selectedCourse);
    } catch (error: any) {
      console.error("Failed to save document:", error);
      setSaveError(error.message || "Unknown database error occurred.");
    }
  };

  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, fileUri?: string } | null>(null);

  const confirmDeleteDoc = async () => {
    if (!itemToDelete) return;
    hapticImpact('medium');
    if (itemToDelete.fileUri) {
      await deleteFileFromDisk(itemToDelete.fileUri);
    }
    await db.documents.delete(itemToDelete.id);
    if (selectedCourse) await fetchDocuments(selectedCourse);
    setItemToDelete(null);
  };

  const handleOpenDocument = async (doc: any) => {
    hapticImpact('light');
    try {
      if (!doc.fileUri) {
        throw new Error("File has not been migrated to disk yet. Restart the app to migrate.");
      }
      await FileOpener.open({ filePath: doc.fileUri, contentType: doc.mimeType });
    } catch (e: any) {
      console.error("Failed to open document", e);
      alert("Could not open file: " + (e.message || 'Unknown error'));
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col h-full">
      <header className="mb-6 mt-2 flex items-center">
        <Button variant="ghost" className="mr-2 p-2 -ml-2 shrink-0" onClick={handleBack}>
          <ArrowLeft size={24} />
        </Button>
        <div className="truncate flex items-center">
          <FolderLock className="mr-2 text-primary shrink-0" size={20} />
          <h1 className="text-xl font-bold text-foreground truncate">
            {!selectedSemester ? 'Document Vault' : 
             !selectedCourse ? selectedSemester.name : 
             (selectedCourse.name || 'Unnamed Course')}
          </h1>
        </div>
      </header>

      {!selectedSemester && (
        <>
          <Alert 
            variant="info" 
            icon={FolderLock}
            title="Secure Offline Storage"
            message="Your documents and notes are organized by course and stored entirely offline."
            className="mb-6"
          />
          <div className="flex-1 overflow-y-auto space-y-3 pb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">Select Semester</h3>
            
            {semesters === undefined ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
              </div>
            ) : semesters.length === 0 ? (
              <Card className="p-6 text-center flex flex-col items-center justify-center h-48 opacity-70">
                <BookOpen className="text-muted-foreground mb-3" size={32} />
                <p className="text-sm text-muted-foreground">No semesters found. Add one in the Memory tab.</p>
              </Card>
            ) : (
              semesters.map(semester => (
                <Card key={semester.id} className="flex items-center justify-between p-1 overflow-hidden group">
                  <button onClick={() => handleSelectSemester(semester)} className="flex-1 p-3 flex items-center justify-between active:scale-95 transition-transform rounded-lg text-left">
                    <div className="flex items-center">
                      <Folder className="mr-3 text-primary" size={20} />
                      <span className="font-semibold text-foreground">{semester.name}</span>
                    </div>
                    <ChevronRight size={20} className="text-muted-foreground opacity-50" />
                  </button>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {selectedSemester && !selectedCourse && (
        <div className="flex-1 overflow-y-auto space-y-3 pb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">Select Course</h3>
          
          {courses === undefined ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
            </div>
          ) : courses.length === 0 ? (
            <Card className="p-6 text-center flex flex-col items-center justify-center h-48 opacity-70">
              <BookOpen className="text-muted-foreground mb-3" size={32} />
              <p className="text-sm text-muted-foreground">No courses found in this semester.</p>
            </Card>
          ) : (
            courses.map(course => (
              <Card key={course.id} className="flex items-center justify-between p-1 overflow-hidden group">
                <button onClick={() => handleSelectCourse(course)} className="flex-1 p-3 flex items-center justify-between active:scale-95 transition-transform rounded-lg text-left">
                  <div className="flex items-center">
                    <Folder className="mr-3 text-primary" size={20} />
                    <span className="font-semibold text-foreground">{course.name || 'Unnamed Course'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {course.docCount !== undefined && (
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-foreground px-2 py-1 rounded-full font-medium">
                        {course.docCount} {course.docCount === 1 ? 'Note' : 'Notes'}
                      </span>
                    )}
                    <ChevronRight size={20} className="text-muted-foreground opacity-50" />
                  </div>
                </button>
              </Card>
            ))
          )}
        </div>
      )}

      {selectedCourse && (
        <>
          <Card className="p-4 mb-6 space-y-4">
            {saveError && <div className="text-red-500 text-sm">{saveError}</div>}
            
            {!previewFile ? (
              <div>
                <input 
                  type="file" 
                  id="doc-upload" 
                  accept="image/jpeg, image/png, application/pdf" 
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label 
                  htmlFor="doc-upload"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-xl cursor-pointer active:scale-95 transition-transform"
                >
                  <FileUp size={24} className="text-primary mb-2 opacity-80" />
                  <span className="text-sm font-medium text-primary">Upload Note (PDF/JPG/PNG)</span>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  {previewFile.isImage ? (
                    <img 
                      src={previewFile.data} 
                      alt="Preview" 
                      className="max-h-40 object-contain rounded" 
                    />
                  ) : (
                    <div className="flex flex-col items-center py-4">
                      <FileText size={40} className="text-red-500 mb-2" />
                      <span className="text-sm text-muted-foreground">PDF Document</span>
                    </div>
                  )}
                  <button 
                    className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                    onClick={() => { setPreviewFile(null); setTitle(''); }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div>
                  <Input 
                    placeholder="Document Title (e.g., Chapter 1 Notes)" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <Button 
                  type="button"
                  variant="primary" 
                  className="w-full py-3"
                  disabled={!title.trim()}
                  onClick={handleSave}
                >
                  Save to {selectedCourse.name || 'Unnamed Course'}
                </Button>
              </div>
            )}
          </Card>

          <div className="flex-1 overflow-y-auto space-y-3 pb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">Course Documents</h3>
            
            {documents === undefined ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center p-6 opacity-70 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-sm text-muted-foreground">No documents saved for this course yet.</p>
              </div>
            ) : (
              documents.map(doc => {
                const isPdf = doc.mimeType === 'application/pdf' || (!doc.mimeType && !doc.fileUri);
                return (
                  <Card key={doc.id} className="p-1">
                    <div className="flex items-center justify-between pl-3 p-1">
                      <button 
                        className="flex items-center flex-1 text-left active:scale-95 transition-transform py-2"
                        onClick={() => handleOpenDocument(doc)}
                      >
                        {isPdf ? (
                          <FileText size={24} className="text-red-500 mr-3 shrink-0" />
                        ) : (
                          <ImageIcon size={24} className="text-blue-500 mr-3 shrink-0" />
                        )}
                        <div className="truncate">
                          <h4 className="font-semibold text-sm text-foreground truncate">{doc.title}</h4>
                          {doc.size && <span className="text-[10px] text-muted-foreground">{(doc.size / 1024 / 1024).toFixed(2)} MB</span>}
                        </div>
                      </button>
                      <Button 
                        variant="ghost" 
                        className="p-3 text-muted-foreground hover:text-red-500 rounded-lg shrink-0" 
                        onClick={() => setItemToDelete({ id: doc.id, name: doc.title, fileUri: doc.fileUri })}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}

      <ConfirmDeleteModal
        isOpen={itemToDelete !== null}
        itemName={itemToDelete?.name || ''}
        onConfirm={confirmDeleteDoc}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}
