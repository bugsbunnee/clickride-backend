import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { createCanvas } from 'canvas';
import { z } from 'zod';

import JsBarcode from 'jsbarcode';
import moment from 'moment';
import mongoose from 'mongoose';
import _ from 'lodash';

import authUser from '../middleware/authUser';
import validateWith from '../middleware/validateWith';

import { rideSchema } from '../models/ride/types';
import { Ride } from '../models/ride/schema';
import { Driver, User } from '../models/user/schema';

import { getObjectIdIsValid, parseObjectId } from '../utils/lib';
import { LocationType, PaymentStatus, RideStatus, ServiceCode } from '../utils/constants';
import { RiderForMap } from '../utils/models';

import { getDriverTimeToLocation } from './geolocation';
import { Service } from '../models/services/schema';
import { geocodeLocations } from '../services/google';
import { sendSingleNotification } from '../services/notifications';
import validateObjectId from '../middleware/validateObjectId';

const router = express.Router();

const busTripSchema = z.object({
    origin: z.string(),
    originCity: z.string(),
    destination: z.string(),
    destinationCity: z.string(),
    departureDate: z.string().date(),
    returnDate: z.string().date().optional(),
    numberOfSeats: z.number().positive(),
});

const busBookingSchema = z.object({
    ticketId: z.string().refine((value) => getObjectIdIsValid(value), 'Invalid ticket id'),
    seatNumbers: z.array(z.number().positive()).min(1, 'Please provide at least 1 seat'),
    departureDate: z.string().date(),
    departureTime: z.string().time(),
});

router.post('/car', [authUser, validateWith(rideSchema)], async (req: Request, res: Response): Promise<any> => {
    const results = await Driver.aggregate([
        { 
            $match: { 
                _id: parseObjectId(req.body.driver),
                profile: { $exists: true },
            }
        },
        {
            $lookup: {
                from: 'services',
                localField: 'service',
                foreignField: '_id',
                as: 'service'
            },
        },
        {
            $unwind: '$service',
        },
        { 
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user'
            },
        },
        { $unwind: '$user' },
        { 
            $project: {
                _id: "$_id",
                firstName: "$user.firstName",
                lastName: "$user.lastName",
                profileDisplayImage: {
                    $ifNull: [
                        '$profile.vehicleDocuments.display',
                        '$profile.busPersonalInformation.companyLogo',
                        '$profile.profilePhotoUrl'
                    ]
                },
                coordinates: {
                    longitude: { $arrayElemAt: ["$user.location.coordinates", 0] },
                    latitude: { $arrayElemAt: ["$user.location.coordinates", 1] },
                },
                serviceDisplayImage: '$service.image',
                rating: '$rating',
                price: {
                    $ifNull: [
                        '$profile.routeDetails.price',
                        { 
                            $arrayElemAt: [
                                { $sortArray: { input: "$profile.tripDetails", sortBy: { price: 1 } } },
                                0
                            ]
                        },
                        0
                    ]
                },
            }
        }
    ]);

    if (results.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Driver does not exist!' });
    }

    const driver: RiderForMap = results[0];
    const ride = await Ride.create({
        driver: driver._id,
        user: req.user!._id,
        from: req.body.from,
        to: req.body!.to,
        paymentStatus: PaymentStatus.PENDING,
        rideStatus: RideStatus.PENDING,
        departureDate: moment().toDate(),
        price: driver.price,
    });

    if (req.user!.deviceToken) {
        await sendSingleNotification({
            to: req.user!.deviceToken,
            title: 'Ride booked successfully!',
            body: 'Your car ride was booked successfully!',
        });
    }

    res.status(StatusCodes.CREATED).json(ride);
});

router.get('/track/:id', [authUser, validateObjectId], async (req: Request, res: Response): Promise<any> => {
    console.log(req.params)
    let results = await Ride.aggregate([
        { 
            $match: {
                user: parseObjectId(req.user!._id.toString()), 
                _id: parseObjectId(req.params.id),
            }
        },
        {
            $lookup: {
                from: 'drivers',
                localField: 'driver',
                foreignField: '_id',
                as: 'driver'
            }
        }, 
        {
            $unwind: '$driver'
        },
        {
            $lookup: {
                from: 'services',
                localField: 'driver.service',
                foreignField: '_id',
                as: 'driver.service'
            }
        }, 
        {
            $unwind: '$driver.service'
        },
        {
            $lookup: {
                from: 'users',
                localField: 'driver.user',
                foreignField: '_id',
                as: 'driver.user'
            }
        }, 
        {
            $unwind: '$driver.user'
        },
        {
            $project: {
                _id: "$_id",
                from: '$from',
                to: '$to',
                service: '$driver.service',
                driver: {
                    firstName: '$driver.user.firstName',
                    lastName: '$driver.user.lastName',
                    profilePhoto: {
                        $ifNull: [
                            '$driver.profile.vehicleDocuments.display',
                            '$driver.profile.busPersonalInformation.companyLogo',
                            '$driver.profile.profilePhotoUrl'
                        ]
                    },
                    coordinates: {
                        longitude: { $arrayElemAt: ["$driver.user.location.coordinates", 0] },
                        latitude: { $arrayElemAt: ["$driver.user.location.coordinates", 1] },
                    },
                }
            }
        }
    ]);

    if (results.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'The given ride was not found!' });
    }

    let ride = results[0];
    let timeToLocation = await getDriverTimeToLocation(ride.driver.coordinates, ride.from);

    res.json(_.merge(ride, timeToLocation));
});

