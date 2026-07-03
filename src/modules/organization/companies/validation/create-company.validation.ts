import { z } from 'zod';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { emailSchema, phoneSchema } from 'src/common/utils/zod.helper';

export const CreateCompanySchema = z.object({
    name: z.string().min(2, 'Name is required').max(50, 'Name is too long')
        .regex(/^[A-Za-z\s]+(?:-[A-Za-z\s]+)*$/, 'Name must begin and end with a letter. Spaces and dashes are allowed only between letters.')
,
    shortCode: z.string().min(2, 'Short code must be at least 2 characters').max(10, 'Short code is too long'),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    logo: z.string().optional(),
    isActive: z.boolean().default(true).optional(),
}) satisfies z.ZodType<CreateCompanyDto>;

export type CreateCompanySchemaDto = z.infer<typeof CreateCompanySchema>;