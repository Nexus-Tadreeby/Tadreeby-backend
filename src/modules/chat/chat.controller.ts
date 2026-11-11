import { ChatService } from './chat.service';
import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ConversationListItemDto } from './dto/conversation-list.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { MessageResponseDto } from './dto/recive-message.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Get('conversations')
  @ApiOperation({ summary: 'Get recent conversations' })
  @ApiResponse({ status: HttpStatus.OK, type: [ConversationListItemDto] })
  async getConversations(@Request() req): Promise<ConversationListItemDto[]> {
    return this.chatService.getRecentConversations(req.user.id);
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get chat history with a specific user' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: [MessageResponseDto] })
  async getHistory(
    @Request() req,
    @Param('userId') otherUserId: string,
    @Query('page') page: string,
  ): Promise<MessageResponseDto[]> {
    return this.chatService.getConversation(
      req.user.id,
      parseInt(otherUserId, 10),
      parseInt(page, 10) || 1,
    );
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a direct message to another user' })
  async sendMessage(@Request() req, @Body() dto: { receiverId: number; content: string }) {
    return this.chatService.saveMessage(req.user.id, dto.receiverId, dto.content);
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'messageId', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: MessageResponseDto })
  async deleteMessage(
    @Request() req,
    @Param('messageId') messageId: string,
  ): Promise<MessageResponseDto> {
    return this.chatService.deleteMessage(parseInt(messageId, 10), req.user.id);
  }

}
