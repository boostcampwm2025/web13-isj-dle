import { useWhiteboard } from "../model/use-whiteboard";

import { CollaborationModal } from "@shared/ui";
import { Tldraw } from "@tldraw/tldraw";

const WhiteboardModalContent = () => {
  const { store, status, error, closeTool, handleMount } = useWhiteboard();

  return (
    <CollaborationModal isOpen onClose={closeTool} title="화이트보드">
      {status === "error" && (
        <div className="flex h-full items-center justify-center text-red-500">
          화이트보드 연결 오류: {error?.message}
        </div>
      )}
      {!store && <div className="flex h-full items-center justify-center">연결 중...</div>}
      {store && status !== "error" && (
        <Tldraw licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY} store={store} onMount={handleMount} />
      )}
    </CollaborationModal>
  );
};

export default WhiteboardModalContent;
