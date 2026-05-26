'use client';
import { useIdentityStore } from '@/store/useIdentityStore';
import { Upload, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import toast from 'react-hot-toast';

export function VRMAvatarSlot() {
  const { linkedAvatar, linkAvatar, unlinkAvatar } = useIdentityStore();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    linkAvatar(f.name);
    toast.success(`Avatar "${f.name}" linked to your identity`);
  }

  if (linkedAvatar) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white">
          {linkedAvatar.filename.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[160px]">{linkedAvatar.filename}</p>
          <p className="text-[10px] text-zinc-450 mt-0.5 font-mono">Linked {new Date(linkedAvatar.linkedAt).toLocaleDateString()}</p>
        </div>
        <button onClick={() => { unlinkAvatar(); toast.success('Avatar unlinked'); }}
          className="flex items-center gap-1.5 text-[10px] text-red-500 hover:text-red-600 font-semibold uppercase">
          <Trash2 size={11} /> Unlink
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
      <input ref={fileRef} type="file" accept=".vrm,.glb,.gltf" onChange={handleFile} className="hidden" />
      <div className="w-14 h-14 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400">
        <Upload size={20} />
      </div>
      <div>
        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No avatar linked</p>
        <p className="text-[10px] text-zinc-450 mt-0.5">Upload a .vrm or .glb file</p>
      </div>
      <button onClick={() => fileRef.current?.click()} data-testid="upload-avatar-btn"
        className="px-3 py-1.5 text-[10px] font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg uppercase tracking-wider">
        Upload Avatar
      </button>
    </div>
  );
}
