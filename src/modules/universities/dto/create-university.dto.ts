import {
    IsOptional,
    IsString,
    IsEmail,
} from 'class-validator';

export class CreateUniversityDto {
    @IsString()
    name: string;

    @IsString()
    shortCode: string;

   
}