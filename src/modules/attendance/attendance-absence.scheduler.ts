import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AttendanceStatus, InternshipStatus } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';

const WEEKDAYS: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
};

@Injectable()
export class AttendanceAbsenceScheduler {
    private readonly logger = new Logger(AttendanceAbsenceScheduler.name);

    constructor(private readonly prisma: DatabaseService) { }

    // Runs at local midnight, after the scheduled attendance day has ended.
    @Cron('0 0 * * *')
    async markMissedAttendance(): Promise<void> {
        const today = this.startOfDay(new Date());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const internships = await this.prisma.internship.findMany({
            where: { status: InternshipStatus.ACTIVE },
            select: {
                id: true,
                startDate: true,
                endDate: true,
                opportunity: { select: { workDays: true } },
                students: {
                    select: { studentId: true, createdAt: true },
                },
            },
        });

        for (const internship of internships) {
            const scheduledDays = this.parseWorkDays(internship.opportunity.workDays);
            if (scheduledDays.size === 0) continue;

            for (const enrollment of internship.students) {
                const enrolledOn = this.startOfDay(enrollment.createdAt);
                const internshipStarts = internship.startDate
                    ? this.startOfDay(internship.startDate)
                    : enrolledOn;
                const firstDay = enrolledOn > internshipStarts ? enrolledOn : internshipStarts;
                const lastDay = internship.endDate
                    ? this.startOfDay(internship.endDate)
                    : yesterday;
                const throughDay = lastDay < yesterday ? lastDay : yesterday;

                for (let date = new Date(firstDay); date <= throughDay; date.setDate(date.getDate() + 1)) {
                    if (!scheduledDays.has(date.getDay())) continue;

                    const nextDay = new Date(date);
                    nextDay.setDate(nextDay.getDate() + 1);
                    const existing = await this.prisma.attendance.findFirst({
                        where: {
                            internshipId: internship.id,
                            studentId: enrollment.studentId,
                            date: { gte: date, lt: nextDay },
                        },
                        select: { id: true },
                    });

                    if (!existing) {
                        await this.prisma.attendance.create({
                            data: {
                                internshipId: internship.id,
                                studentId: enrollment.studentId,
                                date: new Date(date),
                                status: AttendanceStatus.MARKED_ABSENT,
                                notes: 'Automatically marked absent: no attendance was recorded for the scheduled workday.',
                            },
                        });
                    }
                }
            }
        }

        this.logger.log(`Processed missed attendance through ${yesterday.toDateString()}`);
    }

    private parseWorkDays(workDays: string | null): Set<number> {
        if (!workDays) return new Set();

        const days = workDays.toLowerCase().match(/[a-z]+/g) ?? [];
        return new Set(
            days
                .map((day) => WEEKDAYS[day.slice(0, 3)])
                .filter((day): day is number => day !== undefined),
        );
    }

    private startOfDay(date: Date): Date {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        return start;
    }
}
