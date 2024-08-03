import { getSocket } from '../socket/socket.js';

export async function createNotification(req, res) {
    try {
        const { LinkedTo, heading, message } = req.body;

        // Validate input
        if (!LinkedTo || !heading || !message) {
            return res.status(400).json({ error: 'Invalid input data' });
        }

        // Create notification payload
        const notificationPayload = {
            LinkedTo,
            heading,
            message
        };

        // Get the initialized Socket.io instance
        const io = getSocket();

        // Emit the notification to all connected clients
        io.emit('notification', notificationPayload);

        res.status(200).json({ message: 'Notification sent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
