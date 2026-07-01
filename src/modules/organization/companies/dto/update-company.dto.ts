import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto {
    @ApiPropertyOptional({ example: 'Tadreeby Tech' })
    name?: string;

    @ApiPropertyOptional({ example: 'TAD' })
    shortCode?: string;

    @ApiPropertyOptional({ example: 'info@tadreeby.com' })
    email?: string;

    @ApiPropertyOptional({ example: '+9708288888' })
    phone?: string;

    @ApiPropertyOptional({ example: 'Gaza City, Palestine' })
    location?: string;

    @ApiPropertyOptional({ example: 'Leading technology company' })
    description?: string;

    @ApiPropertyOptional({ example: 'logo-123456.png' })
    logo?: string;

    @ApiPropertyOptional()
    isActive?: boolean;
}