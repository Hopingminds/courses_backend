import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
    password: {
        type: String,
        unique : false,
    },
    email: {
        type: String,
        unique: true,
    },
    phone: {
        type: Number,
        unique: true,
    },
    name: { type: String},
    profile: { type: String},
    college: {type:String},
    degree: {type:String},
    stream: {type:String},
    yearofpass: {type:Number},
    percentage: {type:Number},
    position: {type: String},
    address: {type:String},
    city: {type:String},
    state: {type:String},
    bio: {type: String},
    purchased_courses:[
        {
            course: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Courses'
            },
            courseStartDate: { type: Date },
            allotedByCollege: {type: Boolean, default: false},
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
    trainingInternships: [{
        companyName: {type: String},
        postName: {type: String},
        location: {type: String},
        duration:{
            from: {type: String},
            to: {type: String},
        }
    }],
    projects:[{
        projectName: {type: String},
        projectRole: {type: String},
        projectDescription: {type: String}
    }],
    certifications: [{
        certificateName: {type: String},
        certifiedBy: {type: String},
    }],
    skills: [{
        skill: {type: String},
        skill_lever: {type: Number, min: 0, max: 10}
    }],
    role: {
        type: String,
        enum: ['user' , 'subadmin'],
        default: 'user'
    },
    profileLinks:{
        hackerRank: {type: String},
        github: {type: String},
        linkedIn: {type: String},
        codeChef: {type: String},
        leetCode: {type: String},
        geekForGeeks: {type: String},
    },
    isCourseOpened: {type: Boolean, default: false},
    isProfileComplete: {type: Boolean, default: false},
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    token: {type: String, default: null}
});

export default mongoose.model.Users || mongoose.model('User', UserSchema);