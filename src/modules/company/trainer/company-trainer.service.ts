import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class CompanyTrainerService {
    constructor(private readonly prisma: DatabaseService) { }

    private success<T>(data: T) {
        return { success: true, data };
    }

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

        return this.success({
            allocatedTrainees,
            activeInternships,
            tasksDue,
            tasksDone,
        });
    }

    async getTrainees(trainerId: number, companyId: number) {
        const data = await this.prisma.internshipStudent.findMany({
            where: { internship: { companyId, trainerId } },
            include: { student: { include: { user: true } }, internship: true },
        });

        return this.success(data);
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
                    include: {
                        submissions: {
                            select: { id: true, score: true },
                        },
                    },
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
        const attendanceRate = totalAttendance > 0
            ? (presentAttendance / totalAttendance) * 100
            : 0;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((task) => task.status === 'DONE').length;
        const needsGrading = tasks.reduce(
            (sum, task) => sum + task.submissions.filter((submission) => submission.score === null).length,
            0,
        );
        const academicPartners = new Map<number, {
            university: string;
            shortCode: string;
            studentCount: number;
        }>();

        for (const student of students) {
            const university = student.student.university;
            const partner = academicPartners.get(university.id);
            if (partner) {
                partner.studentCount += 1;
            } else {
                academicPartners.set(university.id, {
                    university: university.name,
                    shortCode: university.shortCode,
                    studentCount: 1,
                });
            }
        }

        const currentTask = tasks[0];

        return this.success({
            id: internship.id,
            status: internship.status,
            header: {
                title: internship.opportunity.title,
                type : internship.opportunity.type,
                cohort: internship.cohort,
                coverImage: internship.opportunity.coverImage,
                trainingType: internship.opportunity.type,
                location: internship.opportunity.location,
                company: {
                    name: internship.company.name,
                    logo: internship.company.logo,
                },
                trainer: {
                    firstName: internship.trainer?.firstName,
                    lastName: internship.trainer?.lastName,
                },
            },
            stats: {
                progress: {
                    percent: internship.progressPercent,
                    currentMilestone: internship.currentMilestone ?? 0,
                    totalMilestones: internship.totalMilestones ?? 0,
                    weeksCompleted: internship.weeksCompleted ?? 0,
                    weeksTotal: internship.weeksTotal ?? 0,
                    hoursCompleted: internship.weeksCompleted && internship.opportunity.hoursPerWeek
                        ? internship.weeksCompleted * internship.opportunity.hoursPerWeek
                        : 0,
                    hoursTotal: internship.opportunity.hoursTotal ?? 0,
                },
                tasks: {
                    total: totalTasks,
                    inProgress: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
                    needsGrading,
                },
                attendance: {
                    absentRecords: absentAttendance,
                    ratePercent: Number(attendanceRate.toFixed(2)),
                    studentsTracked: students.length,
                },
            },
            about: {
                description: internship.opportunity.description,
                techStack: this.normalizeStringArray(internship.opportunity.techStack),
                learningObjectives: internship.opportunity.learningObjectives,
                competencies: this.normalizeStringArray(internship.opportunity.competencies),
            },
            overview: {
                trainingPeriod: {
                    startDate: internship.startDate,
                    endDate: internship.endDate,
                    weeksRemaining: Math.max(0, (internship.weeksTotal ?? 0) - (internship.weeksCompleted ?? 0)),
                },
                totalDuration: {
                    hours: internship.opportunity.hoursTotal,
                    hoursPerWeek: internship.opportunity.hoursPerWeek,
                    workingDays: internship.opportunity.workDays,
                },
                trainingVenue: {
                    name: internship.opportunity.venueName,
                    address: internship.opportunity.venueAddress,
                    latitude: internship.opportunity.latitude,
                    longitude: internship.opportunity.longitude,
                    equipment: internship.opportunity.venueEquipment,
                },
                academicPartners: Array.from(academicPartners.values()),
            },
            currentTask: currentTask ? {
                id: currentTask.id,
                title: currentTask.title,
                badge: currentTask.badge,
                deadline: currentTask.deadline,
                submissionCount: currentTask.submissions.length,
                expectedSubmissions: students.length,
                needsReviewCount: currentTask.submissions.filter((submission) => submission.score === null).length,
                rubricUrl: currentTask.rubricUrl,
            } : null,
            trainees: students.map((entry) => ({
                id: entry.student.user.id,
                firstName: entry.student.user.firstName,
                lastName: entry.student.user.lastName,
                university: entry.student.university.name,
                attendanceRate: Number(entry.attendanceRate ?? 0),
                status: entry.status,
            })),
            supervisors: internship.supervisors.map(({ role, supervisor, university }) => ({
                id: supervisor.id,
                firstName: supervisor.firstName,
                lastName: supervisor.lastName,
                department: supervisor.supervisorProfile?.department,
                university: university.name,
                role: role ?? supervisor.role,
            })),
            logistics: {
                attendanceModel: {
                    type: internship.opportunity.type === 'REMOTE' ? 'Remote' : 'On-Site Lab + QR Verification',
                    checkInStart: internship.opportunity.checkInStart,
                    checkInEnd: internship.opportunity.checkInEnd,
                    minPercent: internship.opportunity.attendanceMinPercent,
                },
                workingSchedule: {
                    days: internship.opportunity.workDays,
                    hours: internship.opportunity.dailyHours && internship.opportunity.workStartTime && internship.opportunity.workEndTime
                        ? `${internship.opportunity.workStartTime} - ${internship.opportunity.workEndTime}`
                        : null,
                    notes: null,
                },
            },
            mostActiveTrainees: [],
        });
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
        return this.success(record);
    }

    async getTraineeProgress(id: number, trainerId: number, companyId: number) {
        const record = await this.prisma.internshipStudent.findFirst({
            where: { id, internship: { companyId, trainerId } },
            include: { internship: { include: { tasks: true } }, student: true },
        });

        if (!record) throw new NotFoundException('Trainee not found');

        const tasks = record.internship.tasks.length;
        const done = record.internship.tasks.filter((task) => task.status === 'DONE').length;

        return this.success({
            traineeId: record.studentId,
            totalTasks: tasks,
            completedTasks: done,
            progress: tasks === 0 ? 0 : (done / tasks) * 100,
        });
    }

    async completeTrainee(id: number, trainerId: number, companyId: number) {
        const record = await this.prisma.internshipStudent.findFirst({
            where: { id, internship: { companyId, trainerId } },
            include: { internship: true },
        });

        if (!record) throw new NotFoundException('Trainee not found');

        const data = await this.prisma.internship.update({
            where: { id: record.internshipId },
            data: { status: 'COMPLETED' },
        });

        return this.success(data);
    }
}
