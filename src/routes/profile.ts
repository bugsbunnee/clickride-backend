import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';

import { Driver, User } from '../models/user/schema';
import { IService } from '../models/services/types';
import { busPersonalInformationSchema, carPersonalInformationSchema, localPersonalInformationSchema, paymentDetailsSchema, routeDetailsSchema, tripDetailsSchema, vehicleDocumentsSchema } from '../models/user/types';
import { generateDriverSession } from '../controllers/user.controller';
import { USER_FIELDS_TO_EXCLUDE, ServiceCode } from '../utils/constants';
import { extractFieldsUploadFromFiles, uploadStream } from '../services/cloudinary';

import authDriver from '../middleware/authDriver';
import upload from '../services/multer';
import validateWith from '../middleware/validateWith';
import validateService from '../middleware/validateService';

const router = express.Router();
const documentsUpload = upload.fields([
    { name: "license", maxCount: 1 },
    { name: "display", maxCount: 1 },
    { name: "interior", maxCount: 1 },
    { name: "exterior", maxCount: 1 },
    { name: "ownership", maxCount: 1 },
    { name: "roadWorthiness", maxCount: 1 },
    { name: "insurance", maxCount: 1 },
    { name: "lasrra", maxCount: 1 },
    { name: "lasdri", maxCount: 1 },
]);

router.put('/car/personal-information', [authDriver, validateService(ServiceCode.CAR), validateWith(carPersonalInformationSchema)], async (req: Request, res: Response): Promise<any> => {
    const driver = await Driver.findByIdAndUpdate(req.driver!._id, {
        $set: {
            'profile.carPersonalInformation': {
                gender: req.body.gender,
                isVehicleOwner: req.body.isVehicleOwner,
                vehicleManufacturer: req.body.vehicleManufacturer,
                numberOfSeats: req.body.numberOfSeats,
                vehicleYear: req.body.vehicleYear,
                vehicleColor: req.body.vehicleColor,
                vehicleLicensePlate: req.body.vehicleLicensePlate,
            }
        }
    }, { new: true, populate: 'service' }).lean();

    if (!driver) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid driver provided!' });
    }

    const user = await User.findByIdAndUpdate(driver.user._id, { 
        $set: {
            firstName: req.body.firstName, 
            lastName: req.body.lastName 
        }
    }, { new: true }).select(USER_FIELDS_TO_EXCLUDE.map((field) => `-${field}`).join(' ')).lean();
    
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Could not find the associated user!' });
    }

    res.json(generateDriverSession({ driver, service: driver.service as unknown as IService, user }));
});

router.put('/bus/personal-information', [authDriver, validateService(ServiceCode.BUS), upload.single('companyLogo'), validateWith(busPersonalInformationSchema)], async (req: Request, res: Response): Promise<any> => {
    const validation = await validateImageFile(req);
    if (!validation.status) {
        return res.status(validation.code).json({ message: validation.message });
    }

    const driver = await Driver.findByIdAndUpdate(req.driver!._id, {
        $set: {
            'profile.busPersonalInformation': {
                companyName: req.body.companyName,
                companyLogo: validation.fileUrl,
            }
        }
    }, { new: true, populate: 'service' }).lean();

    if (!driver) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid driver provided!' });
    }

    const user = await User.findByIdAndUpdate(driver.user._id, { 
        $set: {
            firstName: req.body.firstName, 
            lastName: req.body.lastName 
        }
    }, { new: true }).select(USER_FIELDS_TO_EXCLUDE.map((field) => `-${field}`).join(' ')).lean();
    
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Could not find the associated user!' });
    }

    res.json(generateDriverSession({ driver, service: driver.service as unknown as IService, user }));
});

router.put('/local/personal-information', [authDriver, validateService(ServiceCode.LOCAL), upload.single('profilePhoto'), validateWith(localPersonalInformationSchema)], async (req: Request, res: Response): Promise<any> => {
    const validation = await validateImageFile(req);
    if (!validation.status) {
        return res.status(validation.code).json({ message: validation.message });
    }

    const driver = await Driver.findByIdAndUpdate(req.driver!._id, {
        $set: { 
            'profile.localRidePersonalInformation': {
                profilePhotoUrl: validation.fileUrl,
                localRideType: req.body.localRideType,
            },
        },
    }, { new: true, populate: 'service' }).lean();

    if (!driver) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid driver provided!' });
    }

    const user = await User.findByIdAndUpdate(driver.user._id, { 
        $set: {
            firstName: req.body.firstName, 
            lastName: req.body.lastName 
        }
    }, { new: true }).select(USER_FIELDS_TO_EXCLUDE.map((field) => `-${field}`).join(' ')).lean();
    
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Could not find the associated user!' });
    }

    res.json(generateDriverSession({ driver, service: driver.service as unknown as IService, user }));
});

