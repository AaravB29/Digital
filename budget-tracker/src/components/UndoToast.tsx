import type { UndoToastState } from '../hooks/useUndoToast';

interface Props {
  toast: UndoToastState | null;
  onDismiss: () => void;
}

export default function UndoToast({ toast, onDismiss }: Props) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 md:bottom-6">
      {toast && (
        <div key={toast.id} className="pointer-events-auto flex items-center gap-4 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          <span>{toast.message}</span>
          <button
            type="button"
            className="font-semibold text-teal-300 hover:text-teal-200 focus-visible:outline-2 focus-visible:outline-teal-300"
            onClick={() => {
              toast.onUndo();
              onDismiss();
            }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
