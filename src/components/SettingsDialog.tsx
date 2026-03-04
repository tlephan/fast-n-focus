import { Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';

const DEFAULT_TAGLINE = 'Get today tasks done - Focus - No excuses';

type FontSize = 'small' | 'medium' | 'large';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  darkMode: boolean;
  onDarkModeChange: (value: boolean) => void;
  fontSize: FontSize;
  onFontSizeChange: (value: FontSize) => void;
  tagline: string;
  onTaglineChange: (value: string) => void;
}

export function SettingsDialog({
  open,
  onClose,
  darkMode,
  onDarkModeChange,
  fontSize,
  onFontSizeChange,
  tagline,
  onTaglineChange,
}: SettingsDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          {/* Dark mode */}
          <div className="flex items-center justify-between border-b pb-5">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">Toggle light and dark theme</p>
            </div>
            <button
              onClick={() => onDarkModeChange(!darkMode)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
                darkMode ? 'bg-secondary' : 'hover:bg-secondary'
              )}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {/* Font size */}
          <div className="border-b pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Font size</p>
                <p className="text-xs text-muted-foreground">Scale text across the app</p>
              </div>
              <div className="flex gap-1">
                {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => onFontSizeChange(size)}
                    className={cn(
                      'rounded-md border px-3 py-1 text-xs capitalize transition-colors',
                      fontSize === size
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-secondary'
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <p className="text-sm font-medium mb-1.5">Tagline</p>
            <p className="text-xs text-muted-foreground mb-2">
              Subtitle shown in the app header
            </p>
            <input
              type="text"
              value={tagline}
              onChange={(e) => onTaglineChange(e.target.value)}
              placeholder={DEFAULT_TAGLINE}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {tagline !== DEFAULT_TAGLINE && (
              <button
                onClick={() => onTaglineChange(DEFAULT_TAGLINE)}
                className="mt-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset to default
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t pt-4">
          <button
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
