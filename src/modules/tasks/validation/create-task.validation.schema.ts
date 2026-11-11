import z,  {ZodType} from 'zod';
import { CreateTaskDto } from '../dto/create-task.dto';

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

export const TaskAttachmentSchema = z.object({
    fileName: z.string().min(1),
    fileUrl: z.string(),
    fileSize: z.number().int().positive(),
    mimeType: z.string().min(1),
    description: z.string().optional(),
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
        attachments: z.array(TaskAttachmentSchema).max(5 , 'Maximum 5 attachments allowed').optional(), 
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
    }) satisfies ZodType<CreateTaskDto>// Ensure the schema satisfies the CreateTaskDto type
