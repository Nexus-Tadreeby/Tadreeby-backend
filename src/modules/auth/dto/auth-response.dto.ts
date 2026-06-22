import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

class AuthUserDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'test@mail.com' })
    email: string;

    @ApiProperty({
        enum: UserRole,
        example: UserRole.STUDENT,
    })
    role: UserRole;

    @ApiProperty({
        example: true,
    })
    isActive: boolean;
}

export class AuthResponseDto {
    @ApiProperty({ example: 'jwt_access_token' })
    accessToken: string;

    @ApiProperty({ example: 'jwt_refresh_token' })
    refreshToken: string;

    @ApiProperty({ type: AuthUserDto })
    user: AuthUserDto;
}