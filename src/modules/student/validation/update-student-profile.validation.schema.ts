import z, { ZodType } from 'zod';
import { nameSchema, phoneSchema } from '../../../common/utils/zod.helper';
import { UpdateStudentProfileDto } from '../dto/update-student-profile.dto';

export const UpdateStudentProfileSchema = z
    .object({
        // firstName: nameSchema.optional(),
        // lastName: nameSchema.optional(),
        // phone: phoneSchema.optional(),
        // major: z.string().min(1).optional(),
        // academicYear: z.coerce.number().int().positive().optional(),
        gpa: z.number().min(0).max(4).optional().nullable(),
        phone: z.string().optional(), 
        profileImage: z.string().optional().nullable(),
        cvFile: z.string().optional().nullable(),
        recoveryEmail: z.string().email().nullable().optional(),

    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field is required',
        path: [],
    }) satisfies ZodType<UpdateStudentProfileDto>;
