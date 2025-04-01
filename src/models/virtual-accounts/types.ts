import mongoose from "mongoose";

export interface IVirtualAccount {
    user_id: mongoose.Types.ObjectId;
    is_viewed: boolean;

    customer_id: number;
    customer_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;

    bank_name: string;
    bank_slug: string;
    bank_id: number;

    status: 'success' | 'failed';
    assigned: boolean;
    active: boolean;
    account_name: string;
    account_number: string;
    account_type: string;
    currency: string;
    created_at: string;
    
    expired: boolean;
    expired_at: string | null;
}