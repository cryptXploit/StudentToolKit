import { Button } from '@student-os/ui';
import { AlertCircle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({ isOpen, itemName, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-lg w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3 text-red-500">
            <AlertCircle size={24} />
            <h3 className="font-semibold text-lg text-foreground">Delete {itemName}?</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This will permanently remove this item and all associated data/files. This action cannot be undone.
          </p>
        </div>
        <div className="bg-muted/50 px-6 py-4 flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel} className="px-4 py-2 text-sm font-medium">
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm} className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white border-transparent">
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
