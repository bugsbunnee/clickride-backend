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
    status: { type: String, required: true, },

    bank_name: { type: String, required: false, },
    bank_slug: { type: String, required: false, },
    bank_id: { type: Number, min: 1, required: false },
    assigned: { type: Boolean, required: false, },
    active: { type: Boolean, required: false, },
    account_name: { type: String, required: false, },
    account_number: { type: String, required: false, },
    account_type: { type: String, required: false, },
    currency: { type: String, required: false, },
    created_at: { type: String, required: false, },
    expired: { type: Boolean, required: false, },
    expired_at: { type: String, required: false, default: null },
});

export const VirtualAccount = mongoose.model<IVirtualAccount>('VirtualAccount', VirtualAccountSchema);


