
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUniversityDto {
    @ApiPropertyOptional({ example: 'Alazhar University Gaza' })
    name?: string;

    @ApiPropertyOptional({ example: 'AUG' })
    shortCode?: string;

    @ApiPropertyOptional({ example: 'info@aug.com' })
    email?: string;

    @ApiPropertyOptional({ example: '0592246851' })
    phone?: string;

    @ApiPropertyOptional({ example: 'Gaza City, Palestine' })
    location?: string;

    @ApiPropertyOptional({ example: 'Leading university in Gaza' })
    description?: string;

    @ApiPropertyOptional({ example: 'logo-123456.png' })
    logo?: string;

    @ApiPropertyOptional()
    isActive?: boolean;

    
}