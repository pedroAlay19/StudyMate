import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-user.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateStudentsDto extends PartialType(CreateStudentDto) {
    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