router.post('/bus', [authUser, validateWith(busBookingSchema)], async (req: Request, res: Response): Promise<any> => {
    const ticketId = parseObjectId(req.body.ticketId);
    const bookedSeats = await getBookedSeatsInBusTrip(ticketId);

    const validation = checkUniqueSeatsInBusTripBooking(req.body.seatNumbers, bookedSeats);
    if (!validation.status) return res.status(StatusCodes.BAD_REQUEST).json({ message: validation.message });

    const bookingDetails = await getBusTripDetailsForBooking(ticketId, req.body, bookedSeats);
    if (!bookingDetails.status) return res.status(StatusCodes.BAD_REQUEST).json({ message: bookingDetails.message });

    const booking = bookingDetails.tripDetails.tripDetails;
    const price = booking.isRoundTrip ? booking.price / 2 : booking.price;

    const ride = await Ride.create({
        driver: booking._id,
        user: req.user!._id,
        from: {
            address: `${booking.originCity}, ${booking.origin}`,
            latitude: 0,
            longitude: 0,
        },
        to: {
            address: `${booking.destinationCity}, ${booking.destination}`,
            latitude: 0,
            longitude: 0,
        },
        seatNumbers: req.body.seatNumbers,
        paymentStatus: PaymentStatus.PENDING,
        rideStatus: RideStatus.PENDING, // @ts-ignore
        busTripId: booking._id,
        departureDate: moment(req.body.departureDate + ' ' + req.body.departureTime).toDate(),
        price: price * req.body.seatNumbers.length
    });
    
    if (req.user!.deviceToken) {
        await sendSingleNotification({
            to: req.user!.deviceToken,
            title: 'Trip booked successfully!',
            body: 'Your bus trip was booked successfully!',
        });
    }

    res.status(StatusCodes.CREATED).json(ride);
});

router.get('/me', [authUser], async (req: Request, res: Response): Promise<any> => {
    const rides = await Ride.aggregate([
        { $match: { user: parseObjectId(req.user!._id.toString()) } },
        { 
            $lookup: {
                from: 'drivers',
                localField: 'driver',
                foreignField: '_id',
                as: 'driver'
            },
        },
        {
            $unwind: '$driver'
        },
        { 
            $lookup: {
                from: 'users',
                localField: 'driver.user',
                foreignField: '_id',
                as: 'driver.user'
            },
        },
        {
            $unwind: '$driver.user'
        },
        { 
            $lookup: {
                from: 'services',
                localField: 'driver.service',
                foreignField: '_id',
                as: 'driver.service'
            },
        },
        {
            $unwind: '$driver.service'
        },
        {
            $project: {
                _id: '$_id',
                driver: {
                    firstName: '$driver.user.firstName',
                    serviceCode: '$driver.service.code'
                },
                from: '$from',
                to: '$to',
                rideStatus: '$rideStatus',
                paymentStatus: '$paymentStatus',
                price: '$price',
                createdAt: '$createdAt',
            }
        },
        { $sort: { createdAt: -1 }}
    ]);

    res.json(rides);
});

