import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseService } from 'src/database/database.service';
import { CreateCompanySchemaDto } from './validation/create-company.validation';
import { UpdateCompanySchemaDto } from './validation/update-company.validation';
import { CompanyQueryType } from './validation/company-query.validation';
import { PaginationResult } from 'src/common/types/unifiedType.types';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: DatabaseService) { }

  


  
  async create(dto: CreateCompanySchemaDto) {
    const exists = await this.prisma.company.findFirst({
      where: {
        OR: [{ shortCode: dto.shortCode }, { name: dto.name }],
      },
    });

    if (exists) {
      throw new ConflictException(
        `Company with name "${exists.name}" or shortCode "${exists.shortCode}" already exists`,
      );
    }

    return this.prisma.company.create({ data: dto });
  }


  



  async findAll(query: CompanyQueryType): Promise<PaginationResult<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { search, isActive, location, phone, sortBy = 'id', sortOrder = 'desc' } = query;

    const where: Prisma.CompanyWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortCode: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) where.isActive = isActive;
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (phone) where.phone = { contains: phone, mode: 'insensitive' };

    const skip = (page - 1) * limit;
    const take = limit;

    const orderBy: Prisma.CompanyOrderByWithRelationInput = {};
    const validSortFields: Record<string, keyof Prisma.CompanyOrderByWithRelationInput> = {
      id: 'id',
      name: 'name',
      shortCode: 'shortCode',
    };
    const sortField = validSortFields[sortBy] || 'id';
    orderBy[sortField] = sortOrder as Prisma.SortOrder;

    try {
      const [data, total] = await Promise.all([
        this.prisma.company.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            _count: {
              select: {
                users: true,
                trainers: true,
                internships: true,
                opportunities: true,
              },
            },
          },
        }),
        this.prisma.company.count({ where }),
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientInitializationError) {
        throw new Error('Database connection error. Please check your database configuration.');
      }
      throw error;
    }
  }

  





  async search(query: { q: string; page?: number; limit?: number }): Promise<PaginationResult<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { q } = query;

    const where: Prisma.CompanyWhereInput = {};
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
      this.prisma.company.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              users: true,
              trainers: true,
              internships: true,
              opportunities: true,
            },
          },
        },
      }),
      this.prisma.company.count({ where }),
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

  



  async findOne(id: number) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            trainers: true,
            internships: true,
            opportunities: true,
          },
        },
      },
    });

    if (!company) throw new NotFoundException('Company not found');
    return company;
  }


  




  async update(id: number, dto: UpdateCompanySchemaDto) {
    await this.findOne(id);

    if (dto.shortCode || dto.name) {
      const exists = await this.prisma.company.findFirst({
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
          `Company with ${field} "${dto[field as keyof typeof dto]}" already exists`,
        );
      }
    }

    return this.prisma.company.update({
      where: { id },
      data: dto,
    });
  }


  



  async deactivate(id: number) {
    await this.findOne(id);
    return this.prisma.company.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: number) {
    await this.findOne(id);
    return this.prisma.company.update({
      where: { id },
      data: { isActive: true },
    });
  }


  



  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.company.delete({ where: { id } });
  }


  





  async uploadLogo(id: number, file: Express.Multer.File): Promise<{ filename: string; url: string }> {
    const company = await this.findOne(id);

    // Delete old logo if exists
    if (company.logo) {
      const oldPath = path.join(
        process.env.UPLOAD_PATH || './uploads',
        'logos',
        'companies',
        String(id),
        company.logo,
      );
      try {
        if (fs.existsSync(oldPath)) {
          await fs.promises.unlink(oldPath);
        }
      } catch (error) {

        if (error instanceof Error) {
          console.warn('Old logo could not be deleted:', error.message);
        } else {
          console.warn('Old logo could not be deleted:', error);
        }
      }
    }






    // Save new logo
    const uploadDir = path.join(
      process.env.UPLOAD_PATH || './uploads',
      'logos',
      'companies',
      String(id),
    );
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const ext = path.extname(file.originalname);
    const filename = `logo-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, file.buffer);

    await this.prisma.company.update({
      where: { id },
      data: { logo: filename },
    });

    const baseUrl = process.env.BASE_URL || 'http://localhost:6060';
    const url = `${baseUrl}/api/v1/files/logos/companies/${id}/${filename}`;

    return { filename, url };
  }








  async deleteLogo(id: number): Promise<void> {
    const company = await this.findOne(id);
    if (!company.logo) throw new NotFoundException('Logo not found');

    const filePath = path.join(
      process.env.UPLOAD_PATH || './uploads',
      'logos',
      'companies',
      String(id),
      company.logo,
    );
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {

      if (error instanceof Error) {
        console.warn('Logo file could not be deleted:', error.message);
      } else {
        console.warn('Logo file could not be deleted:', error);
      }
    }

    await this.prisma.company.update({
      where: { id },
      data: { logo: null },
    });
  }

  





  async getCompanyStatistics(id: number) {
    await this.findOne(id);

    const stats = await this.prisma.company.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            users: true,
            trainers: true,
            internships: true,
            opportunities: true,
          },
        },
        users: {
          where: { isActive: true },
          select: { role: true },
        },
        internships: {
          select: { status: true },
        },
        opportunities: {
          select: { isActive: true },
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
      totalTrainers: stats?._count.trainers || 0,
      totalInternships: stats?._count.internships || 0,
      totalOpportunities: stats?._count.opportunities || 0,
      activeOpportunities: stats?.opportunities.filter(o => o.isActive).length || 0,
      userRoles,
      internshipStatuses,
    };
  }
}