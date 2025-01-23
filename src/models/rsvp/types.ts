import { z } from "zod";

export const rsvpSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    attending: z.string(),
});

export type IRSVP = z.infer<typeof rsvpSchema>;

