import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LogoutDto {
    @ApiProperty({
        example: 'refresh_token_here',
    })
    @IsString()
    refreshToken: string;
}

export class LogoutResponseDto {
    @ApiProperty({ example: true })
    success!: boolean;

    @IsString()
    message: string;
}
    

