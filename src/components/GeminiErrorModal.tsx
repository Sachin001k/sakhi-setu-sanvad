import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { geminiErrorBus, GeminiErrorPayload } from '@/lib/geminiErrorBus';

const GeminiErrorModal = () => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<GeminiErrorPayload | null>(null);

  useEffect(() => {
    const unsubscribe = geminiErrorBus.subscribe((payload) => {
      setError(payload);
      setOpen(true);
    });
    return unsubscribe;
  }, []);

  if (!error) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            Gemini service issue
          </DialogTitle>
          <DialogDescription>
            {error.message || 'Gemini could not process your request right now.'}
          </DialogDescription>
        </DialogHeader>
        {error.action && (
          <p className="text-sm font-medium text-gray-700">
            Action: {error.action}
          </p>
        )}
        {error.detail && (
          <div className="mt-3 max-h-60 overflow-auto rounded-lg bg-gray-100 p-3 font-mono text-xs text-gray-700 break-words whitespace-pre-wrap">
            {error.detail}
          </div>
        )}
        <p className="text-sm text-gray-600">
          Please try again in a moment or verify that your Gemini API usage limits have not been exceeded.
        </p>
        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)} className="mt-4">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GeminiErrorModal;
