import { useAppInfo } from '../hooks';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  const { data: appInfo } = useAppInfo();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-lg border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">About Fast & Focus</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground italic">
            Get today tasks done - Focus - No excuses
          </p>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span className="font-mono">{appInfo?.version || 'x.x.x'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform:</span>
              <span className="font-mono">{appInfo?.platform || 'unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Electron:</span>
              <span className="font-mono">{appInfo?.electronVersion || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Node.js:</span>
              <span className="font-mono">{appInfo?.nodeVersion || '-'}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
