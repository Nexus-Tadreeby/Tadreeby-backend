import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';


@Injectable()
export class UserStatusService {
  constructor(private readonly prisma: DatabaseService) {}

  async setOnline(userId: number) {
    await this.prisma.userStatus.upsert({
      where: { userId },
      update: {
        status: 'ONLINE',
        lastSeen: new Date(),
      },
      create: {
        userId,
        status: 'ONLINE',
        lastSeen: new Date(),
      },
    });
  }

  // async setOffline(userId: number) {
  //   await this.prisma.userStatus.upsert({
  //     where: { userId },
  //     update: {
  //       status: 'OFFLINE',
  //       lastSeen: new Date(),
  //     },
  //     create: {
  //       userId,
  //       status: 'OFFLINE',
  //       lastSeen: new Date(),
  //     },
  //   });
  // }

  async setOffline(userId: number) {
    console.log(`🟢 setOffline called for userId: ${userId}`);
    const result = await this.prisma.userStatus.upsert({
      where: { userId },
      update: {
        status: 'OFFLINE',
        lastSeen: new Date(),
      },
      create: {
        userId,
        status: 'OFFLINE',
        lastSeen: new Date(),
      },
    });
    console.log(`✅ UserStatus updated:`, result);
    return result;
  }
  async getStatus(userId: number) {
    return this.prisma.userStatus.findUnique({
      where: { userId },
    });
  }
}