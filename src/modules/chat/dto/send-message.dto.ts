import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class SendMessageDto {
    @ApiProperty({
        description: 'ID of the user receiving the message',
        example: 2,
        required: true,
    })
    @IsInt()
    @Min(1)
    receiverId!: number;

    @ApiProperty({
        description: 'The message content',
        example: 'Hello, how are you?',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    content!: string;
}