import { Server as SocketIoServer } from 'socket.io';
import CorsConfig from '../cors.config.js';

let io;

export function initSocket(server) {
    io = new SocketIoServer(server, {
        cors: {
            origin: CorsConfig,
            credentials: true,
        },
    });
}

export function getSocket() {
    if (!io) {
        throw new Error('Socket.io instance is not initialized');
    }
    return io;
}
