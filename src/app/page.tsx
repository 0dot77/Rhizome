import { Canvas } from '@/components/Canvas';
import { SettingsModal } from '@/components/SettingsModal';
import { SettingsButton } from '@/components/SettingsButton';

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <Canvas />
      <SettingsButton />
      <SettingsModal />
    </main>
  );
}