router.get('/bus/locations', async (req: Request, res: Response): Promise<any> => {
    let busService = await Service.findOne({ code: ServiceCode.BUS });
    if (!busService) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Something failed!' });

    let originPromise = Driver.aggregate([
        { $match: { service: busService._id, profile: { $exists: true } }},
        { $unwind: "$profile.tripDetails" },
        {
            $group: {
              _id: {
                origin: "$profile.tripDetails.origin",
                originCity: "$profile.tripDetails.originCity"
              }, 
            }
        },
        {
            $project: {
              _id: 0,
              label: {
                $concat: ["$_id.origin", " -- ", "$_id.originCity"]
              },
              value: "$_id.originCity"
            }
        }
    ]);
    
    let destinationPromise = Driver.aggregate([
        { $match: { service: busService._id, profile: { $exists: true } }},
        { $unwind: "$profile.tripDetails" },
        {
            $group: {
              _id: {
                destination: "$profile.tripDetails.destination",
                destinationCity: "$profile.tripDetails.destinationCity"
              }, 
            }
        },
        {
            $project: {
              _id: 0,
              label: { $concat: ["$_id.destination", " -- ", "$_id.destinationCity"] },
              value: "$_id.destinationCity"
            }
        },
        {
            $sort: { label: 1 }
        }
    ]);

    const [origins, destinations] = await Promise.all([originPromise, destinationPromise]);

    res.json({ origins, destinations });
});

router.get('/bus/tickets', async (req: Request, res: Response): Promise<any> => {
    let filters = { profile: { $exists: true }, 'profile.tripDetails': { $exists: true } };
    let tickets = await getAvailableBusTickets(filters);

    res.json(tickets);
});

router.post('/bus/tickets/query', [validateWith(busTripSchema)], async (req: Request, res: Response): Promise<any> => {
    const filters = getFiltersForTicketQuery(req.body);
    const tickets = await getAvailableBusTickets(filters);

    if (tickets.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'No available tickets!' });
    }

    res.json(tickets);
});

const getBookedSeatsInBusTrip = async (tripId: mongoose.Types.ObjectId): Promise<number[]> => {
    const seats = await Ride.aggregate([
        { $match: { busTripId: tripId } },
        { $unwind: "$seatNumbers" },
        {
            $group: {
              _id: null,                     
              bookedSeats: { 
                $push: "$seatNumbers"
              }
            }
        }, 
        { $project: { _id: 0, bookedSeats: 1 }}
    ]);

    if (seats.length === 0) {
        return [];
    }

    return seats[0].bookedSeats;
};

const checkUniqueSeatsInBusTripBooking = (seatsToBook: number[], bookedSeats: number[]) => {
    const uniqueSeatNumbers = _.difference(seatsToBook, bookedSeats);
    
    if (uniqueSeatNumbers.length !== seatsToBook.length) {
        const unavailbleSeats = _.intersection(seatsToBook, bookedSeats).join(',');
        return { status: false, message: `Seat: ${unavailbleSeats} ${unavailbleSeats.length > 1 ? 'are' : 'is'} unavailable` };
    }

    return { status: true, message: 'All seats are available' };
};

const getFiltersForTicketQuery = (params: z.infer<typeof busTripSchema>) => {
    const matchFilters = [
        {
            'profile.tripDetails': {
                $elemMatch: {
                    origin: new RegExp(params.origin, "i"),
                    originCity: new RegExp(params.originCity, "i"),
                    destination: new RegExp(params.destination, "i"),
                    destinationCity: new RegExp(params.destinationCity, "i"),
                    departureDates: moment(params.departureDate).day(),
                    busCapacity: {
                        $gte: params.numberOfSeats,
                    }
                }
            },
        },
    ];

    if (params.returnDate) {
        matchFilters.push({
            'profile.tripDetails': {
                $elemMatch: {
                    origin: new RegExp(params.origin, "i"),
                    originCity: new RegExp(params.originCity, "i"),
                    destination: new RegExp(params.destination, "i"),
                    destinationCity: new RegExp(params.destinationCity, "i"),
                    departureDates: moment(params.departureDate).day(), // @ts-ignore
                    returnDates: moment(params.returnDate).day(),
                    busCapacity: {
                        $gte: params.numberOfSeats,
                    }
                }
            }
        });

        matchFilters.push({
            'profile.tripDetails': {
                $elemMatch: {
                    origin: new RegExp(params.destination, "i"),
                    originCity: new RegExp(params.destinationCity, "i"),
                    destination: new RegExp(params.origin, "i"),
                    destinationCity: new RegExp(params.originCity, "i"),
                    departureDates: moment(params.returnDate).day(),
                    busCapacity: {
                        $gte: params.numberOfSeats,
                    }
                }
            },
        });
    }

    const queryFilter = { 
        profile: { $exists: true },
        $and: [
            { 'profile.tripDetails': { $exists: true } }, 
            { $or: matchFilters }
        ]
    };

    return queryFilter;
};

const getDateFromWeekday = (weekday: number) => {
    let today = moment();
    let currentWeekday = today.day();
    
    let daysUntilNext = (weekday - currentWeekday + 7) % 7;
    // if (daysUntilNext === 0) daysUntilNext = 7;

    let nextDate = today.add(daysUntilNext, 'day');
    return nextDate.format('YYYY-MM-DD');
};

