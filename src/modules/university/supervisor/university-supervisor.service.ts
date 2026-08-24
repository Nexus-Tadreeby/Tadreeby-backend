import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EvaluationType } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { CreateSupervisorEvaluationDto } from './dto/create-evaluation.dto';

@Injectable()
export class UniversitySupervisorService {
    constructor(private readonly prisma: DatabaseService) { }

    async getDashboard(universityId: number, supervisorId: number) {
        const [assignedStudents, activeInternships, pendingReviews] = await Promise.all([
            this.prisma.supervisorStudent.count({ where: { supervisorId } }),
            this.prisma.internship.count({ where: { universityId, supervisorId } }),
            this.prisma.evaluation.count({
                where: { internship: { universityId }, type: 'SUPERVISOR' },
            }),
        ]);

        return {
            universityId,
            supervisorId,
            assignedStudents,
            activeInternships,
            pendingReviews,
            generatedAt: new Date().toISOString(),
        };
    }

    async listStudents(universityId: number, supervisorId: number) {
        return this.prisma.supervisorStudent.findMany({
            where: { supervisorId, student: { universityId } },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                                isActive: true,
                            },
                        },
                    },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });
    }

    async getStudentDetail(universityId: number, supervisorId: number, studentId: number) {
        const assignment = await this.prisma.supervisorStudent.findFirst({
            where: { supervisorId, studentId, student: { universityId } },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                                isActive: true,
                            },
                        },
                        internships: {
                            include: {
                                internship: {
                                    include: { company: true, opportunity: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!assignment) {
            throw new NotFoundException('Student not assigned to this supervisor');
        }

        return assignment.student;
    }

    async addSupervisorNote(universityId: number, supervisorId: number, studentId: number, notes: string) {
        const assignment = await this.prisma.supervisorStudent.findFirst({
            where: { supervisorId, studentId, student: { universityId } },
        });

        if (!assignment) {
            throw new NotFoundException('Student not assigned to this supervisor');
        }

        return this.prisma.supervisorStudent.update({
            where: { id: assignment.id },
            data: { notes },
        });
    }

    async createEvaluation(supervisorId: number, universityId: number, dto: CreateSupervisorEvaluationDto) {
        const student = await this.prisma.studentProfile.findUnique({
            where: { userId: dto.studentId },
            select: { userId: true, universityId: true },
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        if (student.universityId !== universityId) {
            throw new BadRequestException('Student does not belong to this university');
        }

        const internship = await this.prisma.internship.findFirst({
            where: {
                id: dto.internshipId,
                universityId,
                supervisorId,
            },
        });

        if (!internship) {
            throw new NotFoundException('Internship not found for this supervisor');
        }

        const assignment = await this.prisma.internshipStudent.findFirst({
            where: {
                internshipId: dto.internshipId,
                studentId: dto.studentId,
            },
        });

        if (!assignment) {
            throw new BadRequestException('Student is not assigned to this internship');
        }

        return this.prisma.evaluation.create({
            data: {
                internshipId: dto.internshipId,
                studentId: dto.studentId,
                evaluatorId: supervisorId,
                type: EvaluationType.SUPERVISOR,
                score: dto.score,
                feedback: dto.feedback ?? null,
            },
            include: {
                evaluator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                internship: true,
                student: true,
            },
        });
    }
}
