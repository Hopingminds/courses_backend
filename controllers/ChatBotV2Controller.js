import ChatBotModel from "../model/ChatBot.model.js";

export async function createChatQuestion(req, res) {
    try {
        const chatData = req.body;
        const ChatBotData = new ChatBotModel(chatData); // Changed variable name

        await ChatBotData.save();

        return res.status(201).json({ success: true, message: "ChatBot data created successfully", ChatBotData });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

export async function editChatQuestion(req, res) {
    try {
        const { chatId } = req.query; // Get chat question ID from URL params
        const updatedChatData = req.body; // New data for the chat question

        // Find and update the chat question by its ID
        const updatedChat = await ChatBotModel.findByIdAndUpdate(
            chatId,
            updatedChatData,
            { new: true, runValidators: true } // Return the updated document and validate the data
        );

        if (!updatedChat) {
            return res.status(404).json({ success: false, message: "Chat question not found" });
        }

        return res.status(200).json({ success: true, message: "ChatBot data updated successfully", updatedChat });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}

export async function getChatBotResponse(req, res) {
    try {
        const { dropOffQuestion } = req.query;
        if(!dropOffQuestion){
            return res.status(400).json({ success: false, message: "dropOffQuestion is required" });
        }
        const chatBotResponse = await ChatBotModel.findOne({ question: dropOffQuestion });

        if(!chatBotResponse){
            return res.status(404).json({ success: false, message: "ChatBot response not found" });
        }
        
        return res.status(200).json({ success: true, chatBotResponse });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}
