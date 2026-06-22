import { ApiProperty } from "@nestjs/swagger";
import {
    IsString,
    MinLength,
} from "class-validator";

export class ResetPasswordDto {
    @ApiProperty({
        example:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    })
    @IsString()
    resetToken: string;

    @ApiProperty({
        example: "NewPassword123!",
        minLength: 8,
    })
    @IsString()
    @MinLength(8)
    newPassword: string;

    @ApiProperty({
        example: "NewPassword123!",
        minLength: 8,
    })
    @IsString()
    @MinLength(8)
    confirmPassword: string;
}