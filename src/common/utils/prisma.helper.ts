import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class PrismaHelper {
  constructor(private prisma: DatabaseService) { }

  userByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
      },
    });
  }

  userById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
      },
    });
  }
}