import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TasksService {
    constructor(private readonly prisma: DatabaseService) { }

    async create(trainerId: number, dto: any) {
        const internship = await this.prisma.internship.findFirst({
            where: { trainerId, id: dto.internshipId },
        });

        if (!internship) throw new NotFoundException('Internship not found for this trainer');

        return this.prisma.task.create({
            data: {
                internshipId: dto.internshipId,
                title: dto.title,
                description: dto.description,
                deadline: dto.deadline ? new Date(dto.deadline) : undefined,
                status: dto.status ?? 'TODO',
            },
        });
    }

    async list(trainerId: number, traineeId?: number, status?: string) {
        return this.prisma.task.findMany({
            where: {
                internship: { trainerId },
                ...(traineeId ? { submissions: { some: { studentId: traineeId } } } : {}),
                ...(status ? { status: status as any } : {}),
            },
            include: { submissions: true },
        });
    }

    async findOne(id: number) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: { submissions: true, internship: true },
        });

        if (!task) throw new NotFoundException('Task not found');
        return task;
    }

    async update(id: number, dto: any) {
        return this.prisma.task.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: number) {
        await this.prisma.task.delete({ where: { id } }).catch(() => undefined);
        return { deleted: true, id };
    }

    async assign(id: number, traineeId: number) {
        const task = await this.findOne(id);
        const submission = await this.prisma.taskSubmission.findFirst({
            where: { taskId: id, studentId: traineeId },
        });

        if (!submission) {
            await this.prisma.taskSubmission.create({
                data: {
                    taskId: id,
                    studentId: traineeId,
                },
            });
        }

        return { assigned: true, taskId: id, traineeId };
    }

    async unassign(id: number, traineeId: number) {
        await this.prisma.taskSubmission.deleteMany({
            where: { taskId: id, studentId: traineeId },
        });

        return { unassigned: true, taskId: id, traineeId };
    }

    async uploadAttachment(taskId: number, trainerId: number, file: Express.Multer.File) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { internship: true },
        });

        if (!task) throw new NotFoundException('Task not found');
        if (task.internship.trainerId !== trainerId) {
            throw new NotFoundException('Task does not belong to this trainer');
        }
        if (!file) throw new NotFoundException('File is required');

        const uploadDir = path.join(process.env.UPLOAD_PATH || './uploads', 'tasks', String(taskId));
        fs.mkdirSync(uploadDir, { recursive: true });

        const extension = path.extname(file.originalname || 'attachment');
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;
        const fullPath = path.join(uploadDir, filename);
        fs.writeFileSync(fullPath, file.buffer);

        const attachmentUrl = `${process.env.BASE_URL || 'http://localhost:6060'}/api/v1/files/task/${taskId}/${filename}`;

        return {
            taskId,
            filename,
            url: attachmentUrl,
            path: fullPath,
            uploadedAt: new Date().toISOString(),
        };
    }
}
