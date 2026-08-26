// modules/users/users.controller.ts
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiNotFoundResponse, ApiConflictResponse, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { UserQuerySchema, type UserQueryType } from './validation/user-query.validation';
import { ZodValidationPipe } from 'src/common/pipes/zod.pipe';
import { ApiSuccessResponse, ApiPaginationSuccessResponse } from 'src/common/types/unifiedType.types';
import { AuthedUser } from 'src/common/decorators/authedUser.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }






  @Get('all')
  @Roles([UserRole.SUPER_ADMIN])
  @ApiOperation({
    summary: 'Get all users with advanced filters',
    description: `
      Retrieve a paginated list of all users with advanced filtering options.
      
      **Available Filters:**
      - \`search\`: Search by name, email, or phone
      - \`role\`: Filter by specific role (STUDENT, UNIVERSITY_ADMIN, etc.)
      - \`isActive\`: Filter by active/inactive status
      - \`universityId\`: Filter users by university
      - \`companyId\`: Filter users by company
      - \`page\`: Page number for pagination
      - \`limit\`: Number of items per page
    `,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by first name, last name, email, or phone',
    example: 'John',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Filter by user role',
    example: 'STUDENT',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active/inactive status',
    example: true,
  })
  @ApiQuery({
    name: 'universityId',
    required: false,
    type: Number,
    description: 'Filter by university ID',
    example: 1,
  })
  @ApiQuery({
    name: 'companyId',
    required: false,
    type: Number,
    description: 'Filter by company ID',
    example: 1,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
    example: 1,
    default: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (max 100)',
    example: 20,
    default: 20,
  })
  @ApiOkResponse({
    description: 'Returns paginated list of users',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 1,
            firstName: 'shahd',
            lastName: 'abu sharif',
            email: 'eng.shahd.abusharif@.com',
            recoveryEmail: "shahd.abusharif@.com",
            phone: '0592246851',
            role: 'STUDENT',
            isActive: true,
            universityId: 1,
            companyId: null,
            profileImage: null,
            createdAt: '2026-07-01T10:00:00.000Z',
            updatedAt: '2026-07-05T10:00:00.000Z',
            university: {
              id: 1,
              name: 'Islamic University of Gaza',
              shortCode: 'IUG',
            },
            company: null,
            studentProfile: {
              major: 'Computer Science',
              studentNumber: 20200970,
              approvalStatus: 'APPROVED',
            },
          },
        ],
        meta: {
          page: 1,
          limit: 20,
          total: 25,
          totalPages: 2,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  async getAllUsers(
    @Query(new ZodValidationPipe(UserQuerySchema)) query: UserQueryType,
  ): Promise<ApiPaginationSuccessResponse<any>> {
    console.log('🔍 Query received:', query); 
    const result = await this.usersService.getAllUsers(query);
    let message: string | undefined;

    if (result.data.length === 0) {
      if (query.search) {
        message = `No users found matching "${query.search}"`;
      }
      else if (query.role) {
        const roleNames: Record<string, string> = {
          SUPER_ADMIN: 'Super Admin',
          UNIVERSITY_ADMIN: 'University Admin',
          COMPANY_ADMIN: 'Company Admin',
          UNIVERSITY_SUPERVISOR: 'University Supervisor',
          COMPANY_TRAINER: 'Company Trainer',
          STUDENT: 'Student',
        };
        message = `No ${roleNames[query.role] || query.role} users found`;
      }
      else if (query.isActive === true) {
        message = 'No active users found';
      }
      else if (query.isActive === false) {
        message = 'No inactive users found';
      }
      else if (query.universityId) {
        const university = await this.usersService.getUniversityName(query.universityId);
        message = university
          ? `No users found in "${university}"`
          : `No users found for university ID: ${query.universityId}`;
      }
      else if (query.companyId) {
        const company = await this.usersService.getCompanyName(query.companyId);
        message = company
          ? `No users found in "${company}"`
          : `No users found for company ID: ${query.companyId}`;
      }
      else {
        message = 'No users found in the system';
      }
    }

    return {
      success: true,
      data: result.data,
      meta: result.meta,
      ...(message && {message})
    };
  }



  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile of the currently authenticated user with role-specific details.',
  })
  @ApiOkResponse({
    description: 'Returns user profile',
    schema: {
      example: {
        success: true,
        data: {
          profile: {
            id: 1,
            firstName: 'shahd',
            lastName: 'abu sharif',
            email: 'eng.shahd.abusharif@.com',
            phone: '0592246851',
            role: 'STUDENT',
            isActive: true,
            universityId: 1,
            companyId: null,
            profileImage: null,
            personalID: 123456789,
            recoveryEmail: "shahd.abusharif@.com",
            createdAt: '2026-07-01T10:00:00.000Z',
            university: {
              id: 1,
              name: 'Islamic University of Gaza',
              shortCode: 'IUG',
            },
            company: null,
            studentProfile: {
              studentNumber: 20200970,
              major: 'Computer Science',
              academicYear: 3,
              gpa: 3.5,
              approvalStatus: 'APPROVED',
            },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getProfile(@AuthedUser() user: any): Promise<ApiSuccessResponse<any>> {
    const data = await this.usersService.getProfile(user.id);
    return { success: true, data };
  }







  @Get('statistics')
  @Roles([UserRole.SUPER_ADMIN])
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Retrieve comprehensive statistics about users including distribution by role, university, and company.',
  })
  @ApiOkResponse({
    description: 'Returns user statistics',
    schema: {
      example: {
        success: true,
        data: {
          totalUsers: 150,
          activeUsers: 130,
          inactiveUsers: 20,
          roleDistribution: [
            { role: 'SUPER_ADMIN', count: 1 },
            { role: 'UNIVERSITY_ADMIN', count: 5 },
            { role: 'COMPANY_ADMIN', count: 3 },
            { role: 'UNIVERSITY_SUPERVISOR', count: 15 },
            { role: 'COMPANY_TRAINER', count: 10 },
            { role: 'STUDENT', count: 116 },
          ],
          universityDistribution: [
            { universityId: 1, universityName: 'Islamic University of Gaza', count: 50 },
            { universityId: 2, universityName: 'Al-Azhar University', count: 40 },
          ],
          companyDistribution: [
            { companyId: 1, companyName: 'Tech Company', count: 20 },
            { companyId: 2, companyName: 'Health Company', count: 15 },
          ],
        },
      },
    },
  })
  async getUserStatistics(): Promise<ApiSuccessResponse<any>> {
    const data = await this.usersService.getUserStatistics();
    return { success: true, data };
  }

  


  @Get(':id')
  @Roles([UserRole.SUPER_ADMIN])
  @ApiOperation({
    summary: 'Get user by ID with full details',
    description: 'Retrieve detailed information about a specific user including role-specific profiles.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'User ID',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Returns user details',
    schema: {
      example: {
        success: true,
        data: {
          id: 1,
          firstName: 'shahd',
          lastName: 'abu sharif',
          email: 'eng.shahd.abusharif@.com',
          phone: '0592246851',
          role: 'STUDENT',
          isActive: true,
          universityId: 1,
          companyId: null,
          profileImage: null,
          personalID: 123456789,
          recoveryEmail: "shahd.abusharif@.com",
          lastSeen: '2026-07-05T10:00:00.000Z',
          status: 'ONLINE',
          createdAt: '2026-07-01T10:00:00.000Z',
          updatedAt: '2026-07-05T10:00:00.000Z',
          university: {
            id: 1,
            name: 'Islamic University of Gaza',
            shortCode: 'IUG',
          },
          company: null,
          studentProfile: {
            studentNumber: 202012345,
            major: 'Computer Science',
            academicYear: 3,
            gpa: 3.5,
            approvalStatus: 'APPROVED',
            approvedAt: '2026-07-02T10:00:00.000Z',
            rejectionReason: null,
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserById(@Param('id') id: string): Promise<ApiSuccessResponse<any>> {
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId < 1) {
      throw new BadRequestException('Invalid user ID');
    }
    const data = await this.usersService.getUserById(+id);
    return { success: true, data };
  }

  
  



  @Get('role/:role')
  @Roles([UserRole.SUPER_ADMIN])
  @ApiOperation({
    summary: 'Get users by role',
    description: 'Retrieve all users with a specific role.',
  })
  @ApiParam({
    name: 'role',
    enum: UserRole,
    description: 'User role to filter by',
    example: 'STUDENT',
  })
  @ApiOkResponse({
    description: 'Returns users with the specified role',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 1,
            firstName: 'shahd',
            lastName: 'abu sharif',
            email: 'eng.shahd.abusharif@.com',
            phone: '0592246851',
            recoveryEmail: "shahd.abusharif@.com",
            isActive: true,
            university: {
              id: 1,
              name: 'Al - Azhar University - Gaza',
            },
            company: null,
            createdAt: '2026-07-01T10:00:00.000Z',
          },
        ],
      },
    },
  })
  async getUsersByRole(@Param('role') role: UserRole): Promise<ApiSuccessResponse<any>> {
    const data = await this.usersService.getUsersByRole(role);
    return { success: true, data };
  }


  


  @Get('university/:id')
  @Roles([UserRole.SUPER_ADMIN])
  @ApiOperation({
    summary: 'Get users by university',
    description: 'Retrieve all users belonging to a specific university.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'University ID',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Returns users in the university',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 1,
            firstName: 'shahd',
            lastName: 'abu sharif',
            email: 'eng.shahd.abusharif@.com',
            phone: '0592246851',
            recoveryEmail: "shahd.abusharif@.com",
            role: 'STUDENT',
            isActive: true,
            createdAt: '2026-07-01T10:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({ description: 'University not found' })
  async getUsersByUniversity(@Param('id') id: string): Promise<ApiSuccessResponse<any>> {
    const data = await this.usersService.getUsersByUniversity(+id);


    if (data.length === 0) {
      const university = await this.usersService.getUniversityName(+id);
      const universityName = university || `University ID: ${id}`;

      return {
        success: true,
        data: [],
        message: `No users found in "${universityName}"`,
      };
    }

    return { success: true, data };
  
  }


  


  @Get('company/:id')
  @Roles([UserRole.SUPER_ADMIN])
  @ApiOperation({
    summary: 'Get users by company',
    description: 'Retrieve all users belonging to a specific company.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Company ID',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Returns users in the company',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 1,
            firstName: 'shahd',
            lastName: 'abu sharif',
            email: 'eng.shahd.abusharif@.com',
            phone: '0592246851',
            recoveryEmail: "shahd.abusharif@.com",
            role: 'COMPANY_TRAINER',
            isActive: true,
            createdAt: '2026-07-01T10:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Company not found' })
  async getUsersByCompany(@Param('id') id: string): Promise<ApiSuccessResponse<any>> {
    const data = await this.usersService.getUsersByCompany(+id);


    if (data.length === 0) {
      const company = await this.usersService.getCompanyName(+id);
      const companyName = company || `Company ID: ${id}`;

      return {
        success: true,
        data: [],
        message: `No users found in "${companyName}"`,
      };
    }


    return { success: true, data };
  }


  


  @Patch(':id/activate')
  @Roles([UserRole.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate a user',
    description: 'Activate a deactivated user account.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'User ID to activate',
    example: 1,
  })
  @ApiOkResponse({
    description: 'User activated successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 1,
          firstName: 'shahd',
          lastName: 'abu sharif',
          email: 'eng.shahd.abusharif@.com',
          phone: '0592246851',
          recoveryEmail: "shahd.abusharif@.com",
          isActive: true,
          updatedAt: '2026-07-05T10:00:00.000Z',
        },
        message: 'User activated successfully',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Cannot activate Super Admin' })
  async activateUser(@Param('id') id: string): Promise<ApiSuccessResponse<any>> {
    const data = await this.usersService.activateUser(+id);
    return {
      success: true,
      data,
      message: 'User activated successfully',
    };
  }


  
  

  @Patch(':id/deactivate')
  @Roles([UserRole.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate a user',
    description: 'Deactivate a user account (soft delete).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'User ID to deactivate',
    example: 1,
  })
  @ApiOkResponse({
    description: 'User deactivated successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 1,
          firstName: 'shahd',
          lastName: 'abu sharif',
          email: 'eng.shahd.abusharif@.com',
          phone: '0592246851',
          recoveryEmail: "shahd.abusharif@.com",
          isActive: false,
          updatedAt: '2026-07-05T10:00:00.000Z',
        },
        message: 'User deactivated successfully',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Cannot deactivate Super Admin' })
  async deactivateUser(@Param('id') id: string): Promise<ApiSuccessResponse<any>> {
    const data = await this.usersService.deactivateUser(+id);
    return {
      success: true,
      data,
      message: 'User deactivated successfully',
    };
  }


  


  @Delete(':id')
  @Roles([UserRole.SUPER_ADMIN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a user',
    description: 'Permanently delete a user from the system. This action is irreversible and will remove all associated data.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'User ID to delete',
    example: 1,
  })
  @ApiOkResponse({
    description: 'User deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'User deleted successfully',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Cannot delete Super Admin' })
  async deleteUser(@Param('id') id: string): Promise<ApiSuccessResponse<any>> {
    await this.usersService.deleteUser(+id);
    return {
      data: null, 
      success: true,
      message: 'User deleted successfully',
    };


  }























  // @Get('all')
  // @Roles([UserRole.SUPER_ADMIN])
  // @ApiOperation({ summary: 'Get all users (Super Admin only)' })
  // @ApiQuery({ name: 'search', required: false })
  // @ApiQuery({ name: 'role', required: false, enum: UserRole })
  // @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  // @ApiQuery({ name: 'page', required: false, type: Number })
  // @ApiQuery({ name: 'limit', required: false, type: Number })
  // async getAllUsers(
  //   @Query(new ZodValidationPipe(UserQuerySchema)) query: UserQueryType,
  // ): Promise<ApiPaginationSuccessResponse<any>> {
  //   const result = await this.usersService.getAllUsers(query);
  //   return { success: true, data: result.data, meta: result.meta };
  // }

  // @Patch(':id/deactivate')
  // @Roles([UserRole.SUPER_ADMIN])
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Deactivate a user' })
  // async deactivateUser(@Param('id') id: string): Promise<ApiSuccessResponse<any>> {
  //   const data = await this.usersService.deactivateUser(+id);
  //   return { success: true, data };
  // }

  // @Patch(':id/activate')
  // @Roles([UserRole.SUPER_ADMIN])
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Activate a user' })
  // async activateUser(@Param('id') id: string): Promise<ApiSuccessResponse<any>> {
  //   const data = await this.usersService.activateUser(+id);
  //   return { success: true, data };
  // }

  // @Delete(':id')
  // @Roles([UserRole.SUPER_ADMIN])
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @ApiOperation({ summary: 'Delete a user' })
  // async deleteUser(@Param('id') id: string): Promise<void> {
  //   await this.usersService.deleteUser(+id);
  // }

  // @Get('profile')
  // @ApiOperation({ summary: 'Get current user profile' })
  // async getProfile(@AuthedUser() user: any): Promise<ApiSuccessResponse<any>> {
  //   const data = await this.usersService.getProfile(user.id);
  //   return { success: true, data };
  // }
}