import {
    BadRequestException,
    Injectable,
} from "@nestjs/common";
import * as argon2 from "argon2";
import { JwtService } from "@nestjs/jwt";

import { DatabaseService } from "../../database/database.service";
import { EmailService } from "../mail/email.service";

import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

import { buildPasswordResetEmail, emailLayout } from "../student/helpers/email-templates";
import { randomBytes } from "crypto";
import { VerifyResetCodeDto } from "./dto/verify-reset-password.dto";

@Injectable()
export class ForgetPasswordService {
    constructor(
        private readonly prisma: DatabaseService,
        private readonly jwt: JwtService,
        private readonly emailService: EmailService,
    ) { }

    private generateResetCode(length = 6): string {
        const chars =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        return Array.from(randomBytes(length))
            .map((byte) => chars[byte % chars.length])
            .join("");


    }





    async forgotPassword(
        dto: ForgotPasswordDto,
    ) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });


        if (!user) {
            return {
                message:
                    "Can't find user with that email.",
            };
        }



        const latestCode =
            await this.prisma.passwordResetCode.findFirst({
                where: {
                    userId: user.id,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

        if (
            latestCode &&
            !latestCode.used &&
            Date.now() -
            latestCode.createdAt.getTime() <
            2 * 60 * 1000
        ) {
            throw new BadRequestException(
                "Please wait before requesting a new code",
            );
        }



        await this.prisma.passwordResetCode.deleteMany({
            where: {
                userId: user.id,
            },
        });


        
        const code = this.generateResetCode();

        await this.prisma.passwordResetCode.create({
            data: {
                userId: user.id,
                code,
                expiresAt: new Date(
                    Date.now() + 15 * 60 * 1000,
                ),
            },
        });

    //     void this.emailService.sendMail(
    //         user.email,
    //         "Password Reset Code",
    //         emailLayout(`
    //     <h2>Password Reset Request</h2>
    //     <p><b>Your verification code is: </p>
    //     <p><h1>${code}</h1></p>
    //     <p>please make sure you do not share this code with anyone.</p>
    // `),
    //     );
    
    
            // return {
            //     message:
            //         "Verification code has been sent.",
            // };

        try {
            // Build the modern email
            const html = buildPasswordResetEmail(user, code);

            // Send with better subject
            void this.emailService.sendMail(
                user.email,
                '🔐 Your password reset code',
                html,
            );
        } catch (error) {
            console.error(`Failed to send password reset email to ${user.email}`, error);
       
        }

        return {
            message: "Verification code has been sent to your email.",
        };



    }




    async verifyResetCode(
        dto: VerifyResetCodeDto,
    ) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });

        if (!user) {
            throw new BadRequestException(
                "Invalid verification code",
            );
        }

        const resetCode =
            await this.prisma.passwordResetCode.findFirst({
                where: {
                    userId: user.id,
                    code: dto.code.toUpperCase(),
                    used: false,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            });

        if (!resetCode) {
            throw new BadRequestException(
                "Invalid or expired verification code",
            );
        }

        const resetToken = this.jwt.sign(
            {
                sub: user.id,
                purpose: "password-reset",
            },
            {
                expiresIn: "10m",
            },
        );

        return {
            resetToken,
        };


    }




    async resetPassword(
        dto: ResetPasswordDto,
    ) {
        let payload: {
            sub: number;
            purpose: string;
        };


        try {
            payload = this.jwt.verify(
                dto.resetToken,
            );
        } catch {
            throw new BadRequestException(
                "Invalid reset token",
            );
        }

        if (payload.purpose !=="password-reset") {
            throw new BadRequestException(
                "Invalid reset token",
            );
        }

        const user = await this.prisma.user.findUnique({
            where: {
                id: payload.sub,
            },
        });

        if (!user) {
            throw new BadRequestException(
                "User not found",
            );
        }

        const isSamePassword =
            await argon2.verify(
                user.password,
                dto.newPassword,
            );

        if (isSamePassword) {
            throw new BadRequestException(
                "New password must be different from the current password",
            );
        }

        const passwordHash =  await argon2.hash(dto.newPassword);

        await this.prisma.user.update({
            where: {
                id: payload.sub,
            },
            data: {
                password: passwordHash,
            },
        });

        await this.prisma.passwordResetCode.updateMany({
            where: {
                userId: payload.sub,
            },
            data: {
                used: true,
            },
        });

        await this.prisma.session.updateMany({
            where: {
                userId: payload.sub,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });

        return {
            success: true,
            message:
                "Password reset successfully",
        };


    }
}
