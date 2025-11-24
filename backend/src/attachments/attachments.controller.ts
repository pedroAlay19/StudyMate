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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import type { UserPayload } from '../auth/interfaces/user.interface';
import { Auth } from '../auth/decorators/auth.decorator';
import { UserRole } from '../users/entities/user.role';

@Controller('attachments')
@Auth(UserRole.STUDENT)
@UseGuards(AuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload/supabase/:taskId')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        const allowedMimes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/;
        const mimeValid = allowedMimes.test(file.mimetype);
        const extValid = allowedMimes.test(
          extname(file.originalname).toLowerCase(),
        );

        if (mimeValid && extValid) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Allowed: images, PDF, Word, TXT, ZIP',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadToSupabase(
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @ActiveUser() user: UserPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    console.log(`User ${user.email} uploading to SUPABASE - task ${taskId}`);

    return await this.attachmentsService.uploadToSupabase(file, taskId);
  }

  // ============================================
  // CRUD NORMAL
  // ============================================
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createAttachmentDto: CreateAttachmentDto,
    @ActiveUser() user: UserPayload,
  ) {
    console.log(`User ${user.email} creating attachment`);
    return this.attachmentsService.create(createAttachmentDto);
  }

  @Get()
  findAll(@ActiveUser() user: UserPayload) {
    console.log(`User ${user.email} fetching all attachments`);
    return this.attachmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attachmentsService.findOne(id);
  }

  @Get('task/:taskId')
  findByTask(@Param('taskId') taskId: string) {
    return this.attachmentsService.findByTask(taskId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAttachmentDto: UpdateAttachmentDto,
    @ActiveUser() user: UserPayload,
  ) {
    console.log(`User ${user.email} updating attachment ${id}`);
    return this.attachmentsService.update(id, updateAttachmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @ActiveUser() user: UserPayload) {
    console.log(`User ${user.email} deleting attachment ${id}`);
    return this.attachmentsService.remove(id);
  }
}
