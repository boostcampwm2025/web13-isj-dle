import { useEffect, useRef } from "react";

import { getColorForClient, injectCursorStyles, removeCursorStyles } from "../model/cursor-colors.utils";
import "./remote-cursors.css";
import type * as Monaco from "monaco-editor";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

type Awareness = WebsocketProvider["awareness"];

const ContentWidgetPositionPreference = {
  ABOVE: 1,
  BELOW: 2,
} as const;

interface RemoteCursorsProps {
  editor: Monaco.editor.IStandaloneCodeEditor;
  awareness: Awareness;
  ytext: Y.Text;
}

interface CursorWidget extends Monaco.editor.IContentWidget {
  clientID: number;
}

const RemoteCursors = ({ editor, awareness, ytext }: RemoteCursorsProps) => {
  const widgetsRef = useRef<Map<number, CursorWidget>>(new Map());
  const fadeTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdateRef = useRef(false);

  useEffect(() => {
    const doc = ytext.doc;
    if (!doc) return;

    const model = editor.getModel();
    if (!model) return;

    const createWidget = (clientID: number, name: string, position: Monaco.IPosition): CursorWidget => {
      const { color } = getColorForClient(clientID);
      injectCursorStyles(clientID);

      const domNode = document.createElement("div");
      domNode.className = "pointer-events-none";

      const label = document.createElement("div");
      label.className =
        "remote-cursor-label px-1.5 py-0.5 rounded-r rounded-b text-xs font-medium text-white max-w-36 truncate";
      label.style.backgroundColor = color;
      label.textContent = name;

      domNode.appendChild(label);

      const timeout = setTimeout(() => {
        label.classList.add("fade-out");
      }, 3000);
      fadeTimeoutsRef.current.set(clientID, timeout);

      const widget: CursorWidget = {
        clientID,
        getId: () => `remote-cursor-${clientID}`,
        getDomNode: () => domNode,
        getPosition: () => ({
          position,
          preference: [ContentWidgetPositionPreference.BELOW, ContentWidgetPositionPreference.ABOVE],
        }),
      };

      return widget;
    };

    const performUpdate = () => {
      const states = awareness.getStates();
      const currentWidgets = widgetsRef.current;
      const seenClients = new Set<number>();

      states.forEach((state, clientID) => {
        if (clientID === doc.clientID) return;

        seenClients.add(clientID);

        const userName = state.user?.name || "Anonymous";
        const selection = state.selection;

        if (!selection?.head) {
          const existingWidget = currentWidgets.get(clientID);
          if (existingWidget) {
            editor.removeContentWidget(existingWidget);
            currentWidgets.delete(clientID);
            removeCursorStyles(clientID);
          }
          return;
        }

        const headAbs = Y.createAbsolutePositionFromRelativePosition(selection.head, doc);
        if (!headAbs || headAbs.type !== ytext) return;

        const position = model.getPositionAt(headAbs.index);

        const existingWidget = currentWidgets.get(clientID);

        if (existingWidget) {
          const domNode = existingWidget.getDomNode();
          const label = domNode.querySelector(".remote-cursor-label");
          if (label && label.textContent !== userName) {
            label.textContent = userName;
          }

          existingWidget.getPosition = () => ({
            position,
            preference: [ContentWidgetPositionPreference.BELOW, ContentWidgetPositionPreference.ABOVE],
          });
          editor.layoutContentWidget(existingWidget);

          const oldTimeout = fadeTimeoutsRef.current.get(clientID);
          if (oldTimeout) clearTimeout(oldTimeout);

          if (label) {
            label.classList.remove("fade-out");
            const newTimeout = setTimeout(() => {
              label.classList.add("fade-out");
            }, 3000);
            fadeTimeoutsRef.current.set(clientID, newTimeout);
          }
        } else {
          const widget = createWidget(clientID, userName, position);
          currentWidgets.set(clientID, widget);
          editor.addContentWidget(widget);
        }
      });

      currentWidgets.forEach((widget, clientID) => {
        if (!seenClients.has(clientID)) {
          editor.removeContentWidget(widget);
          currentWidgets.delete(clientID);
          removeCursorStyles(clientID);

          const timeout = fadeTimeoutsRef.current.get(clientID);
          if (timeout) {
            clearTimeout(timeout);
            fadeTimeoutsRef.current.delete(clientID);
          }
        }
      });
    };

    const updateCursors = () => {
      if (throttleTimerRef.current) {
        pendingUpdateRef.current = true;
        return;
      }

      performUpdate();
      pendingUpdateRef.current = false;

      throttleTimerRef.current = setTimeout(() => {
        throttleTimerRef.current = null;

        if (pendingUpdateRef.current) {
          updateCursors();
        }
      }, 16);
    };

    updateCursors();
    awareness.on("change", updateCursors);

    const currentWidgets = widgetsRef.current;
    const currentFadeTimeouts = fadeTimeoutsRef.current;
    return () => {
      awareness.off("change", updateCursors);

      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }

      currentWidgets.forEach((widget, clientID) => {
        editor.removeContentWidget(widget);
        removeCursorStyles(clientID);
      });
      currentWidgets.clear();

      currentFadeTimeouts.forEach((timeout) => clearTimeout(timeout));
      currentFadeTimeouts.clear();
    };
  }, [editor, awareness, ytext]);

  return null;
};

export default RemoteCursors;
