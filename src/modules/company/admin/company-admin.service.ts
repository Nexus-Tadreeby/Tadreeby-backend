import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import * as argon2 from 'argon2';

@Injectable()
export class CompanyAdminService {
    constructor(private readonly prisma: DatabaseService) { }

    async createOpportunity(companyId: number, dto: any) {
        return this.prisma.trainingOpportunity.create({
            data: {
                companyId,
                title: dto.title,
                description: dto.description,
                requiredSkills: dto.requiredSkills,
                duration: dto.duration,
                totalSeats: Number(dto.totalSeats),
                location: dto.location,
                meetingLink: dto.meetingLink,
                type: dto.type,
                isActive: dto.isActive ?? true,
            },
        });
    }

    async listOpportunities(companyId: number, page: number, limit: number) {
        const [data, total] = await Promise.all([
            this.prisma.trainingOpportunity.findMany({
                where: { companyId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { id: 'desc' },
            }),
            this.prisma.trainingOpportunity.count({ where: { companyId } }),
        ]);

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        };
    }

    async findOpportunity(id: number, companyId: number) {
        const item = await this.prisma.trainingOpportunity.findFirst({
            where: { id, companyId },
            include: { applications: true },
        });

        if (!item) throw new NotFoundException('Training opportunity not found');
        return item;
    }

    async updateOpportunity(id: number, companyId: number, dto: any) {
        const existing = await this.prisma.trainingOpportunity.findFirst({ where: { id, companyId } });
        if (!existing) throw new NotFoundException('Training opportunity not found');

        return this.prisma.trainingOpportunity.update({
            where: { id },
            data: dto,
        });
    }

    async deleteOpportunity(id: number, companyId: number) {
        const existing = await this.prisma.trainingOpportunity.findFirst({ where: { id, companyId } });
        if (!existing) throw new NotFoundException('Training opportunity not found');

        await this.prisma.trainingOpportunity.delete({ where: { id } });
        return { deleted: true, id };
    }

    async setOpportunityStatus(id: number, companyId: number, isActive: boolean) {
        const existing = await this.prisma.trainingOpportunity.findFirst({ where: { id, companyId } });
        if (!existing) throw new NotFoundException('Training opportunity not found');

        return this.prisma.trainingOpportunity.update({
            where: { id },
            data: { isActive },
        });
    }

    async createTrainer(companyId: number, dto: any) {
        const password = dto.password ?? 'Password123!';
        const hashedPassword = await argon2.hash(password);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                firstName: dto.firstName,
                lastName: dto.lastName,
                personalID: Number(dto.personalID),
                phone: dto.phone,
                role: UserRole.COMPANY_TRAINER,
                companyId,
                isActive: dto.isActive ?? true,
            },
        });

        return this.prisma.companyTrainerProfile.create({
            data: {
                userId: user.id,
                companyId,
                position: dto.position,
                specialization: dto.specialization,
            },
            include: { user: true },
        });
    }

    async listTrainers(companyId: number, page: number, limit: number) {
        const [data, total] = await Promise.all([
            this.prisma.companyTrainerProfile.findMany({
                where: { companyId },
                include: { user: true },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.companyTrainerProfile.count({ where: { companyId } }),
        ]);

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        };
    }

    async findTrainer(id: number, companyId: number) {
        const item = await this.prisma.companyTrainerProfile.findFirst({
            where: { userId: id, companyId },
            include: { user: true },
        });

        if (!item) throw new NotFoundException('Trainer not found');
        return item;
    }

    async updateTrainer(id: number, companyId: number, dto: any) {
        const trainer = await this.prisma.companyTrainerProfile.findFirst({ where: { userId: id, companyId } });
        if (!trainer) throw new NotFoundException('Trainer not found');

        return this.prisma.companyTrainerProfile.update({
            where: { userId: id },
            data: {
                position: dto.position,
                specialization: dto.specialization,
            },
            include: { user: true },
        });
    }

    async activateTrainer(id: number, companyId: number) {
        const trainer = await this.prisma.companyTrainerProfile.findFirst({ where: { userId: id, companyId }, include: { user: true } });
        if (!trainer) throw new NotFoundException('Trainer not found');

        return this.prisma.user.update({
            where: { id },
            data: { isActive: true },
        });
    }

    async deactivateTrainer(id: number, companyId: number) {
        const trainer = await this.prisma.companyTrainerProfile.findFirst({ where: { userId: id, companyId }, include: { user: true } });
        if (!trainer) throw new NotFoundException('Trainer not found');

        return this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async assignTrainees(id: number, companyId: number, traineeIds: number[]) {
        const trainer = await this.prisma.companyTrainerProfile.findFirst({ where: { userId: id, companyId } });
        if (!trainer) throw new NotFoundException('Trainer not found');

        const internships = await this.prisma.internship.findMany({
            where: { companyId, trainerId: id },
            select: { id: true },
        });

        if (!internships.length) {
            throw new BadRequestException('Trainer has no internships assigned');
        }

        return Promise.all(
            traineeIds.map(async (studentId) => {
                const record = await this.prisma.internshipStudent.findFirst({
                    where: { studentId, internshipId: internships[0].id },
                });

                if (!record) {
                    await this.prisma.internshipStudent.create({
                        data: { internshipId: internships[0].id, studentId },
                    });
                }

                return { studentId, assigned: true };
            }),
        );
    }

    async getDashboard(companyId: number) {
        const [totalTrainees, activeInternships, pendingApplications, trainers, opportunities] = await Promise.all([
            this.prisma.internshipStudent.count({
                where: { internship: { companyId } },
            }),
            this.prisma.internship.count({ where: { companyId, status: 'ACTIVE' } }),
            this.prisma.application.count({ where: { opportunity: { companyId }, status: 'PENDING' } }),
            this.prisma.companyTrainerProfile.count({ where: { companyId } }),
            this.prisma.trainingOpportunity.count({ where: { companyId } }),
        ]);

        return {
            totalTrainees,
            activeInternships,
            pendingApplications,
            trainers,
            opportunities,
        };
    }
}
