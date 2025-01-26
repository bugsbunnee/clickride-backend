import express, { Request, Response } from 'express';
import validateWith from '../middleware/validateWith';
import logger from '../startup/logger';

import { rsvpSchema } from '../models/rsvp/types';
import { sendEmail } from '../services/email';
import { RSVP } from '../models/rsvp/schema';

import RSVPEmail from '../emails/rsvp';

const router = express.Router();

router.post('/', validateWith(rsvpSchema), async (req: Request, res: Response) => {
    const rsvp = await RSVP.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        attending: req.body.attending,
        favoriteDanceMove: req.body.favoriteDanceMove,
        storyName: req.body.storyName,
        marriageAdvice: req.body.marriageAdvice,
        hashtag: req.body.hashtag,
        figure: req.body.figure,
        favoriteMemory: req.body.favoriteMemory,
    });
    
    try {
        await sendEmail({
            to: 'vm.chukwuma@gmail.com',
            text: 'New RSVP',
            subject: 'New RSVP',
            react: RSVPEmail(rsvp),
        });
    } catch (error) {
        logger.error(error);
    }

    res.json({ message: 'Success!' });
});

export default router;