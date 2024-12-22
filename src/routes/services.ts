import express, { Request, Response } from 'express';
import { services } from '../utils/data';

const router = express.Router();

router.get('/driver', async (req: Request, res: Response) => {
    res.json(services);
});

export default router;