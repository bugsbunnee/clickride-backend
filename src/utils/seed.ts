import { Service } from "../models/services/schema";
import { IService } from "../models/services/types";
import { ServiceCode } from "./constants";

import logger from "../startup/logger";

const createServices = async () => {
    const services: IService[] = [
        {
            name: 'Book a Ride',
            color: '#FFDCD4',
            description: 'Order a ride from your home',
            driver: 'Car Driver',
            code: ServiceCode.CAR,
            image: 'https://res.cloudinary.com/dgdu2dyce/image/upload/v1734821455/clickride/ry2pecliebfd3zjke2dw.png',
        },
        {
            name: 'Buy Bus Ticket',
            color: '#D3E8D9',
            description: 'Book your bus ticket from the comfort of your home.',
            driver: 'Bus Listing',
            code: ServiceCode.BUS,
            image: 'https://res.cloudinary.com/dgdu2dyce/image/upload/v1734821455/clickride/woztjpnirzn25ccafbjk.png',
        },
        {
            name: 'Local Trips',
            color: '#E8E8D3',
            description: 'Call a local rider from around your area',
            driver: 'Local Rider',
            code: ServiceCode.LOCAL,
            image: 'https://res.cloudinary.com/dgdu2dyce/image/upload/v1734821456/clickride/mxryc9qhtzhcrsd5kp5n.png',
        },
    ];

    const result = await Service.insertMany(services);
    logger.info('Service result', result);
};

const drop = async () => {
   await Service.deleteMany();
};

const populate = async () => {
    await createServices();
};

const seed = async () => {
    if (process.env.NODE_ENV === 'development') {
        await drop();
        await populate();
    } else {
        throw new Error('Can only seed in dev environment!');
    }
};

export default seed;