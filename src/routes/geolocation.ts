import express, { Request, Response } from 'express';
import _ from 'lodash';

import { z } from 'zod';

import authUser from '../middleware/authUser';
import validateWith from '../middleware/validateWith';

import { Driver, User } from '../models/user/schema';
import { availableNearbyRidersSchema, ICoordinates, localNearbyRidersSchema, locationCoordinatesSchema } from '../models/user/types';
import { LocationType, ServiceCode } from '../utils/constants';
import { geocodeLocations, getDistanceBetweenCoords } from '../services/google';
import { parseObjectId } from '../utils/lib';
import { StatusCodes } from 'http-status-codes';

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

router.post('/available-riders', [validateWith(availableNearbyRidersSchema)], async (req: Request, res: Response) => {
    let filters = { 
        "driverDetails.service.code": ServiceCode.LOCAL ,
        "driverDetails.profile": { $exists: true },
        "driverDetails.profile.localRidePersonalInformation": { 
            $exists: true,
            ...(req.body.rideType && { localRideType: parseObjectId(req.body.rideType) }),
        },
        "driverDetails.profile.routeDetails": { 
            $exists: true, 
            $not: { $size: 0 },
        },
    };

    let projection = {
        price: { $ifNull: ['$profile.routeDetails.price', 0] },
        profileDisplayImage: '$driverDetails.profile.localRidePersonalInformation.profilePhotoUrl',
    };

    let [availableRiders, popularLocations] = await Promise.all([
        getLocalRidersWithinLocation(req.body, filters, projection), 
        getPopularLocations(req.body.rideType),
    ]);
    
    res.json({ availableRiders, popularLocations });
});

router.post('/local-trips/location', [validateWith(localNearbyRidersSchema)], async (req: Request, res: Response): Promise<any> => {
    const result = await geocodeLocations([req.body.route]);

    if (!result || result.status !== 'OK') {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'An unexpected error occured!' });
    }

    req.body.latitude = result.results[0].geometry.location.lat;
    req.body.longitude = result.results[0].geometry.location.lng;

    let filters = { 
        "driverDetails.service.code": ServiceCode.LOCAL ,
        "driverDetails.profile": { $exists: true },
        "driverDetails.profile.localRidePersonalInformation": { 
            $exists: true,
            ...(req.body.rideType && { localRideType: parseObjectId(req.body.rideType) }),
        },
        "driverDetails.profile.routeDetails": { 
            $exists: true, 
            $not: { $size: 0 },
            $elemMatch: { route: req.body.route },
        },
    };

    let projection = {
        price: { $ifNull: ['$profile.routeDetails.price', 0] },
        profileDisplayImage: '$driverDetails.profile.localRidePersonalInformation.profilePhotoUrl',
    };

    let [ridersInLocation, routeLocations] = await Promise.all([
        getLocalRidersWithinLocation(req.body, filters, projection), 
        getLocalRideRoutes(req.body.route),
    ]);
    
    res.json({ ridersInLocation, routeLocations });
});

export const getDriversWithinLocation = async (params: ICoordinates, filters: Record<string, any>, projection: Projection) => {
    let availableDrivers = await User.aggregate([
        {
            $geoNear: {
                near: { 
                    type: LocationType.POINT, 
                    coordinates: [params.longitude, params.latitude] 
                },
                maxDistance: 5_000,
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
                rating: "$rating",
                serviceDisplayImage: '$driverDetails.service.image',
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

export const getLocalRidersWithinLocation = async (params: ICoordinates, filters: Record<string, any>, projection: Projection) => {
    let availableDrivers = await User.aggregate([
        {
            $geoNear: {
                near: { 
                    type: LocationType.POINT, 
                    coordinates: [params.longitude, params.latitude] 
                },
                maxDistance: 5_000_000,
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
                from: "localridetypes",
                localField: "driverDetails.profile.localRidePersonalInformation.localRideType",
                foreignField: "_id",
                as: "driverDetails.profile.localRidePersonalInformation.localRideType",
                pipeline: [
                    { 
                        $project: {
                            _id: 1,
                            name: 1,
                        } 
                    }
                ]
            }
        },
        { $unwind: "$driverDetails.profile.localRidePersonalInformation.localRideType" },
        {
            $lookup: {
                from: "rides",
                localField: "driverDetails._id",
                foreignField: "_id",
                as: "driverRides",
            }
        },
        {
            $addFields: {
              rideCount: { $size: "$driverRides" }
            }
        },
        {
            $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "userId",
                as: "driverReviews",
            }
        },
        {
            $addFields: {
                contactCount: 0,
                reviewCount: { $size: "$driverReviews" }
            }
        },
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
                rating: "$rating",
                serviceDisplayImage: '$driverDetails.service.image',
                price: projection.price,
                profileDisplayImage: projection.profileDisplayImage,
                coordinates: {
                    longitude: { $arrayElemAt: ["$location.coordinates", 0] },
                    latitude: { $arrayElemAt: ["$location.coordinates", 1] },
                    distance: "$location.distance",
                },
                contactCount: 1,
                phoneNumber: "$phoneNumber",
                rideType: "$driverDetails.profile.localRidePersonalInformation.localRideType",
                rideCount: 1,
                reviewCount: 1,
                routes: "$driverDetails.profile.routeDetails",
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

export const getPopularLocations = async (rideType?: string) => {
    const result = await Driver.aggregate([
        { 
            $match: {
                "profile.routeDetails": { $exists: true, $not: { $size: 0 } },
                ...(rideType && {
                    "profile.localRidePersonalInformation": { 
                        $exists: true,
                        localRideType: parseObjectId(rideType),
                    }
                }),
            }
        },
        {
          $unwind: '$profile.routeDetails',
        },
        {
          $group: {
            _id: '$profile.routeDetails.route', 
            views: { $sum: '$profile.routeDetails.views' },
            price: { $min: '$profile.routeDetails.price' },
          },
        },
        {
          $sort: { views: -1 },
        },
        {
          $project: {
            _id: 0, 
            route: '$_id',
            views: 1,
            price: 1,
          },
        },
    ]);

    console.log(result);

    return result;
};

export const getLocalRideRoutes = async (route: string) => {
    const result = await Driver.aggregate([
        { 
            $match: {
                "profile.routeDetails": { $exists: true, $not: { $size: 0 }, $elemMatch: { route } },
            }
        },
        {
          $unwind: '$profile.routeDetails',
        },
        {
            $replaceRoot: {
              newRoot: "$profile.routeDetails",
            }
        }
    ]);

    return result;
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