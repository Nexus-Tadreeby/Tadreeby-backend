import z from 'zod';

export const refreshTokenSchema = z
    .object({
        refreshToken: z.string().trim().min(40),
    })
    .strict();

export type RefreshTokenSchemaDto = z.infer<typeof refreshTokenSchema>;