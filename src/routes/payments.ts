import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { waitUntil } from '@vercel/functions';

import { createVirtualAccount, DedicatedAccountCreationFailure, DedicatedAccountCreationSuccess, verifyTransactionSignature } from '../services/paystack';
import { PayStackEvents } from '../utils/constants';
import { User } from '../models/user/schema';
import { VirtualAccount } from '../models/virtual-accounts/schema';
import { generateUserSession } from '../controllers/user.controller';

import authUser from '../middleware/authUser';
import logger from '../startup/logger';

const router = express.Router();

router.post('/virtual-account', async (req: Request, res: Response): Promise<any> => {
    const isValid = verifyTransactionSignature(req);
    if (!isValid) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid signature!' });

    logger.info(req.body);
    
    switch (req.body.event) {
        case PayStackEvents.DAA_SUCCCESS:
            const successResponse: DedicatedAccountCreationSuccess = req.body;
            waitUntil(storeVirtualAccountDetails(successResponse));

            break;
        case PayStackEvents.DAA_FAILED:
            const failureResponse: DedicatedAccountCreationFailure = req.body;
            waitUntil(notifyUserOfFailure(failureResponse));

            break;
        default:
            break;
    }

    res.status(StatusCodes.OK).json({ message: 'Event processed successfully.' });
});

router.post('/account', [authUser], async (req: Request, res: Response): Promise<any> => {
    const result = await createVirtualAccount(req.user!);
    
    if (result.status) {
        const user = await User.findByIdAndUpdate(req.user!._id, {
            isVirtualAccountPending: true,
        }, { new: true });
    
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'An error occurred while setting up your virtual account' });
        }

        return res.status(StatusCodes.OK).json(generateUserSession(user));
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: result.message });
});

async function storeVirtualAccountDetails(response: DedicatedAccountCreationSuccess) {
    let user = await User.findOneAndUpdate({ 
        $or: [
            { email: response.data.customer.email },
            { phoneNumber: response.data.customer.phone },
        ],
    }, { isVirtualAccountPending: false });
    
    if (user) {
        await VirtualAccount.create({
            user_id: user._id,
            is_viewed: false,

            customer_id: response.data.customer.id,
            customer_code: response.data.customer.customer_code,
            first_name: response.data.customer.first_name,
            last_name: response.data.customer.last_name,
            email: response.data.customer.email,
            phone: response.data.customer.phone,
        
            bank_name: response.data.dedicated_account.bank.name,
            bank_slug: response.data.dedicated_account.bank.slug,
            bank_id: response.data.dedicated_account.bank.id,
            status: response.data.identification.status,
            assigned: response.data.dedicated_account.assigned,
            active: response.data.dedicated_account.active,
            account_name: response.data.dedicated_account.account_name,
            account_number: response.data.dedicated_account.account_number,
            account_type: response.data.dedicated_account.assignment.account_type,
            currency: response.data.dedicated_account.currency,
            created_at: response.data.dedicated_account.created_at,
            expired: response.data.dedicated_account.assignment.expired,
            expired_at: response.data.dedicated_account.assignment.expired_at,
        });
        
        await user.sendNotification({
            title: 'Virtual Account Created Successfully!',
            body: 'Your wallet has been successfully setup and your virtual account created successfully.'
        });
    } else {
        logger.log({
            level: 'error',
            message: 'No associated user account found',
            account: JSON.stringify(response),
        });
    }
}

async function notifyUserOfFailure(response: DedicatedAccountCreationFailure) {
    let user = await User.findOneAndUpdate({ 
        $or: [
            { email: response.data.customer.email },
            { phoneNumber: response.data.customer.phone },
        ],
    }, { isVirtualAccountPending: false });
    
    if (user) {
        await VirtualAccount.create({
            user_id: user._id,
            is_viewed: true,

            customer_id: response.data.customer.id,
            customer_code: response.data.customer.customer_code,
            first_name: response.data.customer.first_name,
            last_name: response.data.customer.last_name,
            email: response.data.customer.email,
            phone: response.data.customer.phone,
            status: response.data.identification.status,
        });

        await user.sendNotification({
            title: 'Virtual Account Not Created!',
            body: 'An error occured while creating your wallet. Please try again later.'
        });
    } else {
        logger.log({
            level: 'error',
            message: 'No associated user account found',
            account: JSON.stringify(response),
        });
    }
}

export default router;