import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserQueryDto {
    @ApiPropertyOptional({ description: 'Search by name or email' })
    search?: string;

    @ApiPropertyOptional({ enum: UserRole, description: 'Filter by role' })
    role?: UserRole;

    @ApiPropertyOptional({ description: 'Filter by active status' })
    isActive?: boolean;

    @ApiPropertyOptional({ default: 1 })
    page?: number = 1;

    @ApiPropertyOptional({ default: 20, maximum: 100 })
    limit?: number = 20;
}