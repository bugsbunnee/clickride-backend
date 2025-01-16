import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import authUser from '../middleware/authUser';
import admin from '../middleware/admin';
import validateWith from '../middleware/validateWith';

import { LocalRideType } from '../models/local-ride-type/schema';
import { localRideTypeSchema } from '../models/local-ride-type/types';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
    let localRideTypes = await LocalRideType.find();

    // @ts-ignore
    localRideTypes = localRideTypes.map((localRideType) => ({
        label: localRideType.name,
        value: localRideType._id,
    }));

    res.json(localRideTypes);
});

router.post('/', [authUser, admin, validateWith(localRideTypeSchema)], async (req: Request, res: Response) => {
    const localRideType = await LocalRideType.create({
        name: req.body.name,
    });

    res.status(StatusCodes.CREATED).json(localRideType);
});

export default router;