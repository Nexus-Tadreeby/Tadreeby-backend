import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AiService {
    constructor(private readonly prisma: DatabaseService) { }

    async benchmarking() {
        const opportunities = await this.prisma.trainingOpportunity.findMany({ include: { applications: true, internships: true } });
        return {
            totalOpportunities: opportunities.length,
            opportunities,
            generatedAt: new Date().toISOString(),
        };
    }

    async opportunityGaps() {
        const opportunities = await this.prisma.trainingOpportunity.findMany({
            include: { applications: true },
        });

        return opportunities.map((opp) => ({
            opportunityId: opp.id,
            title: opp.title,
            applications: opp.applications.length,
            seats: opp.totalSeats,
            gap: Math.max(0, opp.totalSeats - opp.applications.length),
        }));
    }

    async traineePredictions(studentId: number) {
        const attendance = await this.prisma.attendance.count({ where: { studentId } });
        const tasks = await this.prisma.taskSubmission.count({ where: { studentId } });

        return {
            studentId,
            predictedCompletion: attendance > 0 ? 'High' : 'Moderate',
            probability: Math.min(95, 55 + (tasks * 8) + (attendance * 2)),
            notes: 'AI model based on attendance and task completion signals.',
        };
    }

    async taskDelayAnalysis() {
        const tasks = await this.prisma.task.findMany({ include: { submissions: true } });
        return tasks.map((task) => ({
            taskId: task.id,
            title: task.title,
            status: task.status,
            hasSubmission: task.submissions.length > 0,
            delayed: task.deadline ? new Date(task.deadline).getTime() < Date.now() : false,
        }));
    }

    async performanceSummary(studentId: number) {
        const [attendance, evaluations, tasks] = await Promise.all([
            this.prisma.attendance.count({ where: { studentId } }),
            this.prisma.evaluation.findMany({ where: { studentId } }),
            this.prisma.taskSubmission.findMany({ where: { studentId } }),
        ]);

        const scoreAverage = evaluations.length
            ? evaluations.reduce((sum, item) => sum + (item.score ?? 0), 0) / evaluations.length
            : 0;

        return {
            studentId,
            attendanceEntries: attendance,
            submissionCount: tasks.length,
            averageScore: Number(scoreAverage.toFixed(2)),
            summary: 'Performance summary generated from attendance, tasks, and evaluations.',
        };
    }

    async studentRecommendations(studentId: number) {
        const student = await this.prisma.studentProfile.findUnique({
            where: { userId: studentId },
            select: { skills: true, universityId: true },
        });

        if (!student) {
            return { studentId, recommendations: [] };
        }

        const currentSkills = student.skills ? JSON.parse(student.skills) : [];
        const opportunities = await this.prisma.trainingOpportunity.findMany({
            where: { isActive: true },
            select: { id: true, title: true, requiredSkills: true, company: { select: { name: true } } },
        });

        const recommendations = opportunities
            .map((opp) => {
                const required = opp.requiredSkills
                    ? opp.requiredSkills.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
                    : [];
                const matchCount = required.filter((skill) => currentSkills.some((item) => item.toLowerCase() === skill)).length;
                const coverage = required.length ? `${matchCount}/${required.length}` : '0/0';

                return {
                    opportunityId: opp.id,
                    title: opp.title,
                    company: opp.company?.name ?? 'Company',
                    requiredSkills: required,
                    coverage,
                    matchScore: required.length ? Math.round((matchCount / required.length) * 100) : 0,
                };
            })
            .filter((item) => item.requiredSkills.length > 0)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5);

        return { studentId, recommendations };
    }
}
