import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import type{ ScheduleItem } from '../entities/subject.entity';
import { Type } from 'class-transformer';

export class ScheduleItemDto implements ScheduleItem {
  @IsString()
  day: string;

  @IsString()
  start: string;

  @IsString()
  end: string;
}

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  assignedTeacher: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  schedule: ScheduleItemDto[];

  @IsString()
  @IsNotEmpty()
  color: string;
}