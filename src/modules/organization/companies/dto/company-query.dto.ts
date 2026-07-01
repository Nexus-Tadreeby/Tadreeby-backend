import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Max, Min } from 'class-validator';

export class CompanyQueryDto {
    @ApiPropertyOptional({ default: 1 })
    @Type(() => Number)
    @IsOptional()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 10, maximum: 100 })
    @Type(() => Number)
    @IsOptional()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Search by name, shortCode, email, description' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by status' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Filter by location' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({ description: 'Filter by phone' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ enum: ['id', 'name', 'shortCode'], default: 'id' })
    @IsOptional()
    @IsString()
    sortBy?: 'id' | 'name' | 'shortCode' = 'id';

    @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';
}