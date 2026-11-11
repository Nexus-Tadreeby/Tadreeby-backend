import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsObject, Max, Min } from 'class-validator';

export class CreateSupervisorEvaluationDto {
    @ApiProperty({ example: 12, description: 'Student user ID' })
    @IsNumber()
    @IsNotEmpty()
    studentId!: number;

    @ApiProperty({ example: 35, description: 'Internship ID' })
    @IsNumber()
    @IsNotEmpty()
    internshipId!: number;

    @ApiProperty({ example: { punctuality: 4, participation: 5 }, description: 'Criteria-based evaluation JSON object' })
    @IsObject()
    @IsNotEmpty()
    criteria!: Record<string, number | string>;

    @ApiProperty({ example: 4.5, minimum: 0, maximum: 5 })
    @IsNumber()
    @Min(0)
    @Max(5)
    @IsNotEmpty()
    score!: number;
    feedback?: string;

    @ApiProperty({ example: 'Continue improving communication and technical documentation.' })
    @IsString()
    @IsOptional()
    recommendations?: string;
}
