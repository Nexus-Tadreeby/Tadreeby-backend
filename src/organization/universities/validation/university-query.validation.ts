import { z } from 'zod';

export const UniversityQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type UniversityQueryType = z.infer<typeof UniversityQuerySchema>;