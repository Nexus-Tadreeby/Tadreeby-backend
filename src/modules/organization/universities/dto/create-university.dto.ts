import {
    IsOptional,
    IsString,
    IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from 'node_modules/@nestjs/swagger/dist/decorators/api-property.decorator';

export class CreateUniversityDto {

    @ApiProperty({ example: 'Alazhar University Gaza', description: 'University name' })
    @IsString()
    name!: string;

    @ApiProperty({ example: 'AUG', description: 'Unique short code (2-10 characters)' })
    @IsString()
    shortCode!: string;

    @ApiPropertyOptional({ example: 'Gaza City, Palestine' })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({ example: '0592246851' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: 'info@aug.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ example: 'Leading university in Gaza' })
    @IsOptional()
    @IsString()
    description?: string;
   
}