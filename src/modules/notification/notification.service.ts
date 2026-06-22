import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
    constructor(private readonly prisma: DatabaseService) { }

    async createNotification(userId: number, title: string, body: string, type: NotificationType = NotificationType.SYSTEM) {
        return this.prisma.notification.create({
            data: {
                userId,
                title,
                body,
                type,
            },
        });
    }
}
