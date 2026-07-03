import { emailSchema, nameSchema, phoneSchema } from "src/common/utils/zod.helper";
import { z } from "zod";
import { UpdateCompanyDto } from "../dto/update-company.dto";

export const UpdateCompanySchema =
    z.object({
        name: z
            .string()
            .trim()
            .regex(/^[A-Za-z\s]+(?:-[A-Za-z\s]+)*$/, 'Name must begin and end with a letter. Spaces and dashes are allowed only between letters.')
            .min(2, 'Name must be at least 2 characters')
            .max(50, 'Name is too long')
            .optional(),

        shortCode: z
            .string()
            .trim()
            .min(2, 'Short code must be at least 2 characters')
            .max(10, 'Short code is too long')
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

        logo: z.string()
            .trim()
            .optional(),

        isActive: z.boolean().optional(),

    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    })  satisfies z.ZodType<UpdateCompanyDto>;

export type UpdateCompanySchemaDto = z.infer<typeof UpdateCompanySchema>;