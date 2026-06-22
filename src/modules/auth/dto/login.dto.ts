import { ApiProperty } from "@nestjs/swagger";

export class LoginRequestDto {
    @ApiProperty({ example: "shahd.sharif.admin@tadreeby.com" })
  email: string;

  @ApiProperty({ example: "S3cure@Tadreeby2026" })
  password: string;
}

export class LoginUserResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  personalID: number;

  @ApiProperty({ nullable: true })
  phone: string | null;

  @ApiProperty({ nullable: true })
  profileImage: string | null;

  @ApiProperty()
  role: string;

  @ApiProperty({ nullable: true })
  universityId: number | null;

  @ApiProperty({ nullable: true })
  companyId: number | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  studentProfile: any | null;
}

export class LoginResponseDto {
  @ApiProperty({ type: LoginUserResponseDto })
  user: LoginUserResponseDto;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}