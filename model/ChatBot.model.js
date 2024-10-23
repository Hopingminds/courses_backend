import mongoose from "mongoose";

export const ChatBotSchema = new mongoose.Schema({
    dropByQuestion:{
        type: String,
    },
    question: {
        type: String,
        required: [true, "Please provide question"],
    },
    type:{
        type: String,
        enum: ["option", "statement"],
        required: [true, "Please type of chat"],
    },
    options: [{
        optTitle: {
            type: String,
            required: [true, "Please provide options.opt_title"],
        },
        dropOffQuestion: {
            type: String,
        },
        hasNextQuestion: {
            type: Boolean,
            required: [true, "Please provide options.hasNextQuestion"],
            default: true
        },
        isOptionAUrl:{
            type:Boolean,
            default: false
        },
        OptionUrl: {
            type: String
        },
        openInNewWindow:{
            type: Boolean,
            default: false
        },
    }],
    takeResponse:{
        type:Boolean,
        default: false
    },
    response:{
        type:String
    },
}, { timestamps: true });

export default mongoose.model.ChatBots || mongoose.model('ChatBot', ChatBotSchema);