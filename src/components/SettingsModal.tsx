'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Enter your API keys to enable AI features. Keys are stored locally in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="anthropic-key">Anthropic API Key</Label>
            <Input
              id="anthropic-key"
              type="password"
              placeholder="sk-ant-..."
              value={localAnthropicKey}
              onChange={(e) => setLocalAnthropicKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Required for text expansion features
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stability-key">Stability API Key</Label>
            <Input
              id="stability-key"
              type="password"
              placeholder="sk-..."
              value={localStabilityKey}
              onChange={(e) => setLocalStabilityKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional: for image generation features
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
