import { Canvas } from '@/components/Canvas';
import { SettingsModal } from '@/components/SettingsModal';
import { SettingsButton } from '@/components/SettingsButton';
import { Toolbar } from '@/components/Toolbar';

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <Canvas />
      <Toolbar />
      <SettingsButton />
      <SettingsModal />
    </main>
  );
}
