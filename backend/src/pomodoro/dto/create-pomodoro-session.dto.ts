import { IsUUID, IsNotEmpty, IsInt, Min, Max, IsOptional, IsBoolean } from 'class-validator';

export class CreatePromodoroSessionDto {
  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @IsInt()
  @Min(1)
  @Max(120)
  @IsOptional()
  duration_min?: number; // Por defecto 25 minutos, máximo 2 horas

  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  break_time?: number; // Por defecto 25 minutos, máximo 2 horas

  @IsInt()
  @Min(0)
  @IsOptional()
  breaks_taken?: number;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
