import { Module } from '@nestjs/common';
import { UniversityService } from './university.service';
import { UniversityController } from './university.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
    imports: [DatabaseModule],
  controllers: [UniversityController],
  providers: [UniversityService
    ,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class UniversityModule {}
