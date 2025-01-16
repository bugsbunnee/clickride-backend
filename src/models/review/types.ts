import { z } from "zod";
import { getObjectIdIsValid } from "../../utils/lib";

const reviewZodSchema = z.object({
    userId: z.string().refine((value) => getObjectIdIsValid(value), 'Invalid ID'),
    message: z.string(),
    rating: z.number().positive().max(5),
});

export type IReview = z.infer<typeof reviewZodSchema>;