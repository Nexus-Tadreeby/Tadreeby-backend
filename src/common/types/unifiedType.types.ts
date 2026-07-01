import { HttpStatus } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Prisma } from '@prisma/client';
// ============================================
//  Basic Types
// ============================================

export type objectType = Record<string, unknown>;

export type authedUserType = {
  id: number;
  role: UserRole;
  email?: string;
  firstName?: string;
  lastName?: string;
  universityId?: number | null;
  companyId?: number | null;
  isActive?: boolean;
  sid?: string
};

// ============================================
//  Pagination Types
// ============================================

export type Params = {
  q?: string;
  isActive?: boolean;
  categoryId?: number;
  page: number;
  limit: number;
};

export type PaginationQueryType = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PaginationResponseType = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

// ============================================
// Success Response Types
// ============================================

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiPaginationSuccessResponse<T> = {
  success: true;
  data: T[];
  meta: PaginationResponseType;
  message?: string;
};

export type PaginationResult<T> = {
  data: T[];
  meta: PaginationResponseType;
};

// ============================================
//  Error Response Types
// ============================================

export type ErrorField = {
  field: string;
  message: string;
  code?: string;
  received?: any;
  expected?: string;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  timestamp: string;
  statusCode: HttpStatus;
  path: string;
  fields?: ErrorField[];
  details?: any;
  stack?: string; // Only in development
};

// ============================================
//  Unified Response Types
// ============================================

export type UnifiedApiResponse<T> =
  | ApiSuccessResponse<T>
  | ApiPaginationSuccessResponse<T>
  | ApiErrorResponse;

// ============================================
//  Helper Functions for Responses
// ============================================

/**
 * Create a success response
 */
export function successResponse<T>(data: T, message?: string): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * Create a paginated success response
 */
export function paginatedSuccessResponse<T>(
  data: T[],
  meta: PaginationResponseType,
  message?: string,
): ApiPaginationSuccessResponse<T> {
  return {
    success: true,
    data,
    meta,
    ...(message && { message }),
  };
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  statusCode: HttpStatus,
  path: string,
  fields?: ErrorField[],
  details?: any,
): ApiErrorResponse {
  return {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    statusCode,
    path,
    ...(fields && { fields }),
    ...(details && { details }),
  };
}

// ============================================
//  Common Response Types
// ============================================
;

export type IdResponse = {
  id: number;
};

export type IdsResponse = {
  ids: number[];
};

export type StatusResponse = {
  status: 'success' | 'error' | 'pending';
  message?: string;
};

// ============================================
//  Auth Response Types
// ============================================

export type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
};



export type AuthUserResponse = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  personalID: number;
  phone: string | null;
  profileImage: string | null;
  role: UserRole;
  universityId: number | null;
  companyId: number | null;
  isActive: boolean;
  createdAt: Date;  
  studentProfile: {
    userId: number;
    universityId: number;
    studentNumber: number;
    major: string | null;
    academicYear: number | null;
    gpa: number | null;
    cvUrl: string | null;
    verificationDocument: string;
    approvalStatus: string;
    approvedAt: Date | null;  
    rejectionReason: string | null;
  } | null;
};

export type LoginResponseData = {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
};

export type RegisterResponseData = {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
};

export type SessionsResponseData = {
  sessions: Array<{
    id: string;
    deviceInfo: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    lastUsedAt: Date | null;
    expiresAt: Date;
    isCurrent: boolean;
  }>;
  total: number;
};

export type MessageResponse = {
  message: string;
};



// ============================================
//  Session Types
// ============================================

export type SessionResponse = {
  id: string;
  deviceInfo: string | null;  
  deviceType: string | null;   
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date;
  isCurrent: boolean;
};



// ============================================
//  Dashboard Types
// ============================================

export type DashboardStats = {
  totalUsers?: number;
  totalStudents?: number;
  totalSupervisors?: number;
  totalTrainers?: number;
  totalInternships?: number;
  totalUniversities?: number;
  totalCompanies?: number;
};

export type UserRoleDistribution = {
  [key in UserRole]?: number;
};

export type InternshipStatusDistribution = {
  ACTIVE?: number;
  COMPLETED?: number;
  CLOSED?: number;
};

export type UniversityStatisticsResponse = {
  totalUsers: number;
  totalStudents: number;
  totalSupervisors: number;
  totalInternships: number;
  userRoles: UserRoleDistribution;
  internshipStatuses: InternshipStatusDistribution;
};

// ============================================
//  Analytics Types
// ============================================

export type ChartDataPoint = {
  label: string;
  value: number;
  [key: string]: any;
};

export type ChartData = {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }>;
};

export type ReportData = {
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  data: any;
};

// ============================================
//  Utility Types
// ============================================

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type SortOptions = {
  field: string;
  order: 'asc' | 'desc';
};

export type FilterOptions = {
  search?: string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  [key: string]: any;
};

export type QueryOptions = {
  pagination?: {
    page?: number;
    limit?: number;
  };
  sort?: SortOptions | SortOptions[];
  filters?: FilterOptions;
  includes?: string[];
};




export type UniversityWithCounts = Prisma.UniversityGetPayload<{
  include: {
    _count: {
      select: {
        users: true;
        students: true;
        supervisors: true;
        internships: true;
      };
    };
  };
}>;