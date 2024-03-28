import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
    username : {
        type: String
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        unique : false,
    },
    email: {
        type: String,
        required : [true, "Please provide a unique email"],
        unique: true,
    },
    phone: {
        type: Number,
    },
    firstName: { type: String},
    lastName: { type: String},
    profile: { type: String},
    college: {type:String},
    stream: {type:String},
    yearofpass: {type:Number},
    position: {type: String},
    bio: {type: String},
    purchased_courses:[
        {
            course: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Courses'
            },
            completed_lessons: [{type: mongoose.Schema.Types.ObjectId, default: null}]
        }
    ],
    assignments: [
        {
            date: {type: Date},
            subject: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Courses'
            },
            deadline: {type: Date},
            submitted: {type:  Boolean, default: false}
        }
    ],
    role: {
        type: String,
        enum: ['user' , 'subadmin'],
        default: 'user'
    }
});

export default mongoose.model.Users || mongoose.model('User', UserSchema);