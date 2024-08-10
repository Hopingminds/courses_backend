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

    io.on('connection', (socket) => {
        // Join a group
        socket.on('join group', (groupId) => {
            socket.join(groupId);
        });

        // Handle incoming messages for live chat
        socket.on('chat message', (data) => {
            const { groupId, msg, user } = data;
            const timestamp = new Date().toISOString();
            const messageData = { msg, user, timestamp };
            io.to(groupId).emit('chat message', messageData); // Broadcast the message to the group
        });

        // Handle joining a teacher-specific chat room
        socket.on('join teacher chat', (teacherId) => {
            const roomName = `teacher-${teacherId}`;
            socket.join(roomName);
        });

        // Handle student-specific room joining
        socket.on('join student room', (studentId) => {
            socket.join(studentId);
        });

        // Handle private messages (teacher chat)
        socket.on('private message', (data) => {
            const { msg, user, isTeacher, teacherId, studentId } = data;
            const timestamp = new Date().toISOString();
            const messageData = { msg, user, timestamp, studentId };

            if (isTeacher) {
                // Teacher sends message to a student in their specific group
                io.to(studentId).emit('private message', messageData); // Send to the specific student
            } else {
                // Student sends message to the teacher in their specific room
                const teacherRoom = `teacher-${teacherId}`;
                io.to(teacherRoom).emit('private message', messageData);
            }

            // Optionally, send a confirmation to the sender
            socket.emit('private message', messageData);
        });
    });
}

export function getSocket() {
    if (!io) {
        throw new Error('Socket.io instance is not initialized');
    }
    return io;
}
