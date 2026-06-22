import { Injectable, Logger } from '@nestjs/common';

let nodemailer: any;
try {

    nodemailer = require('nodemailer');
} catch (e) {
    nodemailer = null;
}

@Injectable()
export class EmailService {
    private transporter: any;
    private readonly logger = new Logger(EmailService.name);

    constructor() {
        if (nodemailer) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: (process.env.SMTP_SECURE === 'true') || false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            if (this.transporter && typeof this.transporter.verify === 'function') {
                this.transporter.verify((error: any) => {
                    if (error) {
                        this.logger.error('SMTP Error', error);
                    } else {
                        this.logger.log('SMTP Server is ready');
                    }
                });
            }
        }
    }

    async sendMail(to: string, subject: string, html: string, text?: string) {
        if (!this.transporter) {
            this.logger.warn('Nodemailer is not available; skipping sendMail');
            return null;
        }

        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || 'shahdabusharife@gmail.com',
                to,
                subject,
                html,
                text,
            });
            this.logger.log(`Email sent to ${to}: ${info.messageId}`);
            return info;
        } catch (err) {
            this.logger.error('Failed sending email', err);
            throw err;
        }
    }
}
