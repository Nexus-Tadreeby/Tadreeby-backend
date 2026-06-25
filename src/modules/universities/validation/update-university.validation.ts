import { emailSchema, nameSchema, phoneSchema } from "src/common/utils/zod.helper";
import { z } from "zod";

export const updateUniversitySchema =
    z.object({
        name: nameSchema,
        shortCode: z
            .string()
            .trim()
            .min(2)
            .max(20)
            .optional(),
        email:emailSchema.optional(),
        phone: phoneSchema.optional(),
        location: z
            .string()
            .trim()
            .optional(),

        description: z
            .string()
            .trim()
            .max(1000)
            .optional(),

        isActive: z.boolean().optional(),

    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    });

export type UpdateUniversitySchemaDto =z.infer<typeof updateUniversitySchema>;