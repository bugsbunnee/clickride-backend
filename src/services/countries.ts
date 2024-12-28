import axios from "axios"
import logger from "../startup/logger";

interface StatesResponse {
    data: {
        name: string;
        iso3: string;
        states: { name: string; }[];
    }
}

interface CitiesResponse {
    data: string[];
}

interface CitiesPayload {
    state: string, 
    country: string
}

export const getStatesInCountry = async (country: string) => {
    try {
        const endpoint = process.env.COUNTRIES_API_URL + '/countries/states';
        const response = await axios.post<StatesResponse>(endpoint, { country });

        return response.data.data.states.map((state) => ({
            label: state.name,
            value: state.name
        }));
    } catch (error) {
        logger.error(error);

        return [];
    }
};

export const getCitiesInState = async (payload: CitiesPayload) => {
    try {
        const endpoint = process.env.COUNTRIES_API_URL + '/countries/state/cities';
        console.log(payload)
        const response = await axios.post<CitiesResponse>(endpoint, payload);

        return response.data.data.map((city) => ({
            label: city,
            value: city
        }));
    } catch (error) {
        console.log(error)
        // logger.error(error);

        return [];
    }
};