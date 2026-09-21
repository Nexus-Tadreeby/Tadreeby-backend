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

    async getInternship(id: number, trainerId: number, companyId: number) {
        const internship = await this.prisma.internship.findFirst({
            where: { id, trainerId, companyId },
            include: {
                company: true,
                opportunity: true,
                trainer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                    },
                },
                students: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        profileImage: true,
                                    },
                                },
                                university: {
                                    select: { id: true, name: true, shortCode: true },
                                },
                            },
                        },
                    },
                },
                tasks: {
                    include: { submissions: true },
                    orderBy: { deadline: 'asc' },
                },
                attendance: {
                    orderBy: { date: 'desc' },
                },
                supervisors: {
                    include: {
                        supervisor: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                                profileImage: true,
                                supervisorProfile: { select: { department: true } },
                            },
                        },
                        university: {
                            select: { id: true, name: true, shortCode: true },
                        },
                    },
                },
            },
        });

        if (!internship) {
            throw new NotFoundException('Internship not found for this trainer');
        }

        const students = internship.students;
        const tasks = internship.tasks;
        const attendance = internship.attendance;
        const totalAttendance = attendance.length;
        const presentAttendance = attendance.filter((entry) =>
            entry.status === 'CHECKED_IN' ||
            entry.status === 'CHECKED_OUT' ||
            entry.status === 'MARKED_PRESENT',
        ).length;
        const absentAttendance = attendance.filter((entry) => entry.status === 'MARKED_ABSENT').length;
        const averageAttendanceRate = students.length > 0
            ? students.reduce((sum, student) => sum + Number(student.attendanceRate ?? 0), 0) / students.length
            : 0;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((task) => task.status === 'DONE').length;
        const maxStudents = internship.maxStudents ?? internship.opportunity.totalSeats;
        const enrolledCount = students.length;

        return {
            id: internship.id,
            status: internship.status,
            header: {
                title: internship.title,
                subtitle: internship.subtitle,
                cohort: internship.cohort,
                coverImage: internship.coverImage,
                trainingType: internship.trainingType,
                location: internship.location,
                company: {
                    id: internship.company.id,
                    name: internship.company.name,
                    logo: internship.company.logo,
                },
                trainer: internship.trainer,
            },
            opportunity: {
                id: internship.opportunity.id,
                title: internship.opportunity.title,
                description: internship.opportunity.description,
                requiredSkills: internship.opportunity.requiredSkills
                    ?.split(',')
                    .map((skill) => skill.trim())
                    .filter(Boolean) ?? [],
                duration: internship.opportunity.duration,
                meetingLink: internship.opportunity.meetingLink,
            },
            capacity: {
                maxStudents,
                enrolledCount,
                availableSeats: Math.max(0, maxStudents - enrolledCount),
            },
            stats: {
                internshipProgress: {
                    percent: internship.progressPercent,
                    currentMilestone: internship.currentSprint,
                    totalMilestones: internship.totalSprints,
                    weeksCompleted: internship.weeksCompleted ?? 0,
                    weeksTotal: internship.weeksTotal ?? 0,
                    hoursCompleted: internship.weeksCompleted && internship.hoursPerWeek
                        ? internship.weeksCompleted * internship.hoursPerWeek
                        : 0,
                    hoursTotal: internship.hoursTotal ?? 0,
                },
                tasks: {
                    total: totalTasks,
                    completed: completedTasks,
                    inProgress: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
                    needsGrading: tasks.reduce((sum, task) => sum + task.needsReviewCount, 0),
                    completedPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                },
                attendance: {
                    totalRecords: totalAttendance,
                    presentRecords: presentAttendance,
                    absentRecords: absentAttendance,
                    ratePercent: Number(averageAttendanceRate.toFixed(2)),
                    studentsTracked: students.length,
                },
            },
            about: {
                description: internship.description,
                techStack: this.normalizeStringArray(internship.techStack),
                learningObjectives: internship.learningObjectives,
                competencies: this.normalizeStringArray(internship.competencies),
            },
            overview: {
                trainingPeriod: {
                    startDate: internship.startDate,
                    endDate: internship.endDate,
                    weeksRemaining: Math.max(0, (internship.weeksTotal ?? 0) - (internship.weeksCompleted ?? 0)),
                },
                totalDuration: {
                    hours: internship.hoursTotal,
                    hoursPerWeek: internship.hoursPerWeek,
                    workingDays: internship.workingDays,
                },
                trainingVenue: {
                    name: internship.venueName,
                    address: internship.venueAddress,
                    remoteTools: internship.remoteTools
                        ?.split(/[;,\n]/)
                        .map((tool) => tool.trim())
                        .filter(Boolean) ?? [],
                },
                universitySupervisors: internship.supervisors.map(({ role: assignmentRole, supervisor, ...assignment }) => ({
                    ...assignment,
                    role: supervisor.role,
                    assignmentRole,
                    supervisor,
                })),
            },
            students: students.map((entry) => ({
                id: entry.student.user.id,
                firstName: entry.student.user.firstName,
                lastName: entry.student.user.lastName,
                profileImage: entry.student.user.profileImage,
                university: entry.student.university,
                attendanceRate: Number(entry.attendanceRate ?? 0),
                status: entry.status,
            })),
            tasks,
            attendance,
            createdAt: internship.createdAt,
            updatedAt: internship.updatedAt,
        };
    }

    private normalizeStringArray(value: unknown): string[] {
        if (!Array.isArray(value)) return [];

        return value
            .map((item) => {
                if (typeof item === 'string') return item;
                if (typeof item === 'number' || typeof item === 'boolean') return String(item);
                if (item && typeof item === 'object') {
                    const value = item as Record<string, unknown>;
                    return String(value.name ?? value.title ?? value.value ?? '');
                }
                return '';
            })
            .filter(Boolean);
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
