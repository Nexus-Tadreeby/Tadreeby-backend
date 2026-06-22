import { ApiProperty } from "@nestjs/swagger";

export class StudentRegisterDto {
    @ApiProperty()
    email: string;

    @ApiProperty()
    password: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    phone: string;

    @ApiProperty()
    universityId: number;

    @ApiProperty()
    studentNumber: number;

    @ApiProperty()
    verificationDocument: string;

    @ApiProperty()
    personalID: number;
}