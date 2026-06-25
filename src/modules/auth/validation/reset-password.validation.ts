import { z } from "zod";
import { passwordSchema } from "../../../common/utils/zod.helper";

export const reset_password = z.object({
    resetToken: z.string(),
    newPassword: passwordSchema ,
    confirmNewPassword: passwordSchema,
}).strict()
    .refine(
        (data) =>
            data.newPassword ===
            data.confirmNewPassword,
        {
            message:
                "Passwords do not match",
            path: ["confirmNewPassword"],
        },
    );



export type ResetPasswordDto = z.infer<typeof reset_password>;