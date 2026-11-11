import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AttendanceService {
    constructor(private readonly prisma: DatabaseService) { }

    async create(trainerId: number, dto: any) {
        const internship = await this.prisma.internship.findFirst({
            where: { trainerId, id: dto.internshipId },
        });

        if (!internship) throw new NotFoundException('Internship not found for this trainer');

        return this.prisma.attendance.create({
            data: {
                internshipId: dto.internshipId,
                studentId: dto.studentId,
                date: new Date(dto.date),
                status: dto.status,
            },
        });
    }

    async list(trainerId: number, traineeId?: number, from?: Date, to?: Date) {
        return this.prisma.attendance.findMany({
            where: {
                internship: { trainerId },
                ...(traineeId ? { studentId: traineeId } : {}),
                ...(from || to ? { date: { gte: from, lte: to } } : {}),
            },
            orderBy: { date: 'desc' },
        });
    }

    async monthlySummary(studentId: number, trainerId: number) {
        const items = await this.prisma.attendance.findMany({
            where: { studentId, internship: { trainerId } },
            orderBy: { date: 'desc' },
        });

        return {
            studentId,
            total: items.length,
            records: items,
        };
    }

    async update(id: number, trainerId: number, dto: any) {
        const record = await this.prisma.attendance.findFirst({ where: { id, internship: { trainerId } } });
        if (!record) throw new NotFoundException('Attendance record not found');

        return this.prisma.attendance.update({
            where: { id },
            data: dto,
        });
    }

    async verify(id: number, trainerId: number) {
        const record = await this.prisma.attendance.findFirst({ where: { id, internship: { trainerId } } });
        if (!record) throw new NotFoundException('Attendance record not found');

        return this.prisma.attendance.update({
            where: { id },
            data: { status: 'MARKED_PRESENT' },
        });
    }

    async bulkVerify(ids: number[], trainerId: number) {
        return this.prisma.attendance.updateMany({
            where: { id: { in: ids }, internship: { trainerId } },
            data: { status: 'MARKED_PRESENT' },
        });
    }
}
