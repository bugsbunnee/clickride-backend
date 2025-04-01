import mongoose from "mongoose";
import { IVirtualAccount } from "./types";

const VirtualAccountSchema = new mongoose.Schema<IVirtualAccount>({
    user_id: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    is_viewed: { type: Boolean, required: false, default: false },
    
    customer_id: { type: Number, min: 1, required: true },
    customer_code: { type: String, required: true, },
    first_name: { type: String, required: true, },
    last_name: { type: String, required: true, },
    email: { type: String, required: true, },
    phone: { type: String, required: true, },

    bank_name: { type: String, required: true, },
    bank_slug: { type: String, required: true, },
    bank_id: { type: Number, min: 1, required: true },

    status: { type: String, required: true, },
    assigned: { type: Boolean, required: true, },
    active: { type: Boolean, required: true, },
    account_name: { type: String, required: true, },
    account_number: { type: String, required: true, },
    account_type: { type: String, required: true, },
    currency: { type: String, required: true, },
    created_at: { type: String, required: true, },
    
    expired: { type: Boolean, required: true, },
    expired_at: { type: String, required: false, default: null },
});

export const VirtualAccount = mongoose.model<IVirtualAccount>('VirtualAccount', VirtualAccountSchema);


