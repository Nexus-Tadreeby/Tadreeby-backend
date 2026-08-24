import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class FilterDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    dateFrom?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    dateTo?: Date;
}
