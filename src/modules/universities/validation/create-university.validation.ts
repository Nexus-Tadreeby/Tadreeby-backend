import { emailSchema, nameSchema, phoneSchema } from "src/common/utils/zod.helper";
import { z } from "zod";

export const createUniversitySchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name is too long'),
    shortCode: z
        .string()
        .trim()
        .min(2, 'Short code must be at least 2 characters')
        .max(10, 'Short code is too long'),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),

    location: z.string()
        .trim()
        .optional(),

    description: z
        .string()
        .trim()
        .max(1000)
        .optional(),
        
    isActive: z.boolean().default(true).optional(),
}) .strict()

export type CreateUniversitySchemaDto = z.infer< typeof createUniversitySchema>;