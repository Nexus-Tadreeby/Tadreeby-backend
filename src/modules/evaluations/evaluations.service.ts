import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class EvaluationsService {
    constructor(private readonly prisma: DatabaseService) { }

    async create(evaluatorId: number, dto: any) {
        return this.prisma.evaluation.create({
            data: {
                internshipId: dto.internshipId,
                studentId: dto.studentId,
                evaluatorId,
                type: dto.type ?? 'TRAINER',
                score: dto.score,
                feedback: dto.feedback,
            },
        });
    }

    async list(trainerId: number, traineeId?: number) {
        return this.prisma.evaluation.findMany({
            where: {
                evaluatorId: trainerId,
                ...(traineeId ? { studentId: traineeId } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number) {
        const item = await this.prisma.evaluation.findUnique({ where: { id } });
        if (!item) throw new NotFoundException('Evaluation not found');
        return item;
    }

    async update(id: number, trainerId: number, dto: any) {
        const item = await this.prisma.evaluation.findFirst({ where: { id, evaluatorId: trainerId } });
        if (!item) throw new NotFoundException('Evaluation not found');

        return this.prisma.evaluation.update({
            where: { id },
            data: dto,
        });
    }

    async summary(studentId: number, trainerId: number) {
        const items = await this.prisma.evaluation.findMany({
            where: { studentId, evaluatorId: trainerId },
        });

        const avg = items.length
            ? items.reduce((sum, item) => sum + (item.score ?? 0), 0) / items.length
            : 0;

        return {
            studentId,
            totalEvaluations: items.length,
            averageScore: Number(avg.toFixed(2)),
            items,
        };
    }
}
