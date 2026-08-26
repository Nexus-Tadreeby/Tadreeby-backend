// modules/users/users.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { $Enums, Prisma, UserRole } from '@prisma/client';
import { UserQueryType } from './validation/user-query.validation';
import { PaginationResult } from 'src/common/types/unifiedType.types';
import { convertBigIntFields } from 'src/common/utils/bigint.util';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: DatabaseService) { }

  
  

  async getAllUsers(query: UserQueryType): Promise<PaginationResult<any>> {
    const {
      search,
      role,
      isActive,
      universityId,
      companyId,
      page,
      limit,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }


    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (universityId) {
      where.universityId = universityId;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          universityId: true,
          companyId: true,
          createdAt: true,
          university: {
            select: { id: true, name: true, shortCode: true },
          },
          company: {
            select: { id: true, name: true, shortCode: true },
          },
          studentProfile: {
            select: { 
              major: true,
              studentNumber: true,
              approvalStatus: true,
             },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);


    const formattedUsers = users.map((user) => ({
      ...user,
      studentProfile: user.studentProfile
        ? {
          ...user.studentProfile,
          studentNumber: user.studentProfile.studentNumber
            ? Number(user.studentProfile.studentNumber)
            : null,
        }
        : null,
    }));
    
    const totalPages = Math.ceil(total / limit);

    return {
      data: formattedUsers,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }



  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        universityId: true,
        companyId: true,
        profileImage: true,
        personalID: true,
        recoveryEmail: true,
        createdAt: true,
        university: {
          select: { id: true, name: true, shortCode: true },
        },
        company: {
          select: { id: true, name: true, shortCode: true },
        },
        studentProfile: {
          select: {
            studentNumber: true,
            major: true,
            academicYear: true,
            gpa: true,
            approvalStatus: true,
            approvedAt: true,
            rejectionReason: true,
          },
        },
        supervisorProfile: {
          select: {
            department: true,
          },
        },
        trainerProfile: {
          select: {
            position: true,
            specialization: true,
          },
        },
        userStatuses: {
          select: {
            status: true,
            lastSeen: true,
          },
        },
        // universitySupervisor: {
        //   select: {
        //     department: true,
        //     students: {
        //       select: {
        //         id: true,
        //         studentNumber: true,
        //         user: {
        //           select: { firstName: true, lastName: true, email: true },
        //         },
        //       },
        //     },
        //   },
        // },
        // companyTrainer: {
        //   select: {
        //     department: true,
        //     position: true,
        //     trainees: {
        //       select: {
        //         id: true,
        //         studentNumber: true,
        //         user: {
        //           select: { firstName: true, lastName: true, email: true },
        //         },
        //       },
        //     },
        //   },
        // },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const latestStatus = user.userStatuses?.[0];

    const result = {
      ...user,
      lastSeen: latestStatus?.lastSeen || null,
      status: latestStatus?.status || 'OFFLINE',
      userStatuses: undefined,
    };

    return convertBigIntFields(result);
  }

  
  // async deactivateUser(id: number) {
  //   const user = await this.prisma.user.findUnique({ where: { id } });
  //   if (!user) throw new NotFoundException('User not found');
  //   if (user.role === UserRole.SUPER_ADMIN) {
  //     throw new ConflictException('Cannot deactivate a Super Admin');
  //   }

  //   return this.prisma.user.update({
  //     where: { id },
  //     data: { isActive: false },
  //     select: { id: true, email: true, isActive: true, updatedAt: true },
  //   });
  // }



  async deactivateUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        isActive: true,
        role: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ConflictException('Cannot deactivate a Super Admin');
    }

    if (!user.isActive) {
      throw new ConflictException('User is already inactive');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });

    const updatedAt = await this.updateUserStatus(id, 'OFFLINE');

    return {
      ...updatedUser,
      updatedAt,
    };
  }
  


  // async activateUser(id: number) {
  //   const user = await this.prisma.user.findUnique({ where: { id } });
  //   if (!user) throw new NotFoundException('User not found');

  //   return this.prisma.user.update({
  //     where: { id },
  //     data: { isActive: true },
  //     select: { id: true, email: true, isActive: true, updatedAt: true },
  //   });
  // }


  async activateUser(id: number) {
    
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.isActive) {
      throw new ConflictException('User is already active');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });

    const updatedAt = await this.updateUserStatus(id, 'ONLINE');

    return {
      ...updatedUser,
      updatedAt,
    };
  }



  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ConflictException('Cannot delete a Super Admin');
    }

    // await this.prisma.user.delete({ where: { id } });
    // return { success: true, message: 'User deleted successfully' };

    
    await this.prisma.$transaction(async (tx) => {
    
      await tx.session.deleteMany({ where: { userId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.passwordResetCode.deleteMany({ where: { userId: id } });
      await tx.userActivityLog.deleteMany({ where: { userId: id } });
      await tx.userStatus.deleteMany({ where: { userId: id } });

      const studentProfile = await tx.studentProfile.findUnique({
        where: { userId: id },
      });
      if (studentProfile) {
        await tx.studentProfile.delete({ where: { userId: id } });
      }

      const supervisorProfile = await tx.universitySupervisorProfile.findUnique({
        where: { userId: id },
      });
      if (supervisorProfile) {
        await tx.universitySupervisorProfile.delete({ where: { userId: id } });
      }

      const trainerProfile = await tx.companyTrainerProfile.findUnique({
        where: { userId: id },
      });
      if (trainerProfile) {
        await tx.companyTrainerProfile.delete({ where: { userId: id } });
      }

      await tx.message.deleteMany({
        where: {
          OR: [
            { senderId: id },
            { receiverId: id },
          ],
        },
      });

      await tx.evaluation.deleteMany({
        where: { evaluatorId: id },
      });

      await tx.user.delete({ where: { id } });
    });

    return { success: true, message: 'User deleted successfully' };
  }

  



//   async getProfile(userId: number) {
//     const user = await this.prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         email: true,
//         phone: true,
//         role: true,
//         isActive: true,
//         universityId: true,
//         companyId: true,
//         createdAt: true,
//         recoveryEmail: true,
//         profileImage: true,
//         personalID: true,
//       },
//     });

//     if (!user) throw new NotFoundException('User not found');

//     const settings = {
//       notifications: { email: true, push: true, system: true },
//       language: 'en' as const,
//       theme: 'light' as const,
//       timezone: 'Asia/Gaza',
//     };

//     return { profile: user, settings };
//   }



  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        universityId: true,
        companyId: true,
        profileImage: true,
        personalID: true,
        recoveryEmail: true,
        createdAt: true,
        university: {
          select: { id: true, name: true, shortCode: true },
        },
        company: {
          select: { id: true, name: true, shortCode: true },
        },
        studentProfile: {
          select: {
            studentNumber: true,
            major: true,
            academicYear: true,
            gpa: true,
            approvalStatus: true,
          },
        },
        supervisorProfile: {
          select: {
            department: true,
          },
        },
        trainerProfile: {
          select: {
            position: true,
            specialization: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return { profile: user };
  }


  

  // async getUsersByRole(role: UserRole) {
  //   return this.prisma.user.findMany({
  //     where: { role },
  //     select: {
  //       id: true,
  //       firstName: true,
  //       lastName: true,
  //       email: true,
  //       phone: true,
  //       isActive: true,
  //       university: {
  //         select: { id: true, name: true },
  //       },
  //       company: {
  //         select: { id: true, name: true },
  //       },
  //       createdAt: true,
  //     },
  //     orderBy: { createdAt: 'desc' },
  //   });
  // }



  async getUsersByRole(role: string): Promise<{ data: any[]; message?: string }> {

    const roleMap: Record<string, UserRole> = {

      'SUPER_ADMIN': UserRole.SUPER_ADMIN,
      'UNIVERSITY_ADMIN': UserRole.UNIVERSITY_ADMIN,
      'COMPANY_ADMIN': UserRole.COMPANY_ADMIN,
      'UNIVERSITY_SUPERVISOR': UserRole.UNIVERSITY_SUPERVISOR,
      'COMPANY_TRAINER': UserRole.COMPANY_TRAINER,
      'STUDENT': UserRole.STUDENT,

      'SUPERADMIN': UserRole.SUPER_ADMIN,
      'UNIVERSITYADMIN': UserRole.UNIVERSITY_ADMIN,
      'COMPANYADMIN': UserRole.COMPANY_ADMIN,
      'UNIVERSITYSUPERVISOR': UserRole.UNIVERSITY_SUPERVISOR,
      'COMPANYTRAINER': UserRole.COMPANY_TRAINER,

      'SUPER': UserRole.SUPER_ADMIN,
      'UNI_ADMIN': UserRole.UNIVERSITY_ADMIN,
      'COMP_ADMIN': UserRole.COMPANY_ADMIN,
      'SUPERVISOR': UserRole.UNIVERSITY_SUPERVISOR,
      'TRAINER': UserRole.COMPANY_TRAINER,
      'STUD': UserRole.STUDENT, 
      'STD': UserRole.STUDENT,


      'ADMIN': UserRole.SUPER_ADMIN,
      'UNIVERSITY': UserRole.UNIVERSITY_ADMIN,
      'COMPANY': UserRole.COMPANY_ADMIN,
    };

    const roleDisplayNames: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Super Admin',
      [UserRole.UNIVERSITY_ADMIN]: 'University Admin',
      [UserRole.COMPANY_ADMIN]: 'Company Admin',
      [UserRole.UNIVERSITY_SUPERVISOR]: 'University Supervisor',
      [UserRole.COMPANY_TRAINER]: 'Company Trainer',
      [UserRole.STUDENT]: 'Student',
    };

    const normalizedRole = role
      .toUpperCase()
      .replace(/_/g, '')
      .replace(/\s/g, '');

    let userRole = roleMap[normalizedRole];

    if (!userRole) {
      userRole = roleMap[role.toUpperCase()];
    }

    if (!userRole) {
      const allowedRoles = Object.values(roleDisplayNames).join(', ');
      throw new BadRequestException(
        `Invalid role "${role}". Allowed roles: ${allowedRoles}`
      );
    }

    const users = await this.prisma.user.findMany({
      where: { role: userRole },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role : true,
        isActive: true,
        university: {
          select: { id: true, name: true },
        },
        company: {
          select: { id: true, name: true },
        },
        createdAt: true,
        studentProfile: {
          select: {
            studentNumber: true,
            major: true,
          },
        },
        userStatuses: {
          select: {
            status: true,
            lastSeen: true,
          },
          take: 1,
          orderBy: { lastSeen: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedUsers = users.map((user) => {
      const latestStatus = user.userStatuses?.[0];
      return {
        ...user,
        lastSeen: latestStatus?.lastSeen || null,
        status: latestStatus?.status || 'OFFLINE',
        userStatuses: undefined,
      };
    });

    const finalData = convertBigIntFields(formattedUsers);

    if (finalData.length === 0) {
      return {
        data: [],
        message: `No ${roleDisplayNames[userRole]} users found`,
      };
    }

    return { data: finalData };
  }


  

  async getUsersByUniversity(universityId: number) {
    return this.prisma.user.findMany({
      where: { universityId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUsersByCompany(companyId: number) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }



  async getUserStatistics() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleDistribution,
      universityDistribution,
      companyDistribution,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      this.prisma.user.groupBy({
        by: ['universityId'],
        _count: true,
        where: { universityId: { not: null } },
      }),
      this.prisma.user.groupBy({
        by: ['companyId'],
        _count: true,
        where: { companyId: { not: null } },
      }),
    ]);

    const universityIds = universityDistribution.map(u => u.universityId!).filter(id => id !== null);
    const companyIds = companyDistribution.map(c => c.companyId!).filter(id => id !== null);

    const universities = await this.prisma.university.findMany({
      where: { id: { in: universityIds } },
      select: { id: true, name: true },
    });

    const companies = await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, name: true },
    });

    const universityMap = new Map(universities.map(u => [u.id, u.name]));
    const companyMap = new Map(companies.map(c => [c.id, c.name]));

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleDistribution: roleDistribution.map(item => ({
        role: item.role,
        count: item._count,
      })),
      universityDistribution: universityDistribution.map(item => ({
        universityId: item.universityId,
        universityName: item.universityId ? universityMap.get(item.universityId) || 'Unknown' : null,
        count: item._count,
      })),
      companyDistribution: companyDistribution.map(item => ({
        companyId: item.companyId,
        companyName: item.companyId ? companyMap.get(item.companyId) || 'Unknown' : null,
        count: item._count,
      })),
    };
  }




  async getUniversityName(id: number): Promise<string | null> {
    const university = await this.prisma.university.findUnique({
      where: { id },
      select: { name: true },
    });
    return university?.name || null;
  }

  async getCompanyName(id: number): Promise<string | null> {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: { name: true },
    });
    return company?.name || null;
  }


  private async updateUserStatus(userId: number, status: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY') {
    const userStatus = await this.prisma.userStatus.upsert({
      where: { userId },
      update: {
        status,           
        lastSeen: new Date(),
      },
      create: {
        userId,
        status,
        lastSeen: new Date(),
      },
      select: {
        updatedAt: true, 
      },
    });

    return userStatus?.updatedAt || null;
  }

}



// function convertArrayBigInts(formattedUsers: { lastSeen: Date; status: $Enums.StatusType; userStatuses: undefined; id: number; email: string; firstName: string; lastName: string; phone: string | null; isActive: boolean; createdAt: Date; studentProfile: { studentNumber: bigint; major: string | null; } | null; university: { id: number; name: string; } | null; company: { id: number; name: string; } | null; }[]) {
//   throw new Error('Function not implemented.');
// }
