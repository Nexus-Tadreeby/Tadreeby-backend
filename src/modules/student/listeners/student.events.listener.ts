
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DatabaseService } from '../../../database/database.service';
import { EmailService } from '../../mail/email.service';
import { NotificationService } from '../../notification/notification.service';
import { NotificationType } from '@prisma/client';
import { buildApplicationApprovedEmail, buildApplicationReceivedEmail, buildApplicationRejectedEmail, button, emailLayout } from '../helpers/email-templates';


@Injectable()
export class StudentEventsListener {
    private readonly logger = new Logger(StudentEventsListener.name);

    constructor(
        private prisma: DatabaseService,
        private emailService: EmailService,
        private notificationService: NotificationService,
    ) { }

    private frontendUrl() {
        return process.env.FRONTEND_URL || 'http://localhost:5173';
    }

    // ---------------- REGISTERED ----------------
    @OnEvent('student.registered')
    async handleRegistered(event: any) {
        const studentId = event.studentId ?? event.id;
        const universityId = event.universityId;

        const user = await this.prisma.user.findUnique({
            where: { id: studentId },
        });

        if (!user) return;

        // Notification for student
        await this.notificationService.createNotification(
            user.id,
            'Application received',
            'Your application is pending review.',
            NotificationType.APPLICATION,
        );

        const profileUrl = `${this.frontendUrl()}/student/profile`;

        try {
            // 1. Build the modern email HTML
            const modernHtml = buildApplicationReceivedEmail(
                user,          // { firstName, email }
                profileUrl     // The profile URL
            );

            // 2. Send it with a better subject line
            await this.emailService.sendMail(
                user.email,
                '📬 Application received – pending review', // Catchy subject
                modernHtml,
            );
        } catch (err) {
            this.logger.error('Failed sending registration email', err as any);
        }

        // const html = emailLayout(`
        //     <h2>Application Received</h2>
        //     <p>Hello ${user.firstName},</p>
        //     <p>Your application has been received and is now <strong>pending review</strong>.</p>
        //     ${button(profileUrl, 'View Profile')}
        // `);

        // try {
        //     await this.emailService.sendMail(
        //         user.email,
        //         'Application received',
        //         html,
        //     );
        // } catch (err) {
        //     this.logger.error('Failed sending registration email', err as any);
        // }

        // Notify university admins
        const admins = await this.prisma.user.findMany({
            where: { role: 'UNIVERSITY_ADMIN', universityId },
        });

        for (const admin of admins) {
            await this.notificationService.createNotification(
                admin.id,
                'New application received',
                `New application from ${user.firstName} ${user.lastName}`,
                NotificationType.APPLICATION,
            );

            const adminHtml = emailLayout(`
                <h2>New Student Application</h2>
                <p>A new student applied to your university.</p>
            `);

            try {
                await this.emailService.sendMail(
                    admin.email,
                    'New student application',
                    adminHtml,
                );
            } catch (err) {
                this.logger.error('Failed sending admin email', err as any);
            }
        }
    }

    // ---------------- APPROVED ----------------
    @OnEvent('student.approved')
    async handleApproved(event: any) {
        const userId = event.userId ?? event.studentId;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) return;

        await this.notificationService.createNotification(
            user.id,
            'Application approved',
            'Your application has been approved.',
            NotificationType.SYSTEM,
        );

        const frontend = this.frontendUrl();
        // const loginUrl = `${frontend}/login`;

        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/profile`

        let approverText = '';

        if (event.adminId) {
            const admin = await this.prisma.user.findUnique({
                where: { id: event.adminId },
            });

            if (admin) {
                approverText = ` by ${admin.firstName} ${admin.lastName}`;
            }
        }


        try {
            // 1. Build the modern email HTML
            const modernHtml = buildApplicationApprovedEmail(
                user,                // { firstName, email }
                approverText,        // e.g., " by John Doe" or ""
                loginUrl             // The login URL
            );

            // 2. Send it with a better subject line
            await this.emailService.sendMail(
                user.email,
                'Application status update – Your application has been approved!', // Catchy subject
                modernHtml,
            );
        } catch (err) {
            this.logger.error('Failed sending approval email', err as any);
        }

        
        // const html = emailLayout(`
        //     <h2 style="color:green;">Application Approved</h2>
        //     <p>Hi ${user.firstName},</p>
        //     <p>Your application has been <strong>approved</strong>${approverText}.</p>
        //     ${button(loginUrl, 'Login')}
        // `);

        // try {
        //     void this.emailService.sendMail(
        //         user.email,
        //         'Application approved',
        //         html,
        //     );
        // } catch (err) {
        //     this.logger.error('Failed sending approval email', err as any);
        // }

