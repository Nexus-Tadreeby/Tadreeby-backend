import { HttpStatus } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export type objectType = Record<string, unknown>;
export type authedUserType = {
  id: number;
  role: UserRole;
};


export type Params = {
  q?: string
  isActive?: boolean
  categoryId?: number
  page: number
  limit: number
}

export type PaginationQueryType = {
  page?: number;
  limit?: number;
};

export type PaginationResponseType = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiPaginationSuccessResponse<T> = {
  success: true;
  data: T[];
  meta: PaginationResponseType;
};

export type PaginationResult<T> = {
  data: T[];
  meta: PaginationResponseType;
};

export type ErrorField = {
  field: string;
  message: string;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  timestamp: string;
  statusCode: HttpStatus;
  path: string;
  fields?: ErrorField[];
};

export type UnifiedApiResponse<T> =
  | ApiSuccessResponse<T>
  | ApiPaginationSuccessResponse<T>
  | ApiErrorResponse;
