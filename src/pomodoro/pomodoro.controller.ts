import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PromodoroService } from './pomodoro.service';
import { CreatePromodoroSessionDto } from './dto/create-pomodoro-session.dto';
import { UpdatePromodoroSessionDto } from './dto/update-pomodoro-session.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import type { UserPayload } from '../auth/interfaces/user.interface';

@Controller('pomodoro')
@UseGuards(AuthGuard) 
export class PromodoroController {
  constructor(private readonly pomodoroService: PromodoroService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createPromodoroSessionDto: CreatePromodoroSessionDto,
    @ActiveUser() user: UserPayload,
  ) {
    console.log(`User ${user.email} starting Pomodoro session`);
    return this.pomodoroService.create(createPromodoroSessionDto);
  }

  @Get()
  findAll(@ActiveUser() user: UserPayload) {
    console.log(`User ${user.email} fetching all Pomodoro sessions`);
    return this.pomodoroService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.pomodoroService.findOne(id);
  }

  @Get('task/:taskId')
  findByTask(
    @Param('taskId') taskId: string,
    @ActiveUser() user: UserPayload,
  ) {
    console.log(`User ${user.email} fetching Pomodoro sessions for task ${taskId}`);
    return this.pomodoroService.findByTask(taskId);
  }

  @Get('stats/:taskId')
  getStatsByTask(
    @Param('taskId') taskId: string,
    @ActiveUser() user: UserPayload,
  ) {
    console.log(`User ${user.email} fetching Pomodoro stats for task ${taskId}`);
    return this.pomodoroService.getStatsByTask(taskId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePromodoroSessionDto: UpdatePromodoroSessionDto,
    @ActiveUser() user: UserPayload,
  ) {
    console.log(`User ${user.email} updating Pomodoro session ${id}`);
    return this.pomodoroService.update(id, updatePromodoroSessionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @ActiveUser() user: UserPayload,
  ) {
    console.log(`User ${user.email} deleting Pomodoro session ${id}`);
    return this.pomodoroService.remove(id);
  }
}
