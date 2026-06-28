import { ApiProperty } from '@nestjs/swagger';

export class RegisterStudentDto {
    @ApiProperty()
    firstName!: string;

    @ApiProperty()
    lastName!: string;

    @ApiProperty()
    personalID!: number;

    @ApiProperty()
    studentNumber!: number;

    @ApiProperty()
    phone!: string;

    @ApiProperty()
    email!: string;

    @ApiProperty()
    major!: string;

    @ApiProperty()
    password!: string;

    @ApiProperty()
    confirmPassword!: string; 

    @ApiProperty()
    universityId!: number;

    @ApiProperty()
    verificationDocument!: string;
}