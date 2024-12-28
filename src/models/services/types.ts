import { z } from "zod";
import { SERVICE_CODES } from "../../utils/constants";

const serviceSchema = z.object({
    name: z.string(),
    code: z.enum(SERVICE_CODES as any),
    description: z.string(),
    color: z.string(),
    image: z.string().url(),
    driver: z.string(),
});

export type IService = z.infer<typeof serviceSchema>;