        // Notify admins
        try {
            const profile = await this.prisma.studentProfile.findUnique({
                where: { userId },
            });

            if (!profile) return;

            const admins = await this.prisma.user.findMany({
                where: {
                    role: 'UNIVERSITY_ADMIN',
                    universityId: profile.universityId,
                },
            });

            for (const admin of admins) {
                await this.notificationService.createNotification(
                    admin.id,
                    'Student approved',
                    `Student ${user.firstName} ${user.lastName} approved.`,
                    NotificationType.SYSTEM,
                );
            }
        } catch (err) {
            this.logger.error('Error notifying admins', err as any);
        }
    }

    // ---------------- REJECTED ----------------
    @OnEvent('student.rejected')
    async handleRejected(event: any) {
        const userId = event.userId ?? event.studentId;
        const reason = event.reason ?? '';

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) return;

        await this.notificationService.createNotification(
            user.id,
            'Application rejected',
            `Reason: ${reason}`,
            NotificationType.SYSTEM,
        );

        const frontend = this.frontendUrl();
        const profileUrl = `${frontend}/profile`;

        let approverText = '';

        if (event.adminId) {
            const admin = await this.prisma.user.findUnique({
                where: { id: event.adminId },
            });

            if (admin) {
                approverText = ` by ${admin.firstName} ${admin.lastName}`;
            }
        }


        try {
            // 1. Build the modern email HTML
            const modernHtml = buildApplicationRejectedEmail(
                user,           // { firstName, email }
                approverText,   // e.g., " by John Doe" or ""
                reason,         // The rejection reason (string or null)
                profileUrl      // The URL to update/re-upload
            );

            // 2. Send it with a clearer subject line
            await this.emailService.sendMail(
                user.email,
                'Application status update – Please review', // Empathetic but clear subject
                modernHtml,
            );
        } catch (err) {
            this.logger.error('Failed sending rejection email', err as any);
        }
        
        // const html = emailLayout(`
        //     <h2 style="color:red;">Application Rejected</h2>
        //     <p>Hi ${user.firstName},</p>
        //     <p>Your application was not approved${approverText}.</p>
        //     <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
        //     ${button(profileUrl, 'Update / Re-upload Document', '#EF4444')}
        // `);

        // try {
        //     await this.emailService.sendMail(
        //         user.email,
        //         'Application rejected',
        //         html,
        //     );
        // } catch (err) {
        //     this.logger.error('Failed sending rejection email', err as any);
        // }
    }

    // ---------------- DOCUMENT REUPLOAD ----------------
    @OnEvent('student.document.reuploaded')
    async handleDocumentReuploaded(event: any) {
        const userId = event.studentId;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) return;

        await this.notificationService.createNotification(
            user.id,
            'Document received',
            'Your document is under review.',
            NotificationType.APPLICATION,
        );

        const profileUrl = `${this.frontendUrl()}/profile`;

        const html = emailLayout(`
            <h2>Document Received</h2>
            <p>Hello ${user.firstName},</p>
            <p>Your updated document has been received and is under review.</p>
            ${button(profileUrl, 'View Profile')}
        `);

        try {
            await this.emailService.sendMail(
                user.email,
                'Document received',
                html,
            );
        } catch (err) {
            this.logger.error('Failed sending reupload email', err as any);
        }
    }
}

// import { Injectable, Logger } from '@nestjs/common';
// import { OnEvent } from '@nestjs/event-emitter';
// import { DatabaseService } from '../../../database/database.service';
// import { EmailService } from '../../../common/services/email.service';
// import { NotificationService } from '../../../common/services/notification.service';
// import { StudentRegisteredEvent } from '../events/student-registered.event';
// import { StudentApprovedEvent } from '../events/student-approved.event';
// import { StudentRejectedEvent } from '../events/student-rejected.event';
// import { NotificationType } from '@prisma/client';

// @Injectable()
// export class StudentEventsListener {
//     private readonly logger = new Logger(StudentEventsListener.name);

//     constructor(
//         private prisma: DatabaseService,
//         private emailService: EmailService,
//         private notificationService: NotificationService,
//     ) { }

//     @OnEvent('student.registered')
//     async handleRegistered(event: StudentRegisteredEvent | any) {
//         // event can be StudentRegisteredEvent or simple object
//         const studentId = event.studentId ?? event.id ?? event;
//         const universityId = event.universityId ?? event.universityId;

//         const user = await this.prisma.user.findUnique({ where: { id: studentId } });
//         if (!user) return;

//         // create notification for student
//         await this.notificationService.createNotification(
//             user.id,
//             'Application received',
//             'Your application has been received and is pending review.',
//             NotificationType.APPLICATION,
//         );

//         // send email to student
//         const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
//         const profileUrl = `${frontend}/profile`;
//         const html = `<p>Hello ${user.firstName},</p>
//     <p>Your application has been received and is currently <strong>PENDING</strong>.</p>
//     <p><a href="${profileUrl}">Go to your profile</a></p>`;

//         try {
//             await this.emailService.sendMail(user.email, 'Application received', html);
//         } catch (err) {
//             this.logger.error('Failed sending registration email', err as any);
//         }

//         // notify university admins
//         const admins = await this.prisma.user.findMany({ where: { role: 'UNIVERSITY_ADMIN', universityId } });
//         for (const admin of admins) {
//             await this.notificationService.createNotification(
//                 admin.id,
//                 'New application received',
//                 `New student application from ${user.firstName} ${user.lastName}`,
//                 NotificationType.APPLICATION,
//             );

