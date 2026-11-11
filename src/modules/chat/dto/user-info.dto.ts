import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client'; 

export class UserDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'shahd.abusharif@gmail.com' })
    email!: string;

    @ApiProperty({ example: 'Shahd' })
    firstName!: string;

    @ApiProperty({ example: 'Abu Sharif' })
    lastName!: string;

    @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
    profileImage?: string | null;

    @ApiProperty({ example: 'STUDENT', enum: UserRole })
    role!: UserRole;

    @ApiProperty({ example: true })
    isActive!: boolean;

    // // Optional: Include a computed fullName for convenience
    // @ApiProperty({ example: 'Shahd Abu Sharif' })
    // get fullName(): string {
    //     return `${this.firstName} ${this.lastName}`;
    // }
}