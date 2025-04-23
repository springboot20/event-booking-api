import {
  CONNECTED_EVENT,
  CONNECTION_EVENT,
  DISCONNECTED_EVENT,
} from '../socket-events/socket-events';

export const initializeSocketIo = (io: any) => {
  io.on(CONNECTION_EVENT, async (socket: any) => {
    try {
    } catch (error: any) {}

    socket.emit(CONNECTED_EVENT);

    socket.on(DISCONNECTED_EVENT, () => {});
  });
};
