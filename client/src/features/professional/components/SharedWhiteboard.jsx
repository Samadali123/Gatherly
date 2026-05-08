import { Tldraw, atom, createTLStore, defaultShapeUtils } from 'tldraw';
import 'tldraw/tldraw.css';
import { X } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';

const readOnlyComponents = {
  ActionsMenu: null,
  ContextMenu: null,
  DebugMenu: null,
  HelpMenu: null,
  HelperButtons: null,
  KeyboardShortcutsDialog: null,
  MainMenu: null,
  MenuPanel: null,
  Minimap: null,
  NavigationPanel: null,
  PageMenu: null,
  QuickActions: null,
  SharePanel: null,
  StylePanel: null,
  Toolbar: null,
  TopPanel: null,
  ZoomMenu: null,
};

export default function SharedWhiteboard({ meetingId, onClose, readOnly = false, roomCode, socket }) {
  const modeRef = useRef(atom('whiteboard mode', readOnly ? 'readonly' : 'readwrite'));
  const statusRef = useRef(atom('whiteboard status', socket?.connected ? 'online' : 'offline'));
  const storeRef = useRef(
    createTLStore({
      shapeUtils: defaultShapeUtils,
      collaboration: {
        mode: modeRef.current,
        status: statusRef.current,
      },
    })
  );

  const components = useMemo(() => (readOnly ? readOnlyComponents : undefined), [readOnly]);

  useEffect(() => {
    modeRef.current.set(readOnly ? 'readonly' : 'readwrite');
  }, [readOnly]);

  useEffect(() => {
    if (!socket) return undefined;

    const store = storeRef.current;
    const handleConnect = () => statusRef.current.set('online');
    const handleDisconnect = () => statusRef.current.set('offline');
    const handleRemoteChange = ({ changes } = {}) => {
      if (!changes) return;
      store.mergeRemoteChanges(() => {
        store.applyDiff(changes);
      });
    };

    const unsubscribe = store.listen(
      (entry) => {
        if (entry.source !== 'user') return;
        socket.emit('whiteboard_change', {
          meetingId,
          changes: entry.changes,
        });
      },
      { source: 'user', scope: 'document' }
    );

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('whiteboard_change', handleRemoteChange);

    return () => {
      unsubscribe();
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('whiteboard_change', handleRemoteChange);
    };
  }, [meetingId, socket]);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-[#f7faf8]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-default bg-white px-3 py-3 shadow-sm sm:px-4">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-text-secondary">Live whiteboard</p>
          <h2 className="truncate font-display text-[18px] font-medium text-text-primary sm:text-[20px]">Room {roomCode}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border-default bg-white px-3 py-1.5 text-[12px] font-medium text-text-secondary">
            {readOnly ? 'View only' : 'Host editing'}
          </span>
          {readOnly ? null : (
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border-default bg-white text-text-secondary" onClick={onClose} type="button">
              <X size={17} strokeWidth={1.7} />
            </button>
          )}
        </div>
      </header>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Tldraw components={components} store={storeRef.current} />
      </div>
    </div>
  );
}
