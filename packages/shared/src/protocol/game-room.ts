import { z } from "zod";

import { COLS } from "@/connect-4";

const JoinSchema = z.object({
    roomId: z.string(),
    token: z.nanoid()
});

const MoveSchema = z.object({
    column: z.number().min(0).max(COLS)
});

const WaitSchema = z.object({
    players: z.array(z.string().nullable()),
    timersMs: z.tuple([z.number(), z.number()]),
    serverNow: z.number()
});

const StartSchema = z.object({
    players: z.array(z.string().nullable()),
    activePlayerId: z.string().nullable(),
    timersMs: z.tuple([z.number(), z.number()]),
    serverNow: z.number(),
    boards: z.tuple([z.string(), z.string()]).transform((raw) => [BigInt(raw[0]), BigInt(raw[1])]),
    lastMove: z.object({ row: z.number(), column: z.number() }).optional()
});

const UpdateSchema = z.object({
    activePlayerId: z.string().nullable(),
    timersMs: z.tuple([z.number(), z.number()]),
    serverNow: z.number(),
    boards: z.tuple([z.string(), z.string()]).transform((raw) => [BigInt(raw[0]), BigInt(raw[1])]),
    lastMove: z.object({ row: z.number(), column: z.number() }).optional()
});

const EndSchema = z.object({
    status: z.enum(["win", "draw", "timeout", "resign", "end"]),
    reason: z.string(),
    winner: z.string().nullable().optional(),
    winningMask: z
        .string()
        .transform((raw) => BigInt(raw))
        .optional(),
    statusAt: z.number(),
    cleanupAt: z.number(),
    serverNow: z.number()
});

const ExpireSchema = z.object({
    cleanupAt: z.number(),
    serverNow: z.number()
});

type WaitPayload = z.infer<typeof WaitSchema>;
type StartPayload = z.infer<typeof StartSchema>;
type UpdatePayload = z.infer<typeof UpdateSchema>;
type EndPayload = z.infer<typeof EndSchema>;
type ExpirePayload = z.infer<typeof ExpireSchema>;

type StartInputPayload = z.input<typeof StartSchema>;
type UpdateInputPayload = z.input<typeof UpdateSchema>;
type EndInputPayload = z.input<typeof EndSchema>;

export {
    JoinSchema,
    MoveSchema,
    WaitSchema,
    StartSchema,
    UpdateSchema,
    EndSchema,
    ExpireSchema,
    type WaitPayload,
    type StartPayload,
    type UpdatePayload,
    type EndPayload,
    type StartInputPayload,
    type UpdateInputPayload,
    type EndInputPayload,
    type ExpirePayload
};
