/**
 * Enum for call modes
 */
export enum CallMode {
  VIDEO = 'video',
  AUDIO = 'audio',
  SCREEN = "SCREEN",
}

/**
 * Interface for call room data
 */
export interface CallRoomData {
  roomUrl: string;
  roomToken: string;
  roomName: string;
  mode: CallMode;
}

/**
 * Interface for call response from the API
 */
export interface CallResponse {
  status: number;
  data: {
    admin: CallRoomData;
    user: CallRoomData;
  };
}

/**
 * Interface for call state
 */
export interface CallState {
  isActive: boolean;
  roomData?: CallRoomData;
  callInstance?: any; // DailyCall instance
} 