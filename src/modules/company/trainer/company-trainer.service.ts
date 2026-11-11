import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class CompanyTrainerService {
    constructor(private readonly prisma: DatabaseService) { }

    async getDashboard(trainerId: number, companyId: number) {
        const [allocatedTrainees, activeInternships, tasksDue, tasksDone] = await Promise.all([
            this.prisma.internshipStudent.count({
                where: { internship: { companyId, trainerId } },
            }),
            this.prisma.internship.count({ where: { companyId, trainerId, status: 'ACTIVE' } }),
            this.prisma.task.count({
                where: { internship: { trainerId } },
            }),
            this.prisma.task.count({
                where: { internship: { trainerId }, status: 'DONE' },
            }),
        ]);

        return {
            allocatedTrainees,
            activeInternships,
            tasksDue,
            tasksDone,
        };
    }

    async getTrainees(trainerId: number, companyId: number) {
        return this.prisma.internshipStudent.findMany({
            where: { internship: { companyId, trainerId } },
            include: { student: { include: { user: true } }, internship: true },
        });
    }

    async getTrainee(id: number, trainerId: number, companyId: number) {
        const record = await this.prisma.internshipStudent.findFirst({
            where: { id, internship: { companyId, trainerId } },
            include: { student: { include: { user: true } }, internship: true },
        });

        if (!record) throw new NotFoundException('Trainee not found for this trainer');
        return record;
    }

    async getTraineeProgress(id: number, trainerId: number, companyId: number) {
        const record = await this.prisma.internshipStudent.findFirst({
            where: { id, internship: { companyId, trainerId } },
            include: { internship: { include: { tasks: true } }, student: true },
        });

        if (!record) throw new NotFoundException('Trainee not found');

        const tasks = record.internship.tasks.length;
        const done = record.internship.tasks.filter((task) => task.status === 'DONE').length;

        return {
            traineeId: record.studentId,
            totalTasks: tasks,
            completedTasks: done,
            progress: tasks === 0 ? 0 : (done / tasks) * 100,
        };
    }

    async completeTrainee(id: number, trainerId: number, companyId: number) {
        const record = await this.prisma.internshipStudent.findFirst({
            where: { id, internship: { companyId, trainerId } },
            include: { internship: true },
        });

        if (!record) throw new NotFoundException('Trainee not found');

        return this.prisma.internship.update({
            where: { id: record.internshipId },
            data: { status: 'COMPLETED' },
        });
    }
}
