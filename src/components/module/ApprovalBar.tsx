import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ApprovalBarProps {
  /** Label for the approve action, e.g. "Aprobar como jefe" */
  approveLabel?: string;
  rejectLabel?: string;
  onApprove: (note?: string) => void | Promise<void>;
  onReject: (note: string) => void | Promise<void>;
  /** Ask for a note when approving too (default: only on reject) */
  noteOnApprove?: boolean;
  disabled?: boolean;
  pending?: boolean;
}

/**
 * Shared action bar for every approval pipeline.
 *
 * Rejection always requires a note — that rule was duplicated in each of the
 * inherited controllers and never enforced consistently in the UI.
 */
export function ApprovalBar({
  approveLabel = 'Aprobar',
  rejectLabel = 'Rechazar',
  onApprove,
  onReject,
  noteOnApprove = false,
  disabled = false,
  pending = false,
}: ApprovalBarProps) {
  const [dialog, setDialog] = useState<'approve' | 'reject' | null>(null);
  const [note, setNote] = useState('');

  const close = () => { setDialog(null); setNote(''); };

  const confirm = async () => {
    if (dialog === 'reject') {
      if (!note.trim()) return;
      await onReject(note.trim());
    } else {
      await onApprove(note.trim() || undefined);
    }
    close();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          className="flex-1"
          disabled={disabled || pending}
          onClick={() => (noteOnApprove ? setDialog('approve') : onApprove())}
        >
          <Check className="mr-2 size-4" />
          {approveLabel}
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          disabled={disabled || pending}
          onClick={() => setDialog('reject')}
        >
          <X className="mr-2 size-4" />
          {rejectLabel}
        </Button>
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => (open ? null : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === 'reject' ? rejectLabel : approveLabel}
            </DialogTitle>
            <DialogDescription>
              {dialog === 'reject'
                ? 'Indica el motivo del rechazo. Queda registrado y se notifica al solicitante.'
                : 'Puedes dejar un comentario opcional.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="approval-note">
              {dialog === 'reject' ? 'Motivo del rechazo' : 'Comentario'}
            </Label>
            <Textarea
              id="approval-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder={dialog === 'reject' ? 'Ej: fuera de temporada operativa' : 'Opcional'}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancelar</Button>
            <Button
              variant={dialog === 'reject' ? 'destructive' : 'default'}
              disabled={dialog === 'reject' && !note.trim()}
              onClick={confirm}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
