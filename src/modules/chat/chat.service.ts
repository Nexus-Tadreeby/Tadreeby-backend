import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { MessageResponseDto } from './dto/recive-message.dto';
import { ConversationListItemDto } from './dto/conversation-list.dto';

@Injectable()
export class ChatService {
  constructor(private prisma : DatabaseService) {}


  //! Save new message 
  async saveMessage(
    senderId: number,
    receiverId: number,
    content: string,
  ): Promise<MessageResponseDto> {
    const message = await this.prisma.message.create({
      data: { senderId, receiverId, content },
      include: {
        sender: true,    
        receiver: true,
      },
    });
    return message as MessageResponseDto;
  }

  async getConversation(
    userId: number,
    otherUserId: number,
    page: number = 1,
  ): Promise<MessageResponseDto[]> {
    const take = 20;
    const skip = (page - 1) * take;
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        sender: true,
        receiver: true,
      },
    });
    return messages as MessageResponseDto[];
  }

  async getRecentConversations(userId: number): Promise<ConversationListItemDto[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: true,
        receiver: true,
      },
    });

    const partnersMap = new Map<number, ConversationListItemDto>();
    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!partnersMap.has(partnerId)) {
        const partnerUser = msg.senderId === userId ? msg.receiver : msg.sender;
        partnersMap.set(partnerId, {
          user: partnerUser as any, // We'll cast to UserDto
          lastMessage: msg as any,
        });
      }
    }
    return Array.from(partnersMap.values());
  }

  async deleteMessage(messageId: number, userId: number): Promise<MessageResponseDto> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    const deleted = await this.prisma.message.delete({
      where: { id: messageId },
      include: {
        sender: true,
        receiver: true,
      },
    });
    return deleted as MessageResponseDto;
  }


}
