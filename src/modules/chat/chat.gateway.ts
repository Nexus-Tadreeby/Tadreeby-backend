import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { DatabaseService } from 'src/database/database.service';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: DatabaseService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
      const userId = Number(payload.sub ?? payload.id);
      client.data.user = payload;

      await this.prisma.userStatus.upsert({
        where: { userId },
        update: { status: 'ONLINE', lastSeen: new Date(), updatedAt: new Date() },
        create: { userId, status: 'ONLINE', lastSeen: new Date() },
      });

      client.join(`user:${userId}`);
      this.logger.log(`User ${userId} connected to /chat`);
    } catch (error) {
      this.logger.error('Chat auth failed', error);
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = Number(client.data.user?.sub ?? client.data.user?.id);
    if (!userId) return;

    await this.prisma.userStatus.upsert({
      where: { userId },
      update: { status: 'OFFLINE', lastSeen: new Date(), updatedAt: new Date() },
      create: { userId, status: 'OFFLINE', lastSeen: new Date() },
    });

    this.logger.log(`User ${userId} disconnected from /chat`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() dto: { receiverId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = Number(client.data.user?.sub ?? client.data.user?.id);
    const message = await this.prisma.message.create({
      data: { senderId, receiverId: dto.receiverId, content: dto.content },
      include: { sender: true, receiver: true },
    });

    this.server.to(`user:${dto.receiverId}`).emit('newMessage', message);
    client.emit('messageSent', message);
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() dto: { receiverId: number; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = Number(client.data.user?.sub ?? client.data.user?.id);
    this.server.to(`user:${dto.receiverId}`).emit('typing', { userId, isTyping: dto.isTyping });
  }

  @SubscribeMessage('messageRead')
  async handleMessageRead(
    @MessageBody() dto: { messageId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = Number(client.data.user?.sub ?? client.data.user?.id);
    await this.prisma.message.update({
      where: { id: dto.messageId },
      data: { content: 'read' },
    }).catch(() => undefined);

    this.server.to(`user:${userId}`).emit('messageRead', { messageId: dto.messageId, readBy: userId });
  }
}
