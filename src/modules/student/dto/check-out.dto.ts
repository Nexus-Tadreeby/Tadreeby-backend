import { ApiProperty } from '@nestjs/swagger';

export class CheckOutDto {
    @ApiProperty({ required: false, default: {} })
    dummy?: string;
}