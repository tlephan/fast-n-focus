import type React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppInfo } from '../hooks';

const DEFAULT_TAGLINE = 'Get today done, be focused and no excuses';

type FontSize = 'small' | 'medium' | 'large';
type Theme = 'light' | 'dark' | 'system';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  onThemeChange: (value: Theme) => void;
  fontSize: FontSize;
  onFontSizeChange: (value: FontSize) => void;
  tagline: string;
  onTaglineChange: (value: string) => void;
  expirationDays: number;
  onExpirationDaysChange: (value: number) => void;
}

export function SettingsDialog({
  open,
  onClose,
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  tagline,
  onTaglineChange,
  expirationDays,
  onExpirationDaysChange,
}: SettingsDialogProps) {
  const { data: appInfo } = useAppInfo();

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
          {/* Theme */}
          <div className="flex items-center justify-between border-b pb-5">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Choose your preferred appearance</p>
            </div>
            <div className="flex gap-1">
              {([
                { value: 'light', icon: <Sun className="h-3.5 w-3.5" />, label: 'Light' },
                { value: 'dark', icon: <Moon className="h-3.5 w-3.5" />, label: 'Dark' },
                { value: 'system', icon: <Monitor className="h-3.5 w-3.5" />, label: 'System' },
              ] as { value: Theme; icon: React.ReactNode; label: string }[]).map(({ value, icon, label }) => (
                <button
                  key={value}
                  onClick={() => onThemeChange(value)}
                  title={label}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs transition-colors',
                    theme === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-secondary'
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
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
          <div className="border-b pb-5">
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

          {/* Expiration */}
          <div className="border-b pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-delete tasks</p>
                <p className="text-xs text-muted-foreground">Delete tasks older than N days (0 = never)</p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={365}
                  value={expirationDays}
                  onChange={(e) => onExpirationDaysChange(Math.max(0, Number(e.target.value)))}
                  className="w-16 rounded-md border bg-background px-2 py-1 text-center text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            </div>
          </div>

          {/* About */}
          <div>
            <p className="text-sm font-medium mb-2">About</p>
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="font-mono">{appInfo?.version || 'x.x.x'}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform</span>
                <span className="font-mono">{appInfo?.platform || 'unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span>Electron</span>
                <span className="font-mono">{appInfo?.electronVersion || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>Node.js</span>
                <span className="font-mono">{appInfo?.nodeVersion || '-'}</span>
              </div>
            </div>
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