const generateTicketQuery = (filters: Record<string, any>)  => {
    return Driver.aggregate([
        { $match: filters },
        { $unwind: "$profile.tripDetails" },
        { $unwind: "$profile.tripDetails.departureDates" },
        {
            $group: {
                _id: {
                    origin: "$profile.tripDetails.origin",
                    originCity: "$profile.tripDetails.originCity",
                    destination: "$profile.tripDetails.destination",
                    destinationCity: "$profile.tripDetails.destinationCity",
                    departureDate: "$profile.tripDetails.departureDates", 
                    departureTime: "$profile.tripDetails.departureTime",
                },
                details: {
                    $push: {
                        ticketId: "$profile.tripDetails._id",
                        logo: "$profile.busPersonalInformation.companyLogo",
                        seatCount: "$profile.tripDetails.busCapacity",
                        price: {
                            $cond: {
                                if: { $eq: ["$profile.tripDetails.isRoundTrip", true] },  // Check if isRoundTrip is true
                                then: { $divide: ["$profile.tripDetails.price", 2] },     // If true, divide price by 2
                                else: "$profile.tripDetails.price"                        // If false, keep the price as is
                            }
                        },
                        departureTime: "$profile.tripDetails.departureTime",
                        returnDate: "$profile.tripDetails.returnDates",
                        returnTime: "$profile.tripDetails.returnTime"
                    }
                }
            }
        },
        { $unwind: "$details" },
        {
            $project: {
                _id: 0,
                origin: "$_id.origin",
                originCity: "$_id.originCity", 
                destination: "$_id.destination",
                destinationCity: "$_id.destinationCity", 
                details: 1,
            }
        },
        {
            $sort: { label: 1 }
        }
    ]);
};

const getAvailableBusTickets = async (filters: Record<string, any>) => {
    let tickets = await generateTicketQuery(filters);

    let ticketsPromise = tickets.map(async (ticket) => {
        const [from, to] = [`${ticket.originCity}, ${ticket.origin}`, `${ticket.destinationCity}, ${ticket.destination}`];
        const [location, coordinates] = await Promise.all([getDriverTimeToLocation(from, to), geocodeLocations([from, to])]);

        const departureDate = getDateFromWeekday(ticket.details.departureDate);
        const fullDepartureDateAndTime = departureDate + ' ' + ticket.details.departureTime;
        const geometry = coordinates?.results.map(({ formatted_address, geometry }) => ({
            address: formatted_address,
            latitude: geometry.location.lat,
            longitude: geometry.location.lng,
        }));
        
        return {
            ...ticket, 
            details: { 
                ...ticket.details, 
                bookedSeats: await getBookedSeatsInBusTrip(ticket.details.ticketId),
                arrivalTime: moment(fullDepartureDateAndTime).add(location.timeToLocationInSeconds, 'seconds'),
                departureDate,
                location,
                coordinates: geometry,
            },
        };
    });

    tickets = await Promise.all(ticketsPromise);

    return tickets;
};

const getBusTripDetailsForBooking = async (tripId: mongoose.Types.ObjectId, params: z.infer<typeof busBookingSchema>, bookedSeats: number[]) => {
    let results = await Driver.aggregate([
        { 
            $match: {
                'profile.tripDetails': {
                    $elemMatch: {
                        _id: tripId,
                        departureDates: moment(params.departureDate).day(),
                        departureTime: moment(params.departureDate + ' ' + params.departureTime).format('HH:mm')
                    }
                }
            }
        },
        {
            $addFields: {
                tripDetails: {
                    $filter: {
                      input: "$profile.tripDetails",
                      as: "trip",          
                      cond: { $eq: ["$$trip._id", tripId] }
                    }
                }
            }
        },
        { $unwind: "$tripDetails" },
        { 
            $project: {
                _id: 1,
                tripDetails: 1,
                availableSeats: { $subtract: ["$tripDetails.busCapacity", bookedSeats.length] }
            }
        },
    ]);

    if (results.length === 0) {
        return { status: false, message: 'Invalid ticket details provided!', tripDetails: null };
    }

    if (results[0].availableSeats < 0) {
        return { status: false, message: 'Please select fewer seats!', tripDetails: null };
    }

    return { status: true, message: 'Trip details validated successfully', tripDetails: results[0] };
};

const generateBarcode = (id: string) => {
    const canvas = createCanvas(254, 89, 'svg');
    
    JsBarcode(canvas, id, { 
        lineColor: '#000000',
        width: 2,
        height: 70,
    });

    return canvas.toDataURL('image/png');
};

export default router;