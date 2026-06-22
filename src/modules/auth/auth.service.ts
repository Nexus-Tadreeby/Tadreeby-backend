import {
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";

import * as argon2 from "argon2";
import { JwtService } from "@nestjs/jwt";
import { User, UserRole } from "@prisma/client";
import { DatabaseService } from "../../database/database.service";
import { removeFields } from "../../common/utils/object.util";
import { LoginRequestDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { StudentRegisterDto } from "./dto/register.dto";
import { LogoutDto } from "./dto/logout.dto";
import { StudentService } from "../student/student.service";
import { Request } from "express";
import { verifyPassword } from "./utils/crypto.util";
import { generateRefreshToken, hashRefreshToken } from "./utils/refresh-token.util";

import { EmailService } from "../mail/email.service";
import { NotificationService } from "../notification/notification.service";
// import { emailLayout } from "../student/helpers/email-templates";
import { buildLoginAlertEmail, emailLayout, heading, paragraph, section } from '../student/helpers/email-templates';
import { RegisterStudentDto } from "../student/dto/register-student.dto";
@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: DatabaseService,
        private readonly jwt: JwtService,
        private readonly studentService: StudentService,
        private readonly emailService: EmailService,
        private readonly notificationService: NotificationService,
    ) { }


    
    
    async registerStudent(dto: RegisterStudentDto, req: Request) {
        const student = await this.studentService.create(dto);

        const session = await this.createSession(student, req);

        return {
            user: student,
            ...session,
        };
    }


    


    
    async login(dto: LoginRequestDto, req: Request) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { studentProfile: true },
        });

        if (!user) throw new UnauthorizedException("Invalid credentials");

        const valid = await verifyPassword(user.password, dto.password);
        if (!valid) throw new UnauthorizedException("Invalid credentials");

        if (!user.isActive) {
            throw new UnauthorizedException("Account disabled");
        }

        const session = await this.createSession(user, req);

        const userWithoutPassword = removeFields(user, ["password"]);

        return {
            user: userWithoutPassword,
            ...session,
        };
    }


    // private async createSession(
    //     user: Pick<User, "id" | "role" | "email">,
    //     req: Request,
    // ) {
    //     const refreshToken = generateRefreshToken();
    //     const refreshTokenHash = await argon2.hash(refreshToken);

    //     const userAgent = req.headers["user-agent"] ?? "unknown";
    //     const ipAddress = req.ip ?? "unknown";

    //     // check existing session
    //     const existingSession = await this.prisma.session.findFirst({
    //         where: {
    //             userId: user.id,
    //             revokedAt: null,
    //         },
    //     });

    //     // create session
    //     const session = await this.prisma.session.create({
    //         data: {
    //             userId: user.id,
    //             refreshTokenHash,
    //             deviceInfo: userAgent,
    //             ipAddress,
    //             userAgent,
    //             expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    //         },
    //     });

    //     // access token
    //     const accessToken = this.jwt.sign(
    //         {
    //             sub: user.id,
    //             role: user.role,
    //             sid: session.id,
    //         },
    //         { expiresIn: "15m" },
    //     );


    //     // ALERT SYSTEM
    //     if (existingSession && existingSession.deviceInfo !== userAgent) {
    //         await this.emailService.sendMail(
    //             user.email,
    //             "Security Alert: New Login",
    //             `
    //             <h3>New login detected</h3>
    //             <p>IP: ${ipAddress}</p>
    //             <p>Device: ${userAgent}</p>
    //             <p>If this wasn't you, secure your account.</p>
    //             `,
    //         );

    //         await this.notificationService.createNotification(
    //             user.id,
    //             "New login detected",
    //             "Your account was accessed from a new device",
    //             "SYSTEM",
    //         );
    //     }

    //     return {
    //         accessToken,
    //         refreshToken,
    //         sessionId: session.id,
    //     };
    // }
    private async createSession(
        user: Pick<User, "id" | "role" | "email">,
        req: Request,
    ) {
        const refreshToken = generateRefreshToken();
        //!
         console.time("argon2")
    
        const refreshTokenHash = await argon2.hash(refreshToken);

        console.timeEnd("argon2");

        const userAgent = req.headers["user-agent"] ?? "unknown";
        const ipAddress = req.ip ?? "unknown";

        // get all active sessions
        const activeSessions = await this.prisma.session.findMany({
            where: {
                userId: user.id,
                revokedAt: null,
            },
        });

        // detect if device already exists
        const knownDevice = activeSessions.some(
            (s) => s.userAgent === userAgent,
        );

        const session = await this.prisma.session.create({
            data: {
                userId: user.id,
                refreshTokenHash,
                deviceInfo: userAgent,
                ipAddress,
                userAgent,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        console.time("email");






        void this.emailService.sendMail(
            user.email,
            "🔐 Security Alert: New login detected",  
            buildLoginAlertEmail(user, req),         
        );



        console.timeEnd("email");

        const accessToken = this.jwt.sign(
            {
                sub: user.id,
                role: user.role,
                sid: session.id,
            },
            { expiresIn: "15m" },
        );



        // if (activeSessions.length > 0 && !knownDevice) {
        //     await this.emailService.sendMail(
        //         user.email,
        //         "Security Alert: New Device Login",
        //         `
        //     <h3>New login detected</h3>
        //     <p><b>IP:</b> ${ipAddress}</p>
        //     <p><b>Device:</b> ${userAgent}</p>
        //     <p>If this wasn't you, reset your password immediately.</p>
        //     `,
        //     );

        //     await this.notificationService.createNotification(
        //         user.id,
        //         "New device login detected",
        //         "A login was detected from an unrecognized device.",
        //         "SYSTEM",
        //     );
        // }

        return {
            accessToken,
            refreshToken,
            sessionId: session.id,
        };
    }




    async refresh(dto: RefreshTokenDto) {
        const sessions = await this.prisma.session.findMany({
            where: {
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
        });

        let matchedSession: (typeof sessions)[number] | null = null;

        for (const session of sessions) {
            const valid = await argon2.verify(
                session.refreshTokenHash,
                dto.refreshToken,
            );

            if (valid) {
                matchedSession = session;
                break;
            }
        }

        if (!matchedSession) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        const newRefreshToken = generateRefreshToken();
        // const newHash = await argon2.hash(newRefreshToken);
        const newHash = hashRefreshToken(newRefreshToken)

        await this.prisma.session.update({
            where: { id: matchedSession.id },
            data: {
                refreshTokenHash: newHash,
                lastUsedAt: new Date(),
            },
        });

        const accessToken = this.jwt.sign(
            {
                sub: matchedSession.userId,
                role: matchedSession.userId,
                sid: matchedSession.id,
            },
            { expiresIn: "15m" },
        );

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }




    async logout(dto: LogoutDto) {
        
        await this.prisma.session.updateMany({
            where: {
                refreshTokenHash : dto.refreshToken ,
                revokedAt: null,
                // id: dto.refreshToken
            },
            data: {
                revokedAt: new Date(),
            },
        });

        return {
            success: true,
            message: "Logged out successfully",
        };
    }


    async getSessions(userId: number) {
        const [sessions, count] = await this.prisma.$transaction([
            this.prisma.session.findMany({
                where: {
                    userId,
                    revokedAt: null,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
                select: {
                    id: true,
                    deviceInfo: true,
                    ipAddress: true,
                    userAgent: true,
                    createdAt: true,
                    lastUsedAt: true,
                    expiresAt: true,
                },
                orderBy: {
                    lastUsedAt: 'desc',
                },
            }),

            this.prisma.session.count({
                where: {
                    userId,
                    revokedAt: null,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            }),
        ]);

        return {
            count,
            sessions,
        };
    }
    


    async revokeSession(userId: number, sessionId: string) {
        const session = await this.prisma.session.findFirst({
            where: {
                id: sessionId,
                userId,
                revokedAt: null,
            },
        });

        if (!session) {
            return {
                success: false,
                message: 'Session not found',
            };
        }

        await this.prisma.session.update({
            where: {
                id: sessionId,
            },
            data: {
                revokedAt: new Date(),
            },
        });

        return {
            success: true,
            message: 'Session revoked successfully',
        };
    }


    async revokeAllSessions(userId: number) {
        const result = await this.prisma.session.updateMany({
            where: {
                userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });

        return {
            success: true,
            message: 'All sessions revoked successfully',
            revokedCount: result.count,
        };
    }

}