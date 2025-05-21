import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();


// Set up Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
    process.env.MEETING_GOOGLE_CLIENT_ID,
    process.env.MEETING_GOOGLE_CLIENT_SECRET,
    `${process.env.SERVER_BASE_URL}/auth/google/callback`
);

// Set credentials using refresh token
oauth2Client.setCredentials({
    refresh_token: process.env.MEETING_GOOGLE_REFRESH_TOKEN
});

// Create Google Calendar API client (used for Google Meet)
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

/**
 * Create a Google Meet session and return the meeting details
 * @param {string} lessonName - Name of the lesson
 * @param {Date} startDateTime - Start date and time for the meeting
 * @param {Date} endDateTime - End date and time for the meeting
 * @param {Array} attendeeEmails - Array of attendee email addresses
 * @returns {Object} Meeting details including link and stream key
 */
export const createGoogleMeet = async (lessonName, startDateTime, endDateTime, attendeeEmails, instructorEmail, instructorName) => {
    try {
        // Adjust time by -5:30 (India Standard Time, IST)
        const adjustedStartDateTime = new Date(startDateTime);
        adjustedStartDateTime.setMinutes(adjustedStartDateTime.getMinutes() - 330);

        const adjustedEndDateTime = new Date(endDateTime);
        adjustedEndDateTime.setMinutes(adjustedEndDateTime.getMinutes() - 330);

        // Create event with Google Meet conference
        const event = {
            summary: `Live Class: ${lessonName}`,
            description: `Live class session for ${lessonName}`,
            start: {
                dateTime: adjustedStartDateTime.toISOString(),
                timeZone: 'UTC',
            },
            end: {
                dateTime: adjustedEndDateTime.toISOString(),
                timeZone: 'UTC',
            },
            attendees: attendeeEmails.map(email => ({ email })),
            organizer: {
                email: `meetings@hopingminds.com`,
                displayName: `${instructorName}`
            },
            conferenceData: {
                createRequest: {
                    requestId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            },
            guestsCanModify: false, // Guests cannot modify event details
            guestsCanSeeOtherGuests: false, // Hides guest emails from other attendees
            visibility: 'private', // Ensures event is private
            sendUpdates: 'all', // Send email notifications to all attendees
        };

        // Insert the event to Google Calendar
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
        });

        // Extract conference details
        const conferenceData = response.data.conferenceData;
        const meetingLink = conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || '';
        const streamKey = conferenceData?.conferenceId || '';

        return {
            eventId: response.data.id,
            meetingLink,
            streamKey,
            startDate: startDateTime,
            endDate: endDateTime
        };
    } catch (error) {
        console.error('Error creating Google Meet session:', error);
        throw new Error('Failed to create Google Meet session: ' + error.message);
    }
};

/**
 * Fetch the Google Meet recording from Drive based on the streamKey (conferenceId)
 * @param {string} streamKey - The conferenceId of the Google Meet session
 * @returns {Promise<string>} URL of the recording file
 */
export const getMeetRecording = async (streamKey) => {
    try {
        if (!streamKey) {
            throw new Error('Stream key is required to fetch recording');
        }

        console.log(`Searching for recording with stream key: ${streamKey}`);
        
        // Find the "Meet Recordings" folder
        const folderResponse = await drive.files.list({
            q: "name = 'Meet Recordings' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
            fields: 'files(id, name)',
            spaces: 'drive'
        });
        
        const folders = folderResponse.data.files;
        let files = [];
        
        if (folders && folders.length > 0) {
            const meetRecordingsFolderId = folders[0].id;
            console.log(`Found Meet Recordings folder with ID: ${meetRecordingsFolderId}`);
            
            // Search within the Meet Recordings folder
            const response = await drive.files.list({
                q: `name contains '${streamKey}' and '${meetRecordingsFolderId}' in parents and trashed = false`,
                fields: 'files(id, name, webViewLink, webContentLink, parents)',
                spaces: 'drive',
            });
            
            files = response.data.files;
        }
        
        // If no files found in the specific folder, try a broader search
        if (!files || files.length === 0) {
            console.log(`No recordings found in Meet Recordings folder, trying broader search...`);
            const broadResponse = await drive.files.list({
                q: `name contains '${streamKey}' and trashed = false`,
                fields: 'files(id, name, webViewLink, webContentLink)',
                spaces: 'drive',
            });
            
            files = broadResponse.data.files;
        }
        
        if (!files || files.length === 0) {
            console.log('No recording found for the meeting');
            return null;
        }
        
        // Sort files by name (if there are multiple recordings, get the most recent one)
        const sortedFiles = files.sort((a, b) => b.name.localeCompare(a.name));
        const recordingFile = sortedFiles[0];
        console.log(`Found recording file: ${recordingFile.name} (ID: ${recordingFile.id})`);

        try {
            // Make the file accessible via direct link
            await drive.permissions.create({
                fileId: recordingFile.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
                supportsAllDrives: true,
            });

            console.log(`Updated permissions for file: ${recordingFile.id}`);

            // 🔹 **Update file settings to allow downloads**
            await drive.files.update({
                fileId: recordingFile.id,
                requestBody: {
                    viewersCanCopyContent: true,  // ✅ Allow viewers to copy/download
                    copyRequiresWriterPermission: false, // ✅ Remove download restriction
                },
                supportsAllDrives: true,
            });

            console.log(`Updated file settings for download access: ${recordingFile.id}`);

            // Get the updated file with the web content link (direct download link)
            const fileData = await drive.files.get({
                fileId: recordingFile.id,
                fields: 'webContentLink',
                supportsAllDrives: true,
            });

            return fileData.data.webContentLink; // Direct download link
        } catch (permError) {
            console.error('Permission update failed, returning existing link:', permError);
            // Return the existing direct download link even if permission update fails
            return recordingFile.webContentLink;
        }
    } catch (error) {
        console.error('Error fetching Google Meet recording:', error);
        throw new Error('Failed to fetch Google Meet recording: ' + error.message);
    }
};
