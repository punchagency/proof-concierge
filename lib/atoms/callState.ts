import { atom } from "jotai";
import { CallMode } from "@/types/communication";

// Call state interface
export interface CallState {
  isActive: boolean;
  mode: CallMode | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  participantCount: number;
  roomUrl: string | null;
  roomToken: string | null;
  roomName: string | null;
  queryId: number | null;
  userId: number | null;
}

// Initial call state
const initialCallState: CallState = {
  isActive: false,
  mode: null,
  isMuted: true,
  isVideoOff: true,
  isScreenSharing: false,
  participantCount: 0,
  roomUrl: null,
  roomToken: null,
  roomName: null,
  queryId: null,
  userId: null,
};

// Call state atom
export const callStateAtom = atom<CallState>(initialCallState);

// Derived atoms for specific state values
export const isCallActiveAtom = atom((get) => get(callStateAtom).isActive);

export const callModeAtom = atom((get) => get(callStateAtom).mode);

export const isMutedAtom = atom(
  (get) => get(callStateAtom).isMuted,
  (get, set, value: boolean) => {
    set(callStateAtom, {
      ...get(callStateAtom),
      isMuted: value,
    });
  }
);

export const isVideoOffAtom = atom(
  (get) => get(callStateAtom).isVideoOff,
  (get, set, value: boolean) => {
    set(callStateAtom, {
      ...get(callStateAtom),
      isVideoOff: value,
    });
  }
);

export const isScreenSharingAtom = atom(
  (get) => get(callStateAtom).isScreenSharing,
  (get, set, value: boolean) => {
    set(callStateAtom, {
      ...get(callStateAtom),
      isScreenSharing: value,
    });
  }
);

export const participantCountAtom = atom(
  (get) => get(callStateAtom).participantCount,
  (get, set, value: number) => {
    set(callStateAtom, {
      ...get(callStateAtom),
      participantCount: value,
    });
  }
);

// Action atoms
export const startCallAtom = atom(
  null,
  (
    get,
    set,
    params: {
      queryId: number;
      userId: number;
      mode: CallMode;
      roomUrl: string;
      roomToken: string;
      roomName: string;
    }
  ) => {
    set(callStateAtom, {
      ...get(callStateAtom),
      isActive: true,
      mode: params.mode,
      queryId: params.queryId,
      userId: params.userId,
      roomUrl: params.roomUrl,
      roomToken: params.roomToken,
      roomName: params.roomName,
      participantCount: 1,
    });
  }
);

export const endCallAtom = atom(null, (get, set) => {
  set(callStateAtom, initialCallState);
});
