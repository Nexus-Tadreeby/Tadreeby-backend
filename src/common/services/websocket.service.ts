import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class WebSocketService {
    private server: Server | null = null;
    private rooms = new Map<number, Set<string>>();
    private socketMap = new Map<number, Set<string>>();

    setServer(server: Server) {
        this.server = server;
    }

    registerSocket(userId: number, socketId: string) {
        const userSockets = this.socketMap.get(userId) ?? new Set<string>();
        userSockets.add(socketId);
        this.socketMap.set(userId, userSockets);
        this.rooms.set(userId, userSockets);
    }

    removeSocket(userId: number, socketId: string) {
        const userSockets = this.socketMap.get(userId);
        if (!userSockets) return;

        userSockets.delete(socketId);
        if (userSockets.size === 0) {
            this.socketMap.delete(userId);
            this.rooms.delete(userId);
            return;
        }

        this.socketMap.set(userId, userSockets);
        this.rooms.set(userId, userSockets);
    }

    joinRoom(socket: Socket, userId: number) {
        socket.join(`user:${userId}`);
        this.registerSocket(userId, socket.id);
    }

    sendToUser(userId: number, event: string, payload: any) {
        if (!this.server) return;
        this.server.to(`user:${userId}`).emit(event, payload);
    }

    emitToSocket(socketId: string, event: string, payload: any) {
        if (!this.server) return;
        this.server.to(socketId).emit(event, payload);
    }

    getSocketsForUser(userId: number): string[] {
        return Array.from(this.socketMap.get(userId) ?? new Set());
    }
}
