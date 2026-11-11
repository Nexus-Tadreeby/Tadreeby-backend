import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AuditService {
    constructor(private readonly prisma: DatabaseService) { }

    async list(filters: { userId?: number; action?: string; from?: Date; to?: Date }) {
        return this.prisma.userActivityLog.findMany({
            where: {
                ...(filters.userId ? { userId: filters.userId } : {}),
                ...(filters.action ? { action: filters.action as any } : {}),
                ...(filters.from || filters.to
                    ? {
                        createdAt: {
                            ...(filters.from ? { gte: filters.from } : {}),
                            ...(filters.to ? { lte: filters.to } : {}),
                        },
                    }
                    : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
