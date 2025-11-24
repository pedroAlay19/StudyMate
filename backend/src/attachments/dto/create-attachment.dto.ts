import { IsString, IsNotEmpty, IsNumber, IsUUID, IsOptional } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  originalName: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  @IsNotEmpty()
  fileSize: number;

  @IsUUID()
  @IsNotEmpty()
  taskId: string;
}
