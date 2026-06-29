import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Max, Min } from 'class-validator';

export class UniversityQueryDto {
    @ApiPropertyOptional({ default: 1, description: 'Page number' })
    @Type(() => Number)
    @IsOptional()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 10, maximum: 100, description: 'Items per page' })
    @Type(() => Number)
    @IsOptional()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Search by name or shortCode or email' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by status', example: true })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Filter by location (city)' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({ description: 'Filter by phone number' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ description: 'Sort by field', enum: ['name', 'shortCode', 'createdAt', 'updatedAt'] })
    @IsOptional()
    @IsString()
    sortBy?: 'name' | 'shortCode' | 'createdAt' | 'updatedAt' = 'createdAt';

    @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';
}