import express, { Request, Response } from 'express';
import { z } from 'zod';
import { getCitiesInState, getStatesInCountry } from '../services/countries';

import validateWith from '../middleware/validateWith';

const router = express.Router();
const country = 'Nigeria';

const schema = z.object({
    state: z.string(),
});

router.get('/states', async (req: Request, res: Response) => {
    const states = await getStatesInCountry(country);
    res.json(states);
});

router.post('/cities', validateWith(schema), async (req: Request, res: Response) => {
    const states = await getCitiesInState({ state: req.body.state, country });
    res.json(states);
});

export default router;