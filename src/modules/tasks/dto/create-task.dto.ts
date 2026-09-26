import {
    IsArray, IsBoolean, IsEnum, IsInt, IsISO8601,
    IsNotEmpty, IsOptional, IsString, ValidateNested, ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TaskDifficulty {
    BEGINNER = 'BEGINNER',
    INTERMEDIATE = 'INTERMEDIATE',
    ADVANCED = 'ADVANCED',
}

export enum SubmissionType {
    CODE_REPOSITORY = 'CODE_REPOSITORY',
    FILE_UPLOAD = 'FILE_UPLOAD',
    LIVE_URL = 'LIVE_URL',
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
}