router.put('/payment-details', [authDriver, validateWith(paymentDetailsSchema)], async (req: Request, res: Response): Promise<any> => {
    const driver = await Driver.findByIdAndUpdate(req.driver!._id, {
        $set: {
            'profile.paymentDetails': {
                billingType: req.body.billingType,
                address: req.body.address,
                accountName: req.body.accountName,
                accountNumber: req.body.accountNumber,
                bankName: req.body.bankName,
            }
        }
    }, { new: true, upsert: true, populate: 'service' }).lean();

    if (!driver) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid driver provided!' });
    }

    res.json(generateDriverSession({ driver, service: driver.service as unknown as IService, user: req.driver!.user }));

});

router.put('/vehicle-documents', [authDriver, validateService(ServiceCode.CAR), documentsUpload], async (req: Request, res: Response): Promise<any> => {
    if (!req.files) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Missing file!' });
    }

    const validation = vehicleDocumentsSchema.safeParse(req.files);
    if (!validation.success) return res.status(StatusCodes.BAD_REQUEST).json(validation.error.flatten());

    const driver = await Driver.findByIdAndUpdate(req.driver!._id, {
        $set: {
            'profile.vehicleDocuments': await extractFieldsUploadFromFiles(req.files! as any)
        }
    }, { new: true, populate: 'service' }).lean();

    if (!driver) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid driver provided!' });
    }

    res.json(generateDriverSession({ 
        driver, 
        service: driver.service as unknown as IService, 
        user: req.driver!.user
    }));
});

router.put('/vehicle-inspection', [authDriver, validateService(ServiceCode.CAR), upload.single('inspection')], async (req: Request, res: Response): Promise<any> => {
    const validation = await validateImageFile(req);
    if (!validation.status) {
        return res.status(validation.code).json({ message: validation.message });
    }

    const driver = await Driver.findByIdAndUpdate(req.driver!._id, {
        $set: {
            'profile.inspectionUrl': validation.fileUrl
        }
    }, { new: true, populate: 'service' }).lean();

    if (!driver) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid driver provided!' });
    }

    res.json(generateDriverSession({ 
        driver, 
        service: driver.service as unknown as IService, 
        user: req.driver!.user
    }));
});

router.put('/trip-details', [authDriver, validateService(ServiceCode.BUS), validateWith(tripDetailsSchema)], async (req: Request, res: Response): Promise<any> => {
    const driver = await Driver.findById(req.driver!._id).populate('service');
    if (!driver) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid driver provided!' });
    }

    if (driver.profile) {
        const tripMatch = driver.profile.tripDetails.find((trip) => {
            const isSameOrigin = trip.origin.toLowerCase().trim() === req.body.origin.toLowerCase().trim();
            const isSameDestination = trip.destination.toLowerCase().trim() === req.body.destination.toLowerCase().trim();

            return isSameOrigin && isSameDestination;
        });

        if (tripMatch) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: `Matching trip with Origin: ${req.body.origin} & Destination: ${req.body.destination} already exists!` });
        }

        driver.profile.tripDetails.push({
            origin: req.body.origin,
            destination: req.body.destination,
            originCity: req.body.originCity,
            destinationCity: req.body.destinationCity,
            price: req.body.price,
            isRoundTrip: req.body.isRoundTrip,
            departureDates: req.body.departureDates,
            departureTime: req.body.departureTime,
            returnDates: req.body.returnDates,
            returnTime: req.body.returnTime,
            busType: req.body.busType,
            busCapacity: req.body.busCapacity,
            airConditioning: req.body.airConditioning,
        })
    } else {
        // @ts-ignore
        driver.profile = {
            tripDetails: [
                {
                    origin: req.body.origin,
                    destination: req.body.destination,
                    originCity: req.body.originCity,
                    destinationCity: req.body.destinationCity,
                    price: req.body.price,
                    isRoundTrip: req.body.isRoundTrip,
                    departureDates: req.body.departureDates,
                    departureTime: req.body.departureTime,
                    returnDates: req.body.returnDates,
                    returnTime: req.body.returnTime,
                    busType: req.body.busType,
                    busCapacity: req.body.busCapacity,
                    airConditioning: req.body.airConditioning,
                }
            ]
        };
    }

    await driver.save();

    res.json(generateDriverSession({ 
        driver, 
        service: driver.service as unknown as IService, 
        user: req.driver!.user 
    }));
});

router.put('/route-details', [authDriver, validateService(ServiceCode.LOCAL), validateWith(routeDetailsSchema)], async (req: Request, res: Response): Promise<any> => {
    const driver = await Driver.findByIdAndUpdate(req.driver!._id, {
        $push: {
            'profile.routeDetails': {
                route: req.body.route,
                price: req.body.price
            },
        },
    }, { new: true, populate: 'service' }).lean();

    if (!driver) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Invalid driver provided!' });
    }

    res.json(generateDriverSession({ 
        driver, 
        service: driver.service as unknown as IService, 
        user: req.driver!.user 
    }));
});

const validateImageFile = async (req: Request) => {
    if (!req.file) {
        return { code: StatusCodes.BAD_REQUEST, message: 'Missing file!', status: false };
    }

    const response = await uploadStream(req.file.buffer);
    if (!response || !response.secure_url) {
        return { code: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Something failed while uploading the file!', status: false };
    }

    return { code: StatusCodes.OK, message: 'Validated successfully', status: true, fileUrl: response.secure_url };
};

export default router;