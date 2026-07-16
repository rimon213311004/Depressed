import { io } from "socket.io-client";
import { API_ORIGIN } from "./axios";

let socket = null;

export const connectSocket = (token) => {
  if (socket) socket.disconnect();
  socket = io(API_ORIGIN, { auth: { token } });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
