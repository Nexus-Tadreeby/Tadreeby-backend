import { UserRole } from "@prisma/client";

export type JwtPayload = {
    sub: number;
    role: UserRole;
};

export type AuthUser = {
    id: number;
    email: string;
    role: UserRole;
    universityId?: number | null;
    companyId?: number | null;
    isActive: boolean;
};

