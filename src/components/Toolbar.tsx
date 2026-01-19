'use client';

import { ArrowDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanvasStore } from '@/store/useCanvasStore';

export function Toolbar() {
  const layoutDirection = useCanvasStore((state) => state.layoutDirection);
  const toggleLayoutDirection = useCanvasStore((state) => state.toggleLayoutDirection);

  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleLayoutDirection}
        className="bg-white shadow-md border-zinc-200 hover:bg-zinc-50 gap-2"
      >
        {layoutDirection === 'VERTICAL' ? (
          <>
            <ArrowDown className="h-4 w-4" />
            <span className="text-xs">Vertical</span>
          </>
        ) : (
          <>
            <ArrowRight className="h-4 w-4" />
            <span className="text-xs">Horizontal</span>
          </>
        )}
      </Button>
    </div>
  );
}
