import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const UserQuerySchema = z.object({
    search: z.string().optional(),
    // role: z.enum([
    //     UserRole.SUPER_ADMIN,
    //     UserRole.UNIVERSITY_ADMIN,
    //     UserRole.COMPANY_ADMIN,
    //     UserRole.UNIVERSITY_SUPERVISOR,
    //     UserRole.COMPANY_TRAINER,
    //     UserRole.STUDENT,
    // ]).optional(),
    role: z
        .preprocess(
            (val) => {
                if (typeof val === 'string') {
                    const upper = val.toUpperCase();
                    const roleValues = Object.values(UserRole);
                    if (roleValues.includes(upper as UserRole)) {
                        return upper as UserRole;
                    }
                }
                return undefined;
            },
            z.enum([
                UserRole.SUPER_ADMIN,
                UserRole.UNIVERSITY_ADMIN,
                UserRole.COMPANY_ADMIN,
                UserRole.UNIVERSITY_SUPERVISOR,
                UserRole.COMPANY_TRAINER,
                UserRole.STUDENT,
            ]).optional()
        )
        .optional()
        .catch(undefined),

    isActive: z.preprocess(
        (val) => {
            if (val === 'true') return true;
            if (val === 'false') return false;
            if (val === true) return true;
            if (val === false) return false;
            return undefined;
        },
        z.boolean().optional()
    ),
    universityId: z.coerce.number().int().positive().optional(),
    companyId: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export type UserQueryType = z.infer<typeof UserQuerySchema>;