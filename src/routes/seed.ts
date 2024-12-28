import express, { Request, Response } from 'express';
import seed from '../utils/seed';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
    await seed();

    res.json({ message: 'Seed successful!' });
});

export default router;