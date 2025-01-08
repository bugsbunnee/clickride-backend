import express, { Request, Response } from 'express';
import _ from 'lodash';

import { z } from 'zod';

import authUser from '../middleware/authUser';
import validateWith from '../middleware/validateWith';

import { User } from '../models/user/schema';
import { ICoordinates, locationCoordinatesSchema } from '../models/user/types';
import { LocationType, ServiceCode } from '../utils/constants';
import { getDistanceBetweenCoords } from '../services/google';

const router = express.Router();

interface Projection {
    price: any;
    profileDisplayImage: string;
}

const tripPreparationSchema = z.object({
    from: locationCoordinatesSchema,
    to: locationCoordinatesSchema,
});

router.post('/nearby-riders', [authUser, validateWith(locationCoordinatesSchema)], async (req: Request, res: Response): Promise<any> => {
    let filters = {
        'driverDetails.profile': { $exists: true },
        'driverDetails.profile.carPersonalInformation': { $exists: true },
    };

    let projections: Projection = {
        profileDisplayImage: '$driverDetails.profile.vehicleDocuments.display',
        price: {
            $ifNull: [
                '$driverDetails.profile.routeDetails.price',
                { 
                    $arrayElemAt: [
                        { $sortArray: { input: "$driverDetails.profile.tripDetails", sortBy: { price: 1 } } },
                        0
                    ]
                },
                0
            ]
        },
    };
    
    const drivers = await getDriversWithinLocation(req.body, filters, projections);

    return res.json(drivers);
});

router.post('/trip-preparation', [authUser, validateWith(tripPreparationSchema)], async (req: Request, res: Response): Promise<any> => {
    let drivers = await getDriversForTrip({
        latitude: req.body.from.latitude,
        longitude: req.body.from.longitude,
    });

    res.json(drivers);
});

router.post('/available-riders', [validateWith(locationCoordinatesSchema)], async (req: Request, res: Response) => {
    let filters = { 
        "driverDetails.service.code": ServiceCode.LOCAL ,
        "driverDetails.profile": { $exists: true },
        "driverDetails.profile.routeDetails": { $exists: true, $not: { $size: 0 } },
    };

    let projection = {
        price: { $ifNull: ['$profile.routeDetails.price', 0] },
        profileDisplayImage: '$driverDetails.profile.profilePhotoUrl',
    };

    let availableRiders = await getDriversWithinLocation(req.body, filters, projection);

    res.json(availableRiders);
});

export const getDriversWithinLocation = async (params: ICoordinates, filters: Record<string, any>, projection: Projection) => {
    let availableDrivers = await User.aggregate([
        {
            $geoNear: {
                near: { 
                    type: LocationType.POINT, 
                    coordinates: [params.longitude, params.latitude] 
                },
                maxDistance: 5000,
                distanceMultiplier: 0.001,
                distanceField: "location.distance",
                spherical: true,
            }
        },
        {
            $lookup: {
                from: "drivers", 
                localField: "_id",
                foreignField: "user",
                as: "driverDetails",
            },
        },
        { $unwind: "$driverDetails" },
        {
            $lookup: {
                from: "services", 
                localField: "driverDetails.service", 
                foreignField: "_id",
                as: "driverDetails.service",
            },
        },
        { $unwind: { path: "$driverDetails.service" } },
        { $match: filters },
        { $sort: { 'location.distance': -1 } },
        { $limit: 10 },
        {
            $project: { 
                _id: "$driverDetails._id",
                firstName: "$firstName",
                lastName: "$lastName",
                serviceDisplayImage: '$driverDetails.service.image',
                rating: '$driverDetails.rating',
                price: projection.price,
                profileDisplayImage: projection.profileDisplayImage,
                coordinates: {
                    longitude: { $arrayElemAt: ["$location.coordinates", 0] },
                    latitude: { $arrayElemAt: ["$location.coordinates", 1] },
                    distance: "$location.distance",
                },
            },
        }
    ]);

    return availableDrivers;
};

export const getDriverTimeToLocation = async (from: ICoordinates | string, to: ICoordinates | string) => {
    const details = {
        timeToLocationText: '',
        distanceToLocation: '',
        timeToLocationInSeconds: 0,
    };

    const result = await getDistanceBetweenCoords({ origins: [from], destinations: [to] });
    if (result) {
        const [element] = result.rows.map((row) => _.minBy(row.elements, (element) => element.duration.value));
        if (element) {
            details.timeToLocationText = element.duration.text;
            details.distanceToLocation = element.distance.text;
            details.timeToLocationInSeconds = element.duration.value;
        }
    }

    return details;
};

export const getDriversForTrip = async (params: ICoordinates) => {
    let coords = _.pick(params, ['longitude', 'latitude']);

    let filters = {
        'driverDetails.profile': { $exists: true },
        'driverDetails.profile.carPersonalInformation': { $exists: true },
    };

    let projections: Projection = {
        profileDisplayImage: '$driverDetails.profile.vehicleDocuments.display',
        price: {
            $ifNull: [
                '$driverDetails.profile.routeDetails.price',
                { 
                    $arrayElemAt: [
                        { $sortArray: { input: "$driverDetails.profile.tripDetails", sortBy: { price: 1 } } },
                        0
                    ]
                },
                0
            ]
        },
    };

    let drivers = await getDriversWithinLocation(params, filters, projections);

    let driversWithDistance = drivers.map(async (driver) => {
        const driverDetails = { ...driver };
        const results = await getDriverTimeToLocation(driver.coordinates, coords);

        driverDetails.timeToLocation = results.timeToLocationText;
        driverDetails.distanceToLocation = results.distanceToLocation;

        return driverDetails;
    });

    drivers = await Promise.all(driversWithDistance);

    return drivers;
};

export default router;