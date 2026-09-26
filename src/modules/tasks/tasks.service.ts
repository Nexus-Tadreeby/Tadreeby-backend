import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import * as fs from 'fs';
import * as path from 'path';
import { TaskDifficulty } from './dto/create-task.dto';
import { SubmissionType, TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
    constructor(private readonly prisma: DatabaseService) { }
    async create(trainerId: number, dto: any) {
        const internship = await this.prisma.internship.findFirst({
            where: { trainerId, id: dto.internshipId },
        });
        if (!internship) {
            throw new NotFoundException('Internship not found for this trainer');
        }

        if (dto.acceptedSubmissionTypes) {
            if (!Array.isArray(dto.acceptedSubmissionTypes)) {
                throw new BadRequestException('acceptedSubmissionTypes must be an array');
            }
            const validTypes = Object.values(SubmissionType);
            const invalid = dto.acceptedSubmissionTypes.filter(
                (t: string) => !validTypes.includes(t as SubmissionType),
            );
            if (invalid.length > 0) {
                throw new BadRequestException(
                    `Invalid submission types: ${invalid.join(', ')}. Allowed: ${validTypes.join(', ')}`,
                );
            }
        }

        if (dto.difficulty) {
            const validDifficulties = Object.values(TaskDifficulty);
            if (!validDifficulties.includes(dto.difficulty)) {
                throw new BadRequestException(
                    `Invalid difficulty. Allowed: ${validDifficulties.join(', ')}`,
                );
            }
        }

        if (dto.status) {
            const validStatuses = Object.values(TaskStatus);
            if (!validStatuses.includes(dto.status)) {
                throw new BadRequestException(
                    `Invalid status. Allowed: ${validStatuses.join(', ')}`,
                );
            }
        }

        const criteria = dto.evaluationCriteria ?? [];
        if (!Array.isArray(criteria)) {
            throw new BadRequestException('evaluationCriteria must be an array');
        }
        if (criteria.length > 0) {
            for (const c of criteria) {
                if (!c.name || typeof c.name !== 'string') {
                    throw new BadRequestException('Each criterion must have a name');
                }
                if (typeof c.weight !== 'number' || c.weight < 0 || c.weight > 100) {
                    throw new BadRequestException(
                        'Each criterion weight must be a number between 0 and 100',
                    );
                }
            }
            const total = criteria.reduce((sum: number, c: any) => sum + c.weight, 0);
            if (total !== 100) {
                throw new BadRequestException(
                    `Total criteria weight must equal 100, got ${total}`,
                );
            }
        }

        return this.prisma.task.create({
            data: {
                internshipId: dto.internshipId,
                title: dto.title,
                description: dto.description ?? null,

                category: dto.category ?? null,
                difficulty: dto.difficulty ?? TaskDifficulty.INTERMEDIATE,
                skills: Array.isArray(dto.skills) ? dto.skills : [],
                instructions: dto.instructions ?? null,
                deliverables: Array.isArray(dto.deliverables) ? dto.deliverables : [],

                startDate: dto.startDate ? new Date(dto.startDate) : null,
                deadline: dto.deadline ? new Date(dto.deadline) : null,
                acceptedSubmissionTypes: dto.acceptedSubmissionTypes ?? [],
                allowLateSubmission: dto.allowLateSubmission ?? false,

                status: dto.status ?? TaskStatus.TODO,
                badge: dto.badge ?? null,
                rubricUrl: dto.rubricUrl ?? null,
                rubric: dto.rubric ?? null,

                evaluationCriteria: criteria.length
                    ? {
                        create: criteria.map((c: any) => ({
                            name: c.name,
                            weight: c.weight,
                        })),
                    }
                    : undefined,
            },
            include: {
                evaluationCriteria: true,
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

    // async update(id: number, dto: any) {
    //     return this.prisma.task.update({
    //         where: { id },
    //         data: dto,
    //     });
    // }

    async update(id: number, dto: any) {
        // Trainer-only updates; you can add validation here
        return this.prisma.task.update({
            where: { id },
            data: {
                title: dto.title,
                description: dto.description,
                deadline: dto.deadline ? new Date(dto.deadline) : undefined,
                status: dto.status,
            },
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
