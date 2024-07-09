import mongoose from "mongoose";

export const OrdersSchema = new mongoose.Schema({
    paymentStauts: {
        status: { 
            type: String,
            enum: ["success", "failed"]
        },
        message: {
            type: String
        }
    },
    
    purchasedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: { type: String },
    address: { type: String },
    zip:{ type: Number },
    country: { type: String },
    state: { type: String },
    gstNumber: {type:  String},
    payemntData: {type: Object},
    courses: {type: Object},
    transactionAmount: {type: Number},
    basePrice: {type: Number},
    discountedAmount: {type: Number},
    gstAmount: {type: Number},
},{ timestamps: true });

export default mongoose.model.Orders || mongoose.model('Order', OrdersSchema);