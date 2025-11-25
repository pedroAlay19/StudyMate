import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { Attachment } from './entities/attachment.entity';
import { Task } from '../tasks/entities/task.entity';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { SupabaseService } from '../supabase/supabase.service';

describe('AttachmentsService', () => {
  let service: AttachmentsService;
  let attachmentRepository: Repository<Attachment>;
  let taskRepository: Repository<Task>;
  let supabaseService: SupabaseService;

  const mockTask = {
    task_id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
  };

  const mockAttachment = {
    attachmentId: 'attachment-1',
    fileName: 'test-file-123.pdf',
    originalName: 'test-file.pdf',
    fileUrl: 'https://supabase.example.com/test-file-123.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    task: mockTask,
    uploadedAt: new Date(),
  };

  const mockFile = {
    originalname: 'test-file.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test content'),
  } as Express.Multer.File;

  const mockAttachmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockTaskRepository = {
    findOne: jest.fn(),
  };

  const mockStorageBucket = {
    upload: jest.fn(),
    getPublicUrl: jest.fn(),
    remove: jest.fn(),
  };

  const mockSupabaseClient = {
    storage: {
      from: jest.fn(() => mockStorageBucket),
    },
  };

  const mockSupabaseService = {
    getClient: jest.fn(() => mockSupabaseClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        {
          provide: getRepositoryToken(Attachment),
          useValue: mockAttachmentRepository,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
    attachmentRepository = module.get<Repository<Attachment>>(getRepositoryToken(Attachment));
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('uploadToSupabase', () => {
    it('debería subir archivo a Supabase exitosamente', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockStorageBucket.upload.mockResolvedValue({ 
        data: { path: 'test-path' }, 
        error: null 
      });
      mockStorageBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://supabase.example.com/test-file-123.pdf' }
      });
      mockAttachmentRepository.create.mockReturnValue(mockAttachment);
      mockAttachmentRepository.save.mockResolvedValue(mockAttachment);

      const result = await service.uploadToSupabase(mockFile, 'task-1');

      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { task_id: 'task-1' },
      });
      expect(mockAttachmentRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockAttachment);
    });

    it('debería lanzar NotFoundException si la tarea no existe', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.uploadToSupabase(mockFile, 'nonexistent-task'))
        .rejects.toThrow(NotFoundException);
    });

    it('debería manejar errores de Supabase', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockStorageBucket.upload.mockResolvedValue({ 
        data: null, 
        error: { message: 'Upload failed' } 
      });

      await expect(service.uploadToSupabase(mockFile, 'task-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('debería crear un attachment local exitosamente', async () => {
      const createAttachmentDto: CreateAttachmentDto = {
        fileName: 'test-file-123.pdf',
        originalName: 'test-file.pdf',
        fileUrl: '/uploads/test-file-123.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        taskId: 'task-1',
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockAttachmentRepository.create.mockReturnValue(mockAttachment);
      mockAttachmentRepository.save.mockResolvedValue(mockAttachment);

      const result = await service.create(createAttachmentDto);

      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { task_id: 'task-1' },
      });
      expect(result).toEqual(mockAttachment);
    });

    it('debería lanzar NotFoundException si la tarea no existe', async () => {
      const createAttachmentDto: CreateAttachmentDto = {
        fileName: 'test-file.pdf',
        originalName: 'test-file.pdf',
        fileUrl: '/uploads/test-file.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        taskId: 'nonexistent-task',
      };

      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createAttachmentDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('debería retornar todos los attachments', async () => {
      const attachments = [mockAttachment];
      mockAttachmentRepository.find.mockResolvedValue(attachments);

      const result = await service.findAll();

      expect(mockAttachmentRepository.find).toHaveBeenCalledWith({
        relations: ['task'],
      });
      expect(result).toEqual(attachments);
    });

    it('debería retornar array vacío si no hay attachments', async () => {
      mockAttachmentRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('debería retornar un attachment por ID', async () => {
      mockAttachmentRepository.findOne.mockResolvedValue(mockAttachment);

      const result = await service.findOne('attachment-1');

      expect(mockAttachmentRepository.findOne).toHaveBeenCalledWith({
        where: { attachmentId: 'attachment-1' },
        relations: ['task'],
      });
      expect(result).toEqual(mockAttachment);
    });

    it('debería lanzar NotFoundException si no encuentra el attachment', async () => {
      mockAttachmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTask', () => {
    it('debería retornar attachments por ID de tarea', async () => {
      const attachments = [mockAttachment];
      mockAttachmentRepository.find.mockResolvedValue(attachments);

      const result = await service.findByTask('task-1');

      expect(mockAttachmentRepository.find).toHaveBeenCalledWith({
        where: { task: { task_id: 'task-1' } },
        relations: ['task'],
      });
      expect(result).toEqual(attachments);
    });
  });

  describe('update', () => {
    it('debería actualizar un attachment exitosamente', async () => {
      const updateAttachmentDto: UpdateAttachmentDto = {
        originalName: 'updated-file.pdf',
      };

      const updatedAttachment = { ...mockAttachment, ...updateAttachmentDto };

      mockAttachmentRepository.findOne.mockResolvedValue(mockAttachment);
      mockAttachmentRepository.save.mockResolvedValue(updatedAttachment);

      const result = await service.update('attachment-1', updateAttachmentDto);

      expect(mockAttachmentRepository.findOne).toHaveBeenCalledWith({
        where: { attachmentId: 'attachment-1' },
        relations: ['task'],
      });
      expect(result).toEqual(updatedAttachment);
    });

    it('debería lanzar NotFoundException si no encuentra el attachment', async () => {
      mockAttachmentRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', { originalName: 'test' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('debería eliminar un attachment exitosamente', async () => {
      mockAttachmentRepository.findOne.mockResolvedValue(mockAttachment);
      mockStorageBucket.remove.mockResolvedValue({ error: null });
      mockAttachmentRepository.remove.mockResolvedValue(mockAttachment);

      await service.remove('attachment-1');

      expect(mockAttachmentRepository.findOne).toHaveBeenCalledWith({
        where: { attachmentId: 'attachment-1' },
        relations: ['task'],
      });
      expect(mockStorageBucket.remove).toHaveBeenCalled();
      expect(mockAttachmentRepository.remove).toHaveBeenCalledWith(mockAttachment);
    });

    it('debería lanzar NotFoundException si no encuentra el attachment', async () => {
      mockAttachmentRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999'))
        .rejects.toThrow(NotFoundException);
    });
  });
});