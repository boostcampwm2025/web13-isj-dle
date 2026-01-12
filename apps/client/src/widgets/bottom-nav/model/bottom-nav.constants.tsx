import {
  useAiNoteAction,
  useCameraAction,
  useDeskZoneAction,
  useLeaveAction,
  useMicAction,
  useScreenShareAction,
} from "../actions";
import type { BottomNavHook, BottomNavKey } from "./bottom-nav.types";

export const BOTTOM_NAVIGATION_MAP: Record<BottomNavKey, BottomNavHook> = {
  camera: useCameraAction,
  mic: useMicAction,
  screen_share: useScreenShareAction,
  desk_zone: useDeskZoneAction,
  ai_note: useAiNoteAction,
  leave: useLeaveAction,
};
