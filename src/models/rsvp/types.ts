import { z } from "zod";

export const rsvpSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    attending: z.string(),
    favoriteDanceMove: z.string().optional(),
    storyName: z.string().optional(),
    marriageAdvice: z.string().optional(),
    hashtag: z.string().trim().optional(),
    figure: z.string().optional(),
    favoriteMemory: z.string().optional(),
});

export type IRSVP = z.infer<typeof rsvpSchema>;

