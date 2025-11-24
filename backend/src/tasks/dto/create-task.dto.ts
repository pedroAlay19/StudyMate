import { IsString, IsNotEmpty, IsDateString, IsUUID, IsEnum, IsOptional, ValidatorConstraint, ValidatorConstraintInterface, Validate, ValidationArguments } from 'class-validator';
import { TaskState, TaskPriority } from '../entities/task.entity';

// Validador personalizado: fecha de entrega no puede ser anterior a fecha de inicio
@ValidatorConstraint({ name: 'IsAfterStartDate', async: false })
export class IsAfterStartDate implements ValidatorConstraintInterface {
  validate(delivery_date: string | Date, args: ValidationArguments) {
    const obj = args.object as CreateTaskDto;
    
    // Manejar tanto strings como Dates
    const startDate = typeof obj.start_date === 'string' 
      ? new Date(obj.start_date + 'T00:00:00') 
      : new Date(obj.start_date);
    startDate.setHours(0, 0, 0, 0);
    
    const deliveryDate = typeof delivery_date === 'string'
      ? new Date(delivery_date + 'T00:00:00')
      : new Date(delivery_date);
    deliveryDate.setHours(0, 0, 0, 0);
    
    return deliveryDate >= startDate;
  }

  defaultMessage() {
    return 'Delivery date must be equal to or after start date';
  }
}

// Validador personalizado: fecha de inicio no puede ser en el pasado
@ValidatorConstraint({ name: 'IsNotPastDate', async: false })
export class IsNotPastDate implements ValidatorConstraintInterface {
  validate(date: string | Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    // Si llega como string (formato ISO), crear Date desde el string
    const inputDate = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
    inputDate.setHours(0, 0, 0, 0);
    
    // Permite fecha de hoy o futuras
    return inputDate >= today;
  }

  defaultMessage() {
    return 'Start date cannot be in the past';
  }
}

export class CreateTaskDto {
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsNotEmpty()
  @Validate(IsNotPastDate, {
    message: 'Start date cannot be in the past',
  })
  start_date: Date;

  @IsDateString()
  @IsNotEmpty()
  @Validate(IsAfterStartDate, {
    message: 'Delivery date must be equal to or after start date',
  })
  delivery_date: Date;

  @IsEnum(TaskPriority)
  @IsNotEmpty()
  priority: TaskPriority;

  @IsEnum(TaskState)
  @IsNotEmpty()
  state: TaskState;
}