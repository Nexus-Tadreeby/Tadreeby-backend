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
        .gte(100000000)
        .lte(999999999),
})
    .strict() satisfies ZodType<RegisterStudentDto>

export type studentRegisterSchemaDto = z.infer<typeof studentRegisterSchema>;


