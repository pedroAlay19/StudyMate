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
  //Enddpoint de subida de archivos
  @Post('upload/:taskId')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // Carpeta destinada a guardar los archivos
        filename: (_req, file, cb) => {
          //Esto genera el nombre único para evitar conflictos entre archivos
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
      },
      fileFilter: (req, file, cb) => {
        // Permite solo ciertos tipos de archivos
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
  async uploadFile(
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @ActiveUser() user: UserPayload, // 🔐 Usuario autenticado
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    console.log(`User ${user.email} uploading file to task ${taskId}`);

    // Crear el DTO con la información del archivo
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

  // 🆕 Endpoint para subir archivos a SUPABASE (en la nube)
  @Post('upload/supabase/:taskId')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
      },
      fileFilter: (_req, file, cb) => {
        // Permite solo ciertos tipos de archivos
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
    @ActiveUser() user: UserPayload, // 🔐 Usuario autenticado
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    console.log(`User ${user.email} uploading to Supabase - task ${taskId}`);

    // Llamar al servicio que sube a Supabase
    return await this.attachmentsService.uploadToSupabase(file, taskId);
  }

  // Endpoint original para crear attachment manualmente (sin archivo físico)
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
  findOne(
    @Param('id') id: string,
  ) {
    return this.attachmentsService.findOne(id);
  }

  @Get('task/:taskId')
  findByTask(
    @Param('taskId') taskId: string,
  ) {
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
  remove(
    @Param('id') id: string,
    @ActiveUser() user: UserPayload,
  ) {
    console.log(`User ${user.email} deleting attachment ${id}`);
    return this.attachmentsService.remove(id);
  }
}
