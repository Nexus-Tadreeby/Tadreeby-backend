import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStudentProfileDto {
    // @ApiPropertyOptional()
    // firstName?: string;

    // @ApiPropertyOptional()
    // lastName?: string;

    @ApiPropertyOptional()
    phone?: string;

    // @ApiPropertyOptional()
    // major?: string;

    // @ApiPropertyOptional()
    // academicYear?: number ;

    @ApiPropertyOptional()
    gpa?: number | null;

    @ApiPropertyOptional()
    profileImage?: string | null;

    @ApiPropertyOptional()
    cvFile?: string | null; 
    
    @ApiPropertyOptional()
    recoveryEmail?: string | null;
}