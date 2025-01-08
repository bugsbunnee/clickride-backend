import axios from "axios";

import { ICoordinates } from "../models/user/types";
import { mapCoordsToString } from "../utils/lib";
import _ from "lodash";

interface DistanceElement {
    distance: { text: string; value: number; };
    duration: { text: string; value: number; };
    status: string;
}

interface DistanceResponse {
    destination_addresses: string[];
    origin_addresses: string[];
    status: string;
    rows: { elements: DistanceElement[] }[];
}

interface DistancePayload {
    origins: (ICoordinates | string)[];
    destinations: (ICoordinates | string)[];
}



interface GeocodeResponse {
    results: {
        formatted_address: string;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        }
    }[];
}


export const getDistanceBetweenCoords = async ({ origins, destinations }: DistancePayload) => {
    try {
        const endpoint = process.env.GOOGLE_API_URL + '/distancematrix/json';
        const response = await axios.get<DistanceResponse>(endpoint, {
            params: {
                origins: origins.map((location) => _.isString(location) ? location : mapCoordsToString(location)).join('|'),
                destinations: destinations.map((location) => _.isString(location) ? location : mapCoordsToString(location)).join('|'),
                key: process.env.GOOGLE_API_KEY,
            },
        });

        return response.data;
    } catch (error) {
        return null;
    }
};

export const geocodeLocations = async (addresses: string[]) => {
    try {
        const endpoint = process.env.GOOGLE_API_URL + '/geocode/json';
        const response = await axios.get<GeocodeResponse>(endpoint, {
            params: {
                address: addresses.join(','),
                key: process.env.GOOGLE_API_KEY,
            }
        });

        return response.data;
    } catch (error) {
        return null;
    }
};