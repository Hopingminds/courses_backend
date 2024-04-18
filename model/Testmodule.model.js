import mongoose from "mongoose";

export const TestSchema = new mongoose.Schema({
    module_name: {type: String},
    module_description: {type: String},
    questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Qna',
        }
    ]
});

export default mongoose.model.Tests || mongoose.model('Test', TestSchema);