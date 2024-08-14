import { Server as SocketIoServer } from 'socket.io';
import CorsConfig from '../cors.config.js';
import UserModel from '../model/User.model.js';

let io;
const userGroups = {}; // Keeps track of users in each group

export function initSocket(server) {
    io = new SocketIoServer(server, {
        cors: {
            origin: CorsConfig,
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        // Join a group
        socket.on('join group', async (data) => {
            const { groupId, studentId } = data;

            // Add user to the group
            socket.join(groupId);

            // Initialize the group entry if not present
            if (!userGroups[groupId]) {
                userGroups[groupId] = [];
            }

            if (!userGroups[groupId].includes(studentId)) {
                // Add the user to the group list
                userGroups[groupId].push(studentId);
        
                // Fetch user details for all users in the group
                const userDetails = await Promise.all(
                    userGroups[groupId].map(async id => {
                        const user = await UserModel.findById(id).select('name'); // Fetch only the 'name' field
                        return { id, name: user ? user.name : 'Unknown' };
                    })
                );
        
                // Send the list of users in the group to the newly joined user
                socket.to(groupId).emit('group users', userDetails);
        
                // Optionally, send a notification to other users in the group
                socket.to(groupId).emit('student joined', { id: studentId });
            } else{
                // Fetch user details for all users in the group
                const userDetails = await Promise.all(
                    userGroups[groupId].map(async id => {
                        const user = await UserModel.findById(id).select('name'); // Fetch only the 'name' field
                        return { id, name: user ? user.name : 'Unknown' };
                    })
                );
        
                // Send the list of users in the group to the newly joined user
                socket.to(groupId).emit('group users', userDetails);
            }
        });

        // Handle leaving a group
        socket.on('leave group', async (data) => {
            const { groupId, studentId } = data;

            // Remove the user from the group
            socket.leave(groupId);

            if (userGroups[groupId]) {
                // Fetch the user's name before removing them from the group
                const user = await UserModel.findById(studentId).select('name');

                // Remove user from the group list
                userGroups[groupId] = userGroups[groupId].filter(id => id.studentId !== studentId);

                // Optionally, send a notification to other users in the group
                socket.to(groupId).emit('student left', { studentId, name: user ? user.name : 'Unknown' });
            }
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

        // Handle disconnection
        socket.on('disconnect', () => {
            // Remove user from all groups they were in
            for (const groupId in userGroups) {
                userGroups[groupId] = userGroups[groupId].filter(id => id !== socket.id);
                if (userGroups[groupId].length === 0) {
                    delete userGroups[groupId];
                }
            }
        });
    });
}

export function getSocket() {
    if (!io) {
        throw new Error('Socket.io instance is not initialized');
    }
    return io;
}
