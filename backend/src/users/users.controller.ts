import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateStudentDto } from './dto/create-user.dto';
import { UpdateStudentsDto } from './dto/update-user.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { UserRole } from './entities/user.role';

@Controller('users')
@Auth(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.usersService.create(createStudentDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentsDto: UpdateStudentsDto) {
    return this.usersService.update(id, updateStudentsDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
