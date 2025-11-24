import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import type{ JwtPayload } from '@supabase/supabase-js';
import { UserRole } from '../users/entities/user.role';
import { Auth } from '../auth/decorators/auth.decorator';


@Controller('subjects')
@Auth(UserRole.STUDENT)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  create(@Body() createSubjectDto: CreateSubjectDto, @ActiveUser() user: JwtPayload) {
    return this.subjectsService.create(createSubjectDto, user);
  }

  @Get()
  findAll(@ActiveUser() user: JwtPayload) {
    return this.subjectsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }
}
