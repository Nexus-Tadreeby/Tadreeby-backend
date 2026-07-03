import z, { ZodType } from "zod";
import {
    emailSchema,
    nameSchema,
    passwordSchema,
    phoneSchema,
} from "../../../common/utils/zod.helper";
import { RegisterStudentDto } from "../dto/register-student.dto";

export const studentRegisterSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(8, 'Confirm password is required'),
    firstName: nameSchema,
    lastName: nameSchema,
    phone: phoneSchema,
    major: z.string().min(1),
    universityId: z.coerce.number().int(),
    studentNumber: z.coerce.number().int()
        .min(100000, 'Student number must be at least 6 digits')
        .max(999999999999999, 'Student number must be at most 15 digits'),
    verificationDocument: z.string().min(1, 'Verification document is required!'),
    personalID: z.coerce.number()
        .int()
        .min(100000000, 'Personal ID must be exactly 9 digits')
        .max(999999999, 'Personal ID must be exactly 9 digits'),
}).strict()
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    }) satisfies ZodType<RegisterStudentDto>

export type studentRegisterSchemaDto = z.infer<typeof studentRegisterSchema>;


