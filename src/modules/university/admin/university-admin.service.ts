import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { hashPassword } from 'src/modules/auth/utils/crypto.util';
import { CreateSupervisorDto } from './dto/create-supervisor.dto';

@Injectable()
export class UniversityAdminService {
    constructor(private readonly prisma: DatabaseService) { }

    async getDashboard(universityId: number) {
        const [students, supervisors, internships, pendingApprovals] = await Promise.all([
            this.prisma.studentProfile.count({ where: { universityId } }),
            this.prisma.universitySupervisorProfile.count({ where: { universityId } }),
            this.prisma.internship.count({ where: { universityId } }),
            this.prisma.studentProfile.count({
                where: { universityId, approvalStatus: 'PENDING' },
            }),
        ]);

        return {
            universityId,
            students,
            supervisors,
            internships,
            pendingApprovals,
            generatedAt: new Date().toISOString(),
        };
    }

    async listStudents(universityId: number) {
        return this.prisma.studentProfile.findMany({
            where: { universityId },
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
            orderBy: { userId: 'asc' },
        });
    }

    async listSupervisors(universityId: number) {
        return this.prisma.universitySupervisorProfile.findMany({
            where: { universityId },
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
            orderBy: { userId: 'asc' },
        });
    }

    async getStudentDetail(universityId: number, studentId: number) {
        const student = await this.prisma.studentProfile.findFirst({
            where: { universityId, userId: studentId },
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
                internshipStudents: {
                    include: {
                        internship: {
                            include: { company: true, opportunity: true },
                        },
                    },
                },
            },
        });

        if (!student) {
            throw new NotFoundException('Student not found for this university');
        }

        return student;
    }

    async createSupervisor(universityId: number, dto: CreateSupervisorDto) {
        const normalizedEmail = dto.email.trim().toLowerCase();

        const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            throw new BadRequestException('A user with this email already exists');
        }

        const personalID = dto.personalID ?? Math.floor(100000000 + Math.random() * 900000000);

        const user = await this.prisma.user.create({
            data: {
                email: normalizedEmail,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                password: await hashPassword(dto.password),
                personalID,
                role: UserRole.UNIVERSITY_SUPERVISOR,
                universityId,
                isActive: true,
            },
        });

        const profile = await this.prisma.universitySupervisorProfile.create({
            data: {
                userId: user.id,
                universityId,
                department: dto.department,
            },
            include: { user: true },
        });

        return {
            ...profile,
            user: {
                id: profile.user.id,
                firstName: profile.user.firstName,
                lastName: profile.user.lastName,
                email: profile.user.email,
                phone: profile.user.phone,
                role: profile.user.role,
                universityId: profile.user.universityId,
                isActive: profile.user.isActive,
            },
        };
    }

    async assignSupervisorToStudent(universityId: number, supervisorId: number, studentId: number) {
        const supervisor = await this.prisma.universitySupervisorProfile.findUnique({
            where: { userId: supervisorId },
        });

        if (!supervisor || supervisor.universityId !== universityId) {
            throw new NotFoundException('Supervisor not found in the university');
        }

        const student = await this.prisma.studentProfile.findUnique({ where: { userId: studentId } });
        if (!student || student.universityId !== universityId) {
            throw new NotFoundException('Student not found in the university');
        }

        return this.prisma.supervisorStudent.upsert({
            where: {
                supervisorId_studentId: { supervisorId, studentId },
            },
            update: {},
            create: {
                supervisorId,
                studentId,
            },
        });
    }
}
