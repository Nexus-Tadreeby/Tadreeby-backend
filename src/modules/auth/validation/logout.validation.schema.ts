import z from 'zod';

export const logoutSchema = z
    .object({
        refreshToken: z.string().trim().min(55),
    })
    .strict();

export type LogoutSchemaDto = z.infer<typeof logoutSchema>;