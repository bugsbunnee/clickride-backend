import { ServiceCode } from "./constants";
import { PickerOption } from "./models";

export const services: PickerOption[] = [
    {
        label: 'Car Driver',
        value: ServiceCode.CAR,
        image: 'https://res.cloudinary.com/dgdu2dyce/image/upload/v1734821455/clickride/ry2pecliebfd3zjke2dw.png',
    },
    {
        label: 'Local Rider',
        value: ServiceCode.LOCAL,
        image: 'https://res.cloudinary.com/dgdu2dyce/image/upload/v1734821456/clickride/mxryc9qhtzhcrsd5kp5n.png',
    },
    {
        label: 'Bus Listing',
        value: ServiceCode.BUS,
        image: 'https://res.cloudinary.com/dgdu2dyce/image/upload/v1734821455/clickride/woztjpnirzn25ccafbjk.png',
    },
];

export const AVAILABLE_SERVICE_TYPES = services.map((service) => service.value);