'use client';

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/useSettingsStore';

export function SettingsButton() {
  const setIsSettingsOpen = useSettingsStore((state) => state.setIsSettingsOpen);

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed top-4 right-4 z-50 bg-white shadow-md"
      onClick={() => setIsSettingsOpen(true)}
    >
      <Settings className="h-4 w-4" />
    </Button>
  );
}
