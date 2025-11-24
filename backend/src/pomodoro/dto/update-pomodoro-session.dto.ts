import { PartialType } from '@nestjs/mapped-types';
import { CreatePromodoroSessionDto } from './create-pomodoro-session.dto';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdatePromodoroSessionDto extends PartialType(CreatePromodoroSessionDto) {
  @IsDateString()
  @IsOptional()
  end_session?: Date;
}
