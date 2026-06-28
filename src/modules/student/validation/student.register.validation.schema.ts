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
    universityId: z.number().int(),
    studentNumber: z.number().int(),
    verificationDocument: z.string().min(1,'Varificatin document is required!'),
    personalID: z
        .number()
        .int()
        .min(100000000, 'Personal ID must be exactly 9 digits')
        .max(999999999, 'Personal ID must be exactly 9 digits'),
}).strict()
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    }) satisfies ZodType<RegisterStudentDto>

export type studentRegisterSchemaDto = z.infer<typeof studentRegisterSchema>;


