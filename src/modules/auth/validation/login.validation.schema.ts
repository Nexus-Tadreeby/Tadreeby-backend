import { z } from "zod";
import { emailSchema } from "../../../common/utils/zod.helper";

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1),
}).strict()

export type LoginSchemaDto = z.infer<typeof loginSchema>;





