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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import type { UserPayload } from '../auth/interfaces/user.interface';

@Controller('attachments')
@UseGuards(AuthGuard) // 🔐 Proteger todo el controlador
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  // ============================================
  // 1. SUBIR ARCHIVO LOCAL (uploads/)
  // ============================================
  @Post('upload/:taskId')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        const allowedMimes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip/;
        const mimeValid = allowedMimes.test(file.mimetype);
        const extValid = allowedMimes.test(extname(file.originalname).toLowerCase());

        if (mimeValid && extValid) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type. Allowed: images, PDF, Word, TXT, ZIP'), false);
        }
      },
    }),
  )
  async uploadLocal(
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @ActiveUser() user: UserPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    console.log(`User ${user.email} uploading LOCAL file to task ${taskId}`);

    const createAttachmentDto: CreateAttachmentDto = {
      fileName: file.filename,
      originalName: file.originalname,
      fileUrl: `./uploads/${file.filename}`,
      mimeType: file.mimetype,
      fileSize: file.size,
      taskId,
    };

    return await this.attachmentsService.create(createAttachmentDto);
  }

  // ============================================
  // 2. SUBIR ARCHIVO A SUPABASE (NUBE)
  // ============================================
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
        const extValid = allowedMimes.test(extname(file.originalname).toLowerCase());

        if (mimeValid && extValid) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type. Allowed: images, PDF, Word, TXT, ZIP'), false);
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
