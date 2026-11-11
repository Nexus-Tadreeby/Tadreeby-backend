import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AuditService {
    constructor(private readonly prisma: DatabaseService) { }

    async logAction(data: {
        userId: number;
        action: string;
        target?: string;
        details?: any;
        companyId?: number;
        universityId?: number;
    }) {
        await this.prisma.userActivityLog.create({
            data: {
                userId: data.userId,
                action: data.action as any,
                deviceInfo: data.details ? JSON.stringify(data.details) : null,
                userAgent: data.target ?? 'system',
            },
        }).catch(() => undefined);
    }
}
