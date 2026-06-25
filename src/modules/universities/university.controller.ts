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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UniversityService } from './university.service';
import {
  createUniversitySchema,
  type CreateUniversitySchemaDto
} from './validation/create-university.validation';
import {
  updateUniversitySchema,
  type UpdateUniversitySchemaDto
} from './validation/update-university.validation';
import {
  UniversityQuerySchema,
  type UniversityQueryType
} from './validation/university-query.validation';
import { PaginationInterceptor } from 'src/common/interceptors/pagination.interceptor';
import { ApiSuccessResponse, ApiPaginationSuccessResponse } from 'src/common/types/unifiedType.types';
import { University, UserRole } from '@prisma/client';
import { ZodValidationPipe } from 'src/common/pipes/zod.pipe';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { StudentRestrictedGuard } from 'src/common/guards/student-restricted.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';

@ApiTags('Universities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, StudentRestrictedGuard)
@Controller('universities')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) { }

  @Post("create")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new university' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'University created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'University already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  async create(
    @Body(new ZodValidationPipe(createUniversitySchema))
    createUniversityDto: CreateUniversitySchemaDto,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<University>> {
    console.log(`👤 ${user.email} (${user.role}) is creating a university`);

    const data = await this.universityService.create(createUniversityDto);

    return {
      success: true,
      data,
    };
  }

  @Get()
  @Roles([UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_SUPERVISOR])
  @ApiOperation({
    summary: 'Get all universities with search, filters & pagination',
    description: 'Supports searching by name, shortCode, email, or description. Filter by status, location, and phone.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated list of universities',
  })
  @UseInterceptors(PaginationInterceptor)
  async findAll(
    @Query(new ZodValidationPipe(UniversityQuerySchema))
    query: UniversityQueryType,
    @AuthedUser() user: any,
  ): Promise<ApiPaginationSuccessResponse<University>> {
    console.log(`👤 ${user.email} (${user.role}) is fetching universities`);

    const result = await this.universityService.findAll(query);

    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles([UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_SUPERVISOR])
  @ApiOperation({ summary: 'Get university by ID with details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns university details',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'University not found',
  })
  async findOne(
    @Param('id') id: string,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<University>> {
    console.log(`👤 ${user.email} (${user.role}) is fetching university ${id}`);

    // ✅ Check if user has access to this university
    if (user.role !== UserRole.SUPER_ADMIN && user.universityId !== +id) {
      throw new ForbiddenException('You can only view your own university');
    }

    const data = await this.universityService.findOne(+id);

    return {
      success: true,
      data,
    };
  }

  @Get(':id/statistics')
  @Roles([UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN])
  @ApiOperation({ summary: 'Get university statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns university statistics',
  })
  async getStatistics(
    @Param('id') id: string,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<any>> {
    console.log(`👤 ${user.email} (${user.role}) is fetching statistics for university ${id}`);

    // ✅ Check if user has access to this university's statistics
    if (user.role !== UserRole.SUPER_ADMIN && user.universityId !== +id) {
      throw new ForbiddenException('You can only view statistics for your own university');
    }

    const data = await this.universityService.getUniversityStatistics(+id);

    return {
      success: true,
      data,
    };
  }

  @Patch(':id')
  @Roles([UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN])
  @ApiOperation({ summary: 'Update university' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'University updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'University not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'University name or shortCode already exists',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You can only update your own university',
  })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUniversitySchema))
    updateUniversityDto: UpdateUniversitySchemaDto,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<University>> {
    console.log(`👤 ${user.email} (${user.role}) is updating university ${id}`);

    // ✅ Ownership check: Only SUPER_ADMIN or the university's admin can update
    if (user.role !== UserRole.SUPER_ADMIN && user.universityId !== +id) {
      throw new ForbiddenException('You can only update your own university');
    }

    const data = await this.universityService.update(+id, updateUniversityDto);

    return {
      success: true,
      data,
    };
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate university (soft delete)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'University deactivated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'University not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Super Admin can deactivate universities',
  })
  async deactivate(
    @Param('id') id: string,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<University>> {
    console.log(`👤 ${user.email} (${user.role}) is deactivating university ${id}`);

    const data = await this.universityService.deactivate(+id);

    return {
      success: true,
      data,
    };
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate university' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'University activated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'University not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Super Admin can activate universities',
  })
  async activate(
    @Param('id') id: string,
    @AuthedUser() user: any,
  ): Promise<ApiSuccessResponse<University>> {
    console.log(`👤 ${user.email} (${user.role}) is activating university ${id}`);

    const data = await this.universityService.activate(+id);

    return {
      success: true,
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete university (hard delete - use with caution)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'University deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'University not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Super Admin can delete universities',
  })
  async remove(
    @Param('id') id: string,
    @AuthedUser() user: any,
  ): Promise<void> {
    console.log(`👤 ${user.email} (${user.role}) is deleting university ${id}`);

    await this.universityService.remove(+id);
  }
}