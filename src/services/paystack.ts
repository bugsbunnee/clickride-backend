import axios from "axios";
import crypto from "crypto";

import { IUser } from "../models/user/types";
import { Request } from "express";

enum Providers {
    WEMA = 'wema-bank',
    ACCESS = 'access-bank',
    TEST = 'test-bank'
}

enum Country {
    NIGERIA = 'NG',
}

interface AccountDetails {
    account_number: string;
    bvn: string;
    bank_code: string;
}

interface VirtualAccountProviders {
    status: boolean;
    message: string;
    data: {
        provider_slug: string;
        bank_id: number;
        bank_name: string;
        id: number;
    }[]
}

interface AccountCreationResponse {
    status: boolean;
    message: string;
    data: {
        bank: {
          name: string;
          id: number;
          slug: string;
        },
        account_name: string;
        account_number: string;
        assigned: boolean;
        currency: string;
        metadata: null,
        active: boolean;
        id: number;
        created_at: string;
        updated_at: string;
        assignment: {
          integration: number;
          assignee_id: number;
          assignee_type: string;
          expired: false,
          account_type: string;
          assigned_at: string;
        },
        customer: {
          id: number;
          first_name: string;
          last_name: string;
          email: string;
          customer_code: string;
          phone: string;
          risk_action: string;
        }
    }
}

interface CustomerCreationResponse {
    status: boolean;
    message: string;
    data: {
        email:  string;
        integration:  number;
        domain:  string;
        customer_code:  string;
        id:  number;
        identified:  boolean;
        createdAt:  string;
        updatedAt:  string;
    }
}

export const createCustomer = async (user: IUser) => {
    const config = {
        headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
    };

    const data = {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phoneNumber,
        email: user.email,
    };

    try {
        const endpoint = process.env.PAYSTACK_API_URL + '/customer';
        const response = await axios.post<CustomerCreationResponse>(endpoint, data, config);

        return response.data;
    } catch (error) {
        
    }
};

export const createVirtualAccount = async (user: IUser) => {
    const config = {
        headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
    };

    const data = {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phoneNumber,
        email: user.email,
        country: Country.NIGERIA,
        preferred_bank: Providers.TEST,
    };

    try {
        const endpoint = process.env.PAYSTACK_API_URL + '/dedicated_account/assign';
        const response = await axios.post<AccountCreationResponse>(endpoint, data, config);
        
        return response.data;
    } catch (error) {
        return null;
    }
};

export const createAndAssignVirtualAccount = async (user: IUser & AccountDetails) => {
    const config = {
        headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
    };

    const data = {
        first_name: user.firstName,
        last_name: user.lastName,
        phone: user.phoneNumber,
        email: user.email,
        country: Country.NIGERIA,
        preferred_bank: Providers.TEST,
        account_number: user.account_number,
        bvn: user.bvn,
        bank_code: user.bank_code,
    };

    try {
        const endpoint = process.env.PAYSTACK_API_URL + '/dedicated_account/assign';
        const response = await axios.post<AccountCreationResponse>(endpoint, data, config);
        
        return response.data;
    } catch (error) {
        return null;
    }
};

export const getVirtualAccountProviders = async () => {
    const config = {
        headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
    };

    try {
        const response = await axios.get<VirtualAccountProviders>('/dedicated_account/available_providers', config);
        return response.data.data;
    } catch (error) {
        return [];
    }
};

export const verifyTransactionSignature = (request: Request) => {
    const secret = process.env.PAYSTACK_SECRET_KEY as string;
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(request.body)).digest('hex');

    return hash === request.headers['x-paystack-signature'];
};