//             const adminHtml = `<p>Hello ${admin.firstName},</p><p>A new student has applied to your university. Review pending applications in the admin panel.</p>`;
//             try {
//                 await this.emailService.sendMail(admin.email, 'New student application', adminHtml);
//             } catch (err) {
//                 this.logger.error('Failed sending admin notification email', err as any);
//             }
//         }
//     }

//     @OnEvent('student.approved')
//     async handleApproved(event: StudentApprovedEvent | any) {
//         const userId = event.userId ?? event.studentId ?? event;
//         const user = await this.prisma.user.findUnique({ where: { id: userId } });
//         if (!user) return;

//         await this.notificationService.createNotification(
//             user.id,
//             'Application approved',
//             'Your application has been approved. You can now access the platform.',
//             NotificationType.SYSTEM,
//         );

//         const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
//         const loginUrl = `${frontend}/login`;
//         const html = `<p>Hi ${user.firstName},</p><p>Your application has been <strong>approved</strong>.</p><p><a href="${loginUrl}">Login</a></p>`;
//         try {
//             await this.emailService.sendMail(user.email, 'Your application has been approved', html);
//         } catch (err) {
//             this.logger.error('Failed sending approval email', err as any);
//         }
//         // notify university admins about the approval
//         try {
//             // fetch student profile to get university
//             const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
//             if (profile) {
//                 const admins = await this.prisma.user.findMany({ where: { role: 'UNIVERSITY_ADMIN', universityId: profile.universityId } });
//                 for (const admin of admins) {
//                     // create notification for admin
//                     await this.notificationService.createNotification(
//                         admin.id,
//                         'Student approved',
//                         `Student ${user.firstName} ${user.lastName} was approved.`,
//                         NotificationType.SYSTEM,
//                     );

//                     const adminHtml = `<p>Hi ${admin.firstName},</p><p>Student ${user.firstName} ${user.lastName} has been approved.</p>`;
//                     try {
//                         await this.emailService.sendMail(admin.email, 'Student approved', adminHtml);
//                     } catch (err) {
//                         this.logger.error('Failed sending admin approval email', err as any);
//                     }
//                 }
//             }
//         } catch (err) {
//             this.logger.error('Error notifying admins about approval', err as any);
//         }
//     }

//     @OnEvent('student.rejected')
//     async handleRejected(event: StudentRejectedEvent | any) {
//         const userId = event.userId ?? event.studentId ?? event;
//         const reason = event.reason ?? event.rejectionReason ?? '';
//         const user = await this.prisma.user.findUnique({ where: { id: userId } });
//         if (!user) return;

//         await this.notificationService.createNotification(
//             user.id,
//             'Application rejected',
//             `Your application was not approved. Reason: ${reason}`,
//             NotificationType.SYSTEM,
//         );

//         const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
//         const profileUrl = `${frontend}/profile`;
//         const html = `<p>Hi ${user.firstName},</p><p>Your application was not approved.</p><p>Reason: ${reason}</p><p><a href="${profileUrl}">Re-upload document</a></p>`;
//         try {
//             await this.emailService.sendMail(user.email, 'Your application was not approved', html);
//         } catch (err) {
//             this.logger.error('Failed sending rejection email', err as any);
//         }

//         // notify university admins about the rejection
//         try {
//             const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
//             if (profile) {
//                 const admins = await this.prisma.user.findMany({ where: { role: 'UNIVERSITY_ADMIN', universityId: profile.universityId } });
//                 for (const admin of admins) {
//                     await this.notificationService.createNotification(
//                         admin.id,
//                         'Student rejected',
//                         `Student ${user.firstName} ${user.lastName} was rejected. Reason: ${reason}`,
//                         NotificationType.SYSTEM,
//                     );

//                     const adminHtml = `<p>Hi ${admin.firstName},</p><p>Student ${user.firstName} ${user.lastName} has been rejected.</p><p>Reason: ${reason}</p>`;
//                     try {
//                         await this.emailService.sendMail(admin.email, 'Student rejected', adminHtml);
//                     } catch (err) {
//                         this.logger.error('Failed sending admin rejection email', err as any);
//                     }
//                 }
//             }
//         } catch (err) {
//             this.logger.error('Error notifying admins about rejection', err as any);
//         }
//     }

//     @OnEvent('student.document.reuploaded')
//     async handleDocumentReuploaded(event: any) {
//         const studentId = event.studentId;
//         const user = await this.prisma.user.findUnique({ where: { id: studentId } });
//         if (!user) return;

//         await this.notificationService.createNotification(
//             user.id,
//             'Application received',
//             'Your updated document has been received and is pending review.',
//             NotificationType.APPLICATION,
//         );

//         const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
//         const profileUrl = `${frontend}/profile`;
//         const html = `<p>Hello ${user.firstName},</p><p>Your updated document has been received and is pending review.</p><p><a href="${profileUrl}">Go to your profile</a></p>`;
//         try {
//             await this.emailService.sendMail(user.email, 'Application received', html);
//         } catch (err) {
//             this.logger.error('Failed sending reupload email', err as any);
//         }
//     }
// }
