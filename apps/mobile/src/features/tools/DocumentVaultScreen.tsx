import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@student-os/storage';
import { Camera, Trash2, FolderLock, ArrowLeft } from 'lucide-react';
import { Card, Input, Button, Alert } from '@student-os/ui';
import { hapticImpact } from '../../lib/haptics';

export function DocumentVaultScreen() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const documents = useLiveQuery(() => 
    db.documents.orderBy('createdAt').reverse().toArray()
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!title.trim() || !previewImage) return;

    await db.documents.put({
      id: crypto.randomUUID(),
      title: title.trim(),
      imageData: previewImage,
      createdAt: new Date().toISOString()
    });

    setTitle('');
    setPreviewImage(null);
    hapticImpact('light');
  };

  const handleDelete = async (id: string) => {
    hapticImpact('medium');
    await db.documents.delete(id);
  };

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col h-full">
      <header className="mb-6 mt-2 flex items-center">
        <Button variant="ghost" className="mr-2 p-2 -ml-2 shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </Button>
        <div className="truncate flex items-center">
          <FolderLock className="mr-2 text-primary" size={20} />
          <h1 className="text-xl font-bold text-foreground truncate">Document Vault</h1>
        </div>
      </header>

      <Alert 
        variant="info" 
        icon={FolderLock}
        title="Secure Offline Storage"
        message="Your documents are encrypted and stored locally. They never leave this device."
        className="mb-6"
      />

      <Card className="p-4 mb-6 space-y-4">
        {!previewImage ? (
          <div>
            <input 
              type="file" 
              id="doc-upload" 
              accept="image/*" 
              className="hidden"
              onChange={handleFileChange}
            />
            <label 
              htmlFor="doc-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-xl cursor-pointer transition-colors"
            >
              <Camera size={32} className="text-primary mb-2 opacity-80" />
              <span className="text-sm font-medium text-primary">Scan or Upload Document</span>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-800" 
              />
              <button 
                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                onClick={() => setPreviewImage(null)}
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div>
              <Input 
                placeholder="Document Title (e.g., Student ID)" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <Button 
              variant="primary" 
              className="w-full py-3"
              disabled={!title.trim()}
              onClick={handleSave}
            >
              Save to Vault
            </Button>
          </div>
        )}
      </Card>

      <div className="flex-1 overflow-y-auto space-y-4 pb-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Saved Documents</h3>
        
        {documents === undefined ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-50"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center p-6 opacity-70 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-sm text-muted">No documents saved yet.</p>
          </div>
        ) : (
          documents.map(doc => (
            <Card key={doc.id} className="p-3">
              <img 
                src={doc.imageData} 
                alt={doc.title} 
                className="w-full h-48 object-cover rounded-md mb-3 bg-slate-100 dark:bg-slate-900" 
              />
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground truncate pl-1">{doc.title}</h4>
                <Button 
                  variant="ghost" 
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg shrink-0" 
                  onClick={() => handleDelete(doc.id)}
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
