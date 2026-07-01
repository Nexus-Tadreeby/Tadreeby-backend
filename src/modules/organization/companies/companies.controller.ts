import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UseGuards,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import {
  CreateCompanySchema,
  type CreateCompanySchemaDto,
} from './validation/create-company.validation';
import {
  UpdateCompanySchema,
 type UpdateCompanySchemaDto,
} from './validation/update-company.validation';
import {
  CompanyQuerySchema,
  type CompanyQueryType,
} from './validation/company-query.validation';
import { ZodValidationPipe } from 'src/common/pipes/zod.pipe';
import { PaginationInterceptor } from 'src/common/interceptors/pagination.interceptor';
import { ApiSuccessResponse } from 'src/common/types/unifiedType.types';
import { Company, UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) { }


  
  
  @Post()
  @Roles([UserRole.SUPER_ADMIN])
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: HttpStatus.CREATED })
  async create(
    @Body(new ZodValidationPipe(CreateCompanySchema))
    dto: CreateCompanySchemaDto,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<Company>> {
    console.log(`👤 ${user.email} (${user.role}) is creating a company`);
    const data = await this.companiesService.create(dto);
    return { success: true, data };
  }

 
  



  @Get()
  @Roles([UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.COMPANY_TRAINER])
  @UseInterceptors(PaginationInterceptor)
  @ApiOperation({ summary: 'Get all companies with filters & pagination' })
  @ApiResponse({ status: HttpStatus.OK })
  async findAll(
    @Query(new ZodValidationPipe(CompanyQuerySchema))
    query: CompanyQueryType,
    @AuthedUser() user: any,
  ) {
    console.log(`👤 ${user.email} (${user.role}) is fetching companies`);
    return this.companiesService.findAll(query);
  }

  



  @Get('search')
  @ApiOperation({ summary: 'Search companies by name or shortCode' })
  @ApiQuery({ name: 'q', type: 'string', description: 'Search query' })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @UseInterceptors(PaginationInterceptor)
  async search(
    @AuthedUser() user: any,
    @Query('q') q: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    console.log(`👤 ${user.email} (${user.role}) is searching companies with query: ${q}`);
    const result = await this.companiesService.search({
      q: q || '',
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }


  



  @Get(':id')
  @Roles([UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.COMPANY_TRAINER])
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: HttpStatus.OK })
  async findOne(
    @Param('id') id: string,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<Company>> {
    console.log(`👤 ${user.email} (${user.role}) is fetching company ${id}`);
    if (user.role === UserRole.COMPANY_ADMIN && user.companyId !== +id) {
      throw new ForbiddenException('You can only view your own company');
    }
    const data = await this.companiesService.findOne(+id);
    return { success: true, data };
  }


  



  @Patch(':id')
  @Roles([UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN])
  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({ status: HttpStatus.OK })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanySchemaDto | UpdateCompanySchemaDto,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<Company>> {
    console.log(`👤 ${user.email} (${user.role}) is updating company ${id}`);

    if (user.role === UserRole.COMPANY_ADMIN && user.companyId !== +id) {
      throw new ForbiddenException('You can only update your own company');
    }

    let validatedData: any;
    if (user.role === UserRole.SUPER_ADMIN) {
      const result = UpdateCompanySchema.safeParse(dto);
      if (!result.success) throw new BadRequestException('Invalid update data');
      validatedData = result.data;
    } else {
      const result = UpdateCompanySchema.safeParse(dto);
      if (!result.success) throw new BadRequestException('Invalid update data');
      if ((dto as any).name || (dto as any).shortCode || (dto as any).isActive !== undefined) {
        throw new ForbiddenException('Company Admin cannot update name, shortCode, or isActive');
      }
      validatedData = result.data;
    }

    const data = await this.companiesService.update(+id, validatedData);
    return { success: true, data };
  }

 
  



  @Patch(':id/deactivate')
  @Roles([UserRole.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate company' })
  @ApiResponse({ status: HttpStatus.OK })
  async deactivate(
    @Param('id') id: string,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<Company>> {
    console.log(`👤 ${user.email} (${user.role}) is deactivating company ${id}`);
    const data = await this.companiesService.deactivate(+id);
    return { success: true, data };
  }


  



  @Patch(':id/activate')
  @Roles([UserRole.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate company' })
  @ApiResponse({ status: HttpStatus.OK })
  async activate(
    @Param('id') id: string,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<Company>> {
    console.log(`👤 ${user.email} (${user.role}) is activating company ${id}`);
    const data = await this.companiesService.activate(+id);
    return { success: true, data };
  }

  



  @Delete(':id')
  @Roles([UserRole.SUPER_ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete company (hard delete)' })
  async remove(
    @Param('id') id: string,
    @AuthedUser() user: any,
  ): Promise<void> {
    console.log(`👤 ${user.email} (${user.role}) is deleting company ${id}`);
    await this.companiesService.remove(+id);
  }


  



  @Post(':id/logo')
  @Roles([UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN])
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type. Allowed: JPEG, PNG, GIF, WEBP'), false);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload company logo (max 5MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK })
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<{ filename: string; url: string }>> {
    if (!file) throw new BadRequestException('File is required');
    if (user.role === UserRole.COMPANY_ADMIN && user.companyId !== +id) {
      throw new ForbiddenException('You can only upload logo for your own company');
    }
    const result = await this.companiesService.uploadLogo(+id, file);
    return { success: true, data: result };
  }

  



  @Delete(':id/logo')
  @Roles([UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete company logo' })
  @ApiResponse({ status: HttpStatus.OK })
  async deleteLogo(
    @Param('id') id: string,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<{ message: string }>> {
    if (user.role === UserRole.COMPANY_ADMIN && user.companyId !== +id) {
      throw new ForbiddenException('You can only delete logo for your own company');
    }
    await this.companiesService.deleteLogo(+id);
    return { success: true, data: { message: 'Logo deleted successfully' } };
  }


  
  
  @Get(':id/statistics')
  @Roles([UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN])
  @ApiOperation({ summary: 'Get company statistics' })
  @ApiResponse({ status: HttpStatus.OK })
  async getStatistics(
    @Param('id') id: string,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<any>> {
    console.log(`👤 ${user.email} (${user.role}) is fetching statistics for company ${id}`);
    if (user.role === UserRole.COMPANY_ADMIN && user.companyId !== +id) {
      throw new ForbiddenException('You can only view statistics for your own company');
    }
    const data = await this.companiesService.getCompanyStatistics(+id);
    return { success: true, data };
  }
}