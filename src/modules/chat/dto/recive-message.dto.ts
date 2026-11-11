import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user-info.dto'; // <-- Import UserDto

export class MessageResponseDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 5 })
    senderId!: number;

    @ApiProperty({ example: 2 })
    receiverId!: number;

    @ApiProperty({ example: 'Hello!' })
    content!: string;

    @ApiProperty({ example: '2026-07-18T12:00:00.000Z' })
    createdAt!: Date;

    @ApiProperty({ type: () => UserDto }) // <-- Tell Swagger to use UserDto
    sender!: UserDto;

    @ApiProperty({ type: () => UserDto }) // <-- Tell Swagger to use UserDto
    receiver!: UserDto;
}