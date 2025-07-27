import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Driver, User } from '../models/user/schema';
import { userRegistrationSchema } from '../models/user/types';

import { ServiceCode, UserType } from '../utils/constants';
import { getFirstAndLastNames, hashPassword } from '../utils/lib';
import { generateAdminSession } from '../controllers/user.controller';
import { getAdminUsers, getRiders, getTotalRevenue } from '../controllers/admin.controller';
import { createActivity, getActivitiesForDashboard } from '../controllers/activity.controller';

import adminAuth from '../middleware/admin';
import authUser from '../middleware/authUser';
import validateWith from '../middleware/validateWith';
import validateObjectId from '../middleware/validateObjectId';

const router = express.Router();

router.post('/', [authUser, adminAuth, validateWith(userRegistrationSchema)], async (req: Request, res: Response): Promise<any> => {
    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(StatusCodes.BAD_REQUEST).json({ message: 'An account with this email already exists!' });

    let result = getFirstAndLastNames(req.body.name);
    if (!result.status) return res.status(StatusCodes.BAD_REQUEST).json({ message: result.message });

    user = await User.create({
        firstName: result.names[0],
        lastName: result.names[1],
        email: req.body.email,
        password: await hashPassword(req.body.password),
        userType: UserType.ADMIN,
    });

    await user.sendAdminVerificationEmail(req.body.password);
    await createActivity({ user, action: 'Admin account created' });

    let session = await generateAdminSession(user);
    res.status(StatusCodes.CREATED).json(session);
});

router.get('/', [authUser, adminAuth], async (req: Request, res: Response): Promise<any> => {
   const users = await getAdminUsers();
   return res.json(users);
});

router.put('/users/:id/activate', [authUser, adminAuth, validateObjectId], async (req: Request, res: Response): Promise<any> => {
    let user = await User.findByIdAndUpdate(req.params.id, {
        $set: {
            isActive: true,
        },
    });

    if (!user) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'The user with the given ID was not found!' });
    }

    await createActivity({ user, action: 'Account was activated' });

    return res.json({
        message: 'Activated successfully!'
    });
});

router.put('/users/:id/deactivate', [authUser, adminAuth, validateObjectId], async (req: Request, res: Response): Promise<any> => {
    let user = await User.findByIdAndUpdate(req.params.id, {
        $set: {
            isActive: false,
        },
    });

    if (!user) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'The user with the given ID was not found!' });
    }

    await createActivity({ user, action: 'Account was deactivated' });

    return res.json({
        message: 'Deactivated successfully!'
    })
});

router.get('/dashboard', [authUser, adminAuth], async (req: Request, res: Response): Promise<any> => {
    const totalRidersPromise = User.countDocuments({ userType: UserType.RIDER });
    const totalDriversPromise = Driver.countDocuments();

    const result = await Promise.all([totalRidersPromise, totalDriversPromise, getTotalRevenue(), getActivitiesForDashboard()]);

    return res.json({
        totalRiders: result[0],
        totalDrivers: result[1],
        totalVehicles: result[1],
        totalRevenue: result[2],
        activities: result[3],
    });
});

router.get('/riders', [authUser, adminAuth], async (req: Request, res: Response): Promise<any> => {
    let riders = await getRiders();
    return res.json(riders);
});

router.get('/car/drivers', [authUser, adminAuth], async (req: Request, res: Response): Promise<any> => {
    const drivers = await Driver.aggregate([
        {
            $lookup: {
                from: 'users',
                foreignField: '_id',
                localField: 'user',
                as: 'user',
                pipeline: [
                    { 
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            email: 1,
                            lastLogin: 1,
                            isEmailVerified: 1,
                            phoneNumber: 1,
                            rating: 1,
                            isActive: 1,
                        } 
                    }
                ],
            },
        },
        {
            $unwind: '$user'
        },
        {
            $lookup: {
                from: 'services',
                foreignField: '_id',
                localField: 'service',
                as: 'service',
                pipeline: [
                    { 
                        $project: {
                            name: 1,
                            code: 1,
                        } 
                    }
                ],
            },
        },
        {
            $unwind: '$service'
        },
        {
            $match: {
                'service.code': ServiceCode.CAR,
            },
        },
        {
            $project: {
                user: 1,
                service: 1
            }
        }
    ]);

    return res.json(drivers);
});

router.get('/car/vehicles', [authUser, adminAuth], async (req: Request, res: Response): Promise<any> => {
    const vehicles = await Driver.aggregate([
        {
            $lookup: {
                from: 'services',
                foreignField: '_id',
                localField: 'service',
                as: 'service',
                pipeline: [
                    { 
                        $project: {
                            name: 1,
                            code: 1,
                        } 
                    }
                ],
            },
        },
        {
            $unwind: '$service'
        },
        {
            $match: {
                'service.code': ServiceCode.CAR,
                'profile.carPersonalInformation': {
                    $exists: true
                }
            }
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        { inspectionUrl: '$profile.inspectionUrl' },
                        '$profile.carPersonalInformation',
                    ],
                },
            }
        }
    ]);

    return res.json(vehicles);
});

router.get('/bus/companies', [authUser, adminAuth], async (req: Request, res: Response): Promise<any> => {
    const companies = await Driver.aggregate([
        {
            $lookup: {
                from: 'services',
                foreignField: '_id',
                localField: 'service',
                as: 'service',
                pipeline: [
                    { 
                        $project: {
                            name: 1,
                            code: 1,
                        } 
                    }
                ],
            },
        },
        {
            $unwind: '$service'
        },
        {
            $match: {
                'service.code': ServiceCode.BUS,
                'profile.busPersonalInformation': {
                    $exists: true
                }
            }
        },
        {
            $replaceRoot: {
                newRoot: '$profile.busPersonalInformation'
            }
        }
    ]);

    return res.json(companies);
});

router.get('/local/drivers', [authUser, adminAuth], async (req: Request, res: Response): Promise<any> => {
    const localRides = await Driver.aggregate([
        {
            $lookup: {
                from: 'users',
                foreignField: '_id',
                localField: 'user',
                as: 'user',
                pipeline: [
                    { 
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            email: 1,
                            lastLogin: 1,
                            isEmailVerified: 1,
                            phoneNumber: 1,
                            rating: 1,
                            isActive: 1,
                        } 
                    }
                ],
            },
        },
        {
            $unwind: '$user'
        },
        {
            $lookup: {
                from: 'services',
                foreignField: '_id',
                localField: 'service',
                as: 'service',
                pipeline: [
                    { 
                        $project: {
                            name: 1,
                            code: 1,
                        } 
                    }
                ],
            },
        },
        {
            $unwind: '$service'
        },
        {
            $match: {
                'service.code': ServiceCode.LOCAL,
                'profile.localRidePersonalInformation': {
                    $exists: true
                }
            }
        },
        {
            $lookup: {
                from: 'localridetypes',
                foreignField: '_id',
                localField: 'profile.localRidePersonalInformation.localRideType',
                as: 'profile.localRidePersonalInformation.localRideType',
            },
        },
        {
            $unwind: '$service'
        },
        {
            $project: {
                user: 1,
                service: 1,
                details: "$profile.localRidePersonalInformation"
            }
        }
    ]);

    return res.json(localRides);
});

export default router;