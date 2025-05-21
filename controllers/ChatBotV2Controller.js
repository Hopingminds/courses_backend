import ChatBotModel from "../model/ChatBot.model.js";

/** POST: http://localhost:8080/api/createChatQuestion 
* @body : {
    "chatData"
}
*/
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

/** PUT: http://localhost:8080/api/updateaccess?chatId=670e46a245b4616f734534cf9e
body: { 
    "updatedChatData"
}
*/
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

/** GET: http://localhost:8080/api/getChatBotResponse
@query {
    dropOffQuestion = "Greeting"
}
 */
export async function getChatBotResponse(req, res) {
    try {
        const { quesionId, selectedOption } = req.query;

        let chatBotResponse;

        // Check if dropOffQuestion is "Greeting"
        if (selectedOption === "Greeting" && !quesionId) {
            chatBotResponse = await ChatBotModel.findOne({ dropByQuestion: selectedOption });
        } 
        else if( quesionId && selectedOption) {
            const chatBotcurrentQuestion = await ChatBotModel.findById(quesionId);
            const selectedOptionObj = chatBotcurrentQuestion.options.find(
                option => option.optTitle === selectedOption
            );

            if (selectedOptionObj) {
                // Get the optTitle from the selected option
                chatBotResponse = await ChatBotModel.findOne({ question: selectedOptionObj.dropOffQuestion });
            }
        }
        else if(!quesionId || !selectedOption) {
            return res.status(400).json({ success: false, message: "quesionId and selectedOption are required for chat, except for Greeting" });
        }

        if(!chatBotResponse){
            chatBotResponse = await ChatBotModel.findOne({ dropByQuestion: 'Error' });
        }
        
        return res.status(200).json({ success: true, chatBotResponse });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
}
