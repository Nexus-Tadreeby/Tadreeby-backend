import {
    IsArray, IsBoolean, IsEnum, IsInt, IsISO8601,
    IsNotEmpty, IsOptional, IsString, ValidateNested, ArrayNotEmpty,
    ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubmissionType, TaskDifficulty } from '@prisma/client';



export class TaskAttachmentDto {
    @IsString()
    @IsNotEmpty()
    fileName!: string;

    @IsString()
    @IsNotEmpty()
    fileUrl!: string;

    @IsInt()
    fileSize!: number;

    @IsString()
    @IsNotEmpty()
    mimeType!: string;

    @IsOptional()
    @IsString()
    description?: string;
}



export class EvaluationCriterionDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsInt()
    weight!: number;
}

export class CreateTaskDto {
    @IsInt()
    internshipId!: number;

    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsEnum(TaskDifficulty)
    difficulty?: TaskDifficulty;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];

    @IsOptional()
    @IsString()
    instructions?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    deliverables?: string[];

    @IsOptional()
    @IsISO8601()
    startDate?: string;

    @IsOptional()
    @IsISO8601()
    deadline?: string;

    @IsOptional()
    @IsArray()
    @IsEnum(SubmissionType, { each: true })
    acceptedSubmissionTypes?: SubmissionType[];

    @IsOptional()
    @IsBoolean()
    allowLateSubmission?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EvaluationCriterionDto)
    evaluationCriteria?: EvaluationCriterionDto[];

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(5, { message: 'Maximum 5 attachments allowed' })
    @ValidateNested({ each: true })
    @Type(() => TaskAttachmentDto)
    attachments?: TaskAttachmentDto[];
}