import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: DatabaseService) { }

    async list(userId: number, read?: boolean) {
        return this.prisma.notification.findMany({
            where: { userId, ...(read !== undefined ? { isRead: read } : {}) },
            orderBy: { createdAt: 'desc' },
        });
    }

    async markRead(id: number, userId: number) {
        const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
        if (!notification) throw new NotFoundException('Notification not found');

        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }

    async markAllRead(userId: number) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    async unreadCount(userId: number) {
        return { count: await this.prisma.notification.count({ where: { userId, isRead: false } }) };
    }
}
