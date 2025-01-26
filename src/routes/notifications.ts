import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Notification } from '../models/notifications/schema';

import authUser from '../middleware/authUser';
import validateObjectId from '../middleware/validateObjectId';

const router = express.Router();

router.get('/', [authUser], async (req: Request, res: Response) => {
    const notifications = await Notification.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    const hasUnread = notifications.some((notification) => !notification.isRead);

    res.json({ hasUnread, list: notifications });
});

router.patch('/:id', [authUser, validateObjectId], async (req: Request, res: Response): Promise<any> => {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user!._id }, {
        isRead: true,
    });

    if (!notification) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid notification provided' });
    }

    res.json({ message: 'Updated successfully!' });
});

export default router;