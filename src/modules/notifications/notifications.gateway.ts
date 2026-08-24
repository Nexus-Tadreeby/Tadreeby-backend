import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' } })
export class NotificationsGateway {
    private readonly logger = new Logger(NotificationsGateway.name);

    @WebSocketServer()
    server!: Server;

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@MessageBody() userId: number, @ConnectedSocket() client: Socket) {
        client.join(`user:${userId}`);
        this.logger.log(`Socket ${client.id} joined room user:${userId}`);
        client.emit('joined', { room: `user:${userId}` });
    }

    sendNotification(userId: number, payload: any) {
        this.server.to(`user:${userId}`).emit('notification', payload);
    }
}
