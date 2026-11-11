// import { ApiProperty } from '@nestjs/swagger';
// import { type User } from '@prisma/client';
// import { MessageResponseDto } from './recive-message.dto';

// export class ConversationListItemDto {
//     @ApiProperty({ description: 'The other user in the conversation' })
//     user!: User;

//     @ApiProperty({ description: 'The most recent message in the conversation' })
//     lastMessage!: MessageResponseDto;
// }


// conversation-list.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user-info.dto'; // <-- Import UserDto
import { MessageResponseDto } from './recive-message.dto';

export class ConversationListItemDto {
    @ApiProperty({ type: () => UserDto }) // <-- Use UserDto
    user!: UserDto;

    @ApiProperty({ type: () => MessageResponseDto })
    lastMessage!: MessageResponseDto;
}