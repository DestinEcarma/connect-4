import { z } from "zod";

const FoundSchema = z.object({
    roomId: z.nanoid(),
    token: z.nanoid()
});

export { FoundSchema };
