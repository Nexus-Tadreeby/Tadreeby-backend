import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { CreateUniversitySchemaDto } from './validation/create-university.validation';
import { UpdateUniversitySchemaDto } from './validation/update-university.validation';
import { UniversityQueryType } from './validation/university-query.validation';
import { authedUserType, PaginationResult, UniversityWithCounts } from 'src/common/types/unifiedType.types';

@Injectable()
export class UniversityService {
  constructor(private readonly prisma: DatabaseService) { }

  async create(dto: CreateUniversitySchemaDto) {
    const exists = await this.prisma.university.findFirst({
      where: {
        OR: [{ shortCode: dto.shortCode }, { name: dto.name }],
      },
    });

    if (exists) {
      throw new ConflictException(
        `University with name "${exists.name}" or shortCode "${exists.shortCode}" already exists`,
      );
    }

    return this.prisma.university.create({
      data: dto,
    });
  }







  async findAll(query: UniversityQueryType): Promise<PaginationResult<UniversityWithCounts>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const {
      search,
      isActive,
      location,
      phone,
      sortBy = 'id',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.UniversityWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortCode: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (phone) {
      where.phone = { contains: phone, mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const orderBy: Prisma.UniversityOrderByWithRelationInput = {};

    const validSortFields: Record<string, keyof Prisma.UniversityOrderByWithRelationInput> = {
      'id': 'id',
      'name': 'name',
      'shortCode': 'shortCode',
    };

    const sortField = validSortFields[sortBy] || 'id';
    orderBy[sortField] = sortOrder as Prisma.SortOrder;

    try {
      const [data, total] = await Promise.all([
        this.prisma.university.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            _count: {
              select: {
                users: true,
                students: true,
                supervisors: true,
                internships: true,
              },
            },
          },
        }),
        this.prisma.university.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      // Add hasNextPage and hasPreviousPage
      return {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientInitializationError) {
        throw new Error('Database connection error. Please check your database configuration.');
      }
      throw error;
    }
  }






  async findOne(id: number) {
    const university = await this.prisma.university.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            supervisors: true,
            internships: true,
          },
        },
      },
    });

    if (!university) {
      throw new NotFoundException('University not found');
    }

    return university;
  }

  async update(id: number, dto: UpdateUniversitySchemaDto, currentUser: authedUserType) {
    await this.findOne(id);


    if (currentUser.role === UserRole.UNIVERSITY_ADMIN) {
      //to ensure the UNI ADMIN updates his own university
        if (currentUser.universityId !== id) {
        throw new ForbiddenException('You can only update your own university');
      }
      delete dto.name;
      delete dto.shortCode;
    }

    
    if (dto.shortCode || dto.name) {
      const exists = await this.prisma.university.findFirst({
        where: {
          AND: [
            { NOT: { id } },
            {
              OR: [
                ...(dto.shortCode ? [{ shortCode: dto.shortCode }] : []),
                ...(dto.name ? [{ name: dto.name }] : []),
              ],
            },
          ],
        },
      });

      if (exists) {
        const field = exists.shortCode === dto.shortCode ? 'shortCode' : 'name';
        throw new ConflictException(
          `University with ${field} "${dto[field as keyof typeof dto]}" already exists`,
        );
      }
    }

    return this.prisma.university.update({
      where: { id },
      data: dto,
    });
  }







  async deactivate(id: number) {
    await this.findOne(id);

    return this.prisma.university.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  async activate(id: number) {
    await this.findOne(id);

    return this.prisma.university.update({
      where: { id },
      data: {
        isActive: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.university.delete({
      where: { id },
    });
  }

  async findByName(name: string) {
    return this.prisma.university.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
  }

  async findByShortCode(shortCode: string) {
    return this.prisma.university.findUnique({
      where: { shortCode },
    });
  }

  async getUniversityStatistics(id: number) {
    await this.findOne(id);

    const stats = await this.prisma.university.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            users: true,
            students: true,
            supervisors: true,
            internships: true,
          },
        },
        users: {
          where: { isActive: true },
          select: {
            role: true,
          },
        },
        internships: {
          select: {
            status: true,
          },
        },
      },
    });

    const userRoles = stats?.users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const internshipStatuses = stats?.internships.reduce((acc, internship) => {
      acc[internship.status] = (acc[internship.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUsers: stats?._count.users || 0,
      totalStudents: stats?._count.students || 0,
      totalSupervisors: stats?._count.supervisors || 0,
      totalInternships: stats?._count.internships || 0,
      userRoles,
      internshipStatuses,
    };
  }



  async search(query: { q: string; page?: number; limit?: number }): Promise<PaginationResult<UniversityWithCounts>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { q } = query;

    const where: Prisma.UniversityWhereInput = {};

    if (q && q.trim()) {
      const searchTerm = q.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { shortCode: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [data, total] = await Promise.all([
      this.prisma.university.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              users: true,
              students: true,
              supervisors: true,
              internships: true,
            },
          },
        },
      }),
      this.prisma.university.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
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

  
}


