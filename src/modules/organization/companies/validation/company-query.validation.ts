import { z } from 'zod';
import { CompanyQueryDto } from '../dto/company-query.dto';

export const CompanyQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
    sortBy: z.enum(['id', 'name', 'shortCode']).default('id'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
}) satisfies z.ZodType<CompanyQueryDto>;

export type CompanyQueryType = z.infer<typeof CompanyQuerySchema>;