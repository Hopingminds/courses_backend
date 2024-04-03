import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
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
    name: { type: String},
    profile: { type: String},
    college: {type:String},
    degree: {type:String},
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
            completed_lessons: [{type: mongoose.Schema.Types.ObjectId, default: null}],
            completed_assignments: [{type: mongoose.Schema.Types.ObjectId, default: null}]
        }
    ],
    blocked_courses:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Courses'
        }
    ],
    role: {
        type: String,
        enum: ['user' , 'subadmin'],
        default: 'user'
    },
    token: {type: String, default: null}
});

export default mongoose.model.Users || mongoose.model('User', UserSchema);