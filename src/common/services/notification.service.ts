import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { WebSocketService } from './websocket.service';

@Injectable()
export class SharedNotificationService {
    constructor(
        private readonly prisma: DatabaseService,
        private readonly websocketService: WebSocketService,
    ) { }

    async createAndEmit(userId: number, title: string, body: string, type: NotificationType = NotificationType.SYSTEM, metadata?: any) {
        const notification = await this.prisma.notification.create({
            data: {
                userId,
                title,
                body,
                type,
            },
        });

        this.websocketService.sendToUser(userId, 'notification', {
            id: notification.id,
            title: notification.title,
            body: notification.body,
            type: notification.type,
            metadata: metadata ?? {},
        });

        return notification;
    }

    async getUnreadCount(userId: number) {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
}
