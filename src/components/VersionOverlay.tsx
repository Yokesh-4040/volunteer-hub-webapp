import { VERSION } from '@/config/version';

export default function VersionOverlay() {
  return (
    <div className="fixed bottom-2 right-2 z-50">
      <div className="rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm">
        {VERSION.toString()}
      </div>
    </div>
  );
} 