import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateCompanyDto {
    @ApiProperty({ example: 'Tadreeby Tech', description: 'Company name' })
     @IsString()
    name!: string;

    @ApiProperty({ example: 'TAD', description: 'Unique short code (2-10 characters)' })
     @IsString()
    shortCode!: string;

    @ApiPropertyOptional({ example: 'info@tadreeby.com' })
     @IsEmail()
    email?: string;

    @ApiPropertyOptional({ example: '+9708288888' })
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: 'Gaza City, Palestine' })
    @IsString()
    location?: string;

    @ApiPropertyOptional({ example: 'Leading technology company' })
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'logo-123456.png' })
    @IsString()
    logo?: string;

    @ApiPropertyOptional({ default: true })
    isActive?: boolean;
}