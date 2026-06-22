import { ApiProperty } from "@nestjs/swagger";
import {
    IsEmail,
    IsString,
    Length,
    Matches,
} from "class-validator";

export class VerifyResetCodeDto {
    @ApiProperty({
        example: "student@gmail.com",
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: "K8M2QX",
        description: "6-character verification code",
    })
    @IsString()
    @Length(6, 6)
    @Matches(/^[A-Z0-9]+$/)
    code: string;
}