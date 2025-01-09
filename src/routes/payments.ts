import express, { Request, Response } from 'express';
import { verifyTransactionSignature } from '../services/paystack';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

router.post('/virtual-account', async (req: Request, res: Response): Promise<any> => {
    const isValid = verifyTransactionSignature(req);
    if (!isValid) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid signature!' });
})