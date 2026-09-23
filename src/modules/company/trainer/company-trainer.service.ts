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
                    weeksCompleted: internship.weeksCompleted ?? 0,
                    weeksTotal: internship.weeksTotal ?? 0,
                    hoursCompleted: internship.weeksCompleted && internship.hoursPerWeek
                        ? internship.weeksCompleted * internship.hoursPerWeek
                        : 0,
                    hoursTotal: internship.hoursTotal ?? 0,
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
                description: internship.description,
                techStack: this.normalizeStringArray(internship.techStack),
                learningObjectives: this.normalizeLearningObjectives(internship.learningObjectives),
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
                    latitude: internship.latitude,
                    longitude: internship.longitude,
                    equipment: internship.venueEquipment,
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
                    type: internship.trainingType === 'REMOTE' ? 'Remote' : 'On-Site Lab + QR Verification',
                    checkInStart: internship.checkInStart,
                    checkInEnd: internship.checkInEnd,
                    minPercent: internship.attendanceMinPercent,
                },
                workingSchedule: {
                    days: internship.workingDays,
                    hours: internship.dailyHours && internship.workStartTime && internship.workEndTime
                        ? `${internship.workStartTime} - ${internship.workEndTime}`
                        : null,
                    notes: null,
                },
            },
            mostActiveTrainees: [],
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

    private normalizeLearningObjectives(value: unknown): Array<{ title: string; description: string }> {
        if (!Array.isArray(value)) return [];

        return value.flatMap((item) => {
            if (!item || typeof item !== 'object') return [];

            const objective = item as Record<string, unknown>;
            return [{
                title: String(objective.title ?? ''),
                description: String(objective.description ?? ''),
            }];
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
