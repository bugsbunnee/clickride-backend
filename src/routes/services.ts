import express, { Request, Response } from 'express';
import { Service } from '../models/services/schema';

const router = express.Router();

router.get('/driver', async (req: Request, res: Response) => {
    let services = await Service.find();
    
    // @ts-ignore
    services = services.map((service) => ({
        value: service._id,
        label: service.driver,
        image: service.image,
    }));

    res.json(services);
});

router.get('/user', async (req: Request, res: Response) => {
    let services = await Service.find();
    res.json(services);
});

export default router;
