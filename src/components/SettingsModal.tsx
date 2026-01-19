'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/useSettingsStore';

export function SettingsModal() {
  const {
    anthropicKey,
    stabilityKey,
    isSettingsOpen,
    setAnthropicKey,
    setStabilityKey,
    setIsSettingsOpen,
    hasApiKeys,
  } = useSettingsStore();

  const [localAnthropicKey, setLocalAnthropicKey] = useState(anthropicKey);
  const [localStabilityKey, setLocalStabilityKey] = useState(stabilityKey);
  const [mounted, setMounted] = useState(false);

  // Handle hydration and auto-open
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !hasApiKeys()) {
      setIsSettingsOpen(true);
    }
  }, [mounted, hasApiKeys, setIsSettingsOpen]);

  // Sync local state with store when modal opens
  useEffect(() => {
    if (isSettingsOpen) {
      setLocalAnthropicKey(anthropicKey);
      setLocalStabilityKey(stabilityKey);
    }
  }, [isSettingsOpen, anthropicKey, stabilityKey]);

  const handleSave = () => {
    setAnthropicKey(localAnthropicKey);
    setStabilityKey(localStabilityKey);
    setIsSettingsOpen(false);
  };

  if (!mounted) return null;

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="space-y-3 pb-2">
          <DialogTitle className="text-xl leading-relaxed">Settings</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Enter your API keys to enable AI features. Keys are stored locally in your browser and never sent to our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6">
          <div className="grid gap-3">
            <Label htmlFor="anthropic-key" className="text-sm font-medium">
              Anthropic API Key
            </Label>
            <Input
              id="anthropic-key"
              type="password"
              placeholder="sk-ant-api03-..."
              value={localAnthropicKey}
              onChange={(e) => setLocalAnthropicKey(e.target.value)}
              className="h-10"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Required for text expansion features. Get your key from{' '}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="stability-key" className="text-sm font-medium">
              Stability API Key
            </Label>
            <Input
              id="stability-key"
              type="password"
              placeholder="sk-..."
              value={localStabilityKey}
              onChange={(e) => setLocalStabilityKey(e.target.value)}
              className="h-10"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Optional: for image generation features (coming soon)
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
