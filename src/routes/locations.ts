import express, { Request, Response } from 'express';
import { getStatesInCountry } from '../services/countries';

const router = express.Router();

router.get('/states', async (req: Request, res: Response) => {
    const states = await getStatesInCountry('Nigeria');
    res.json(states);
});

export default router;