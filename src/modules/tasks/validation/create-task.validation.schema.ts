import { z } from 'zod';

export const TaskDifficultyEnum = z.enum([
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED',
]);

export const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

export const SubmissionTypeEnum = z.enum([
    'CODE_REPOSITORY',
    'FILE_UPLOAD',
    'LIVE_URL',
]);

export const EvaluationCriterionSchema = z.object({
    name: z.string().min(1, 'Criterion name is required'),
    weight: z.number().int().min(0).max(100),
});

export const CreateTaskSchema = z
    .object({
        internshipId: z.number().int().positive(),

        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
        category: z.string().optional(),
        difficulty: TaskDifficultyEnum.optional(),
        skills: z.array(z.string()).optional(),
        instructions: z.string().optional(),
        deliverables: z.array(z.string()).optional(),
        startDate: z.string().datetime().optional(),
        deadline: z.string().datetime().optional(),
        acceptedSubmissionTypes: z.array(SubmissionTypeEnum).optional(),
        allowLateSubmission: z.boolean().optional(),

        status: TaskStatusEnum.optional(),

        evaluationCriteria: z.array(EvaluationCriterionSchema).optional(),
    })
    .superRefine((data, ctx) => {
        if (data.evaluationCriteria && data.evaluationCriteria.length > 0) {
            const total = data.evaluationCriteria.reduce(
                (sum, c) => sum + c.weight,
                0,
            );
            if (total !== 100) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['evaluationCriteria'],
                    message: `Total criteria weight must equal 100, got ${total}`,
                });
            }
        }

        if (data.startDate && data.deadline) {
            if (new Date(data.startDate) >= new Date(data.deadline)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['deadline'],
                    message: 'Deadline must be after start date',
                });
            }
        }
    });

// استخراج النوع تلقائياً من الـ schema
export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;