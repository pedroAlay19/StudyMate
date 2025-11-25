import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('SupabaseService', () => {
  let service: SupabaseService;
  let configService: ConfigService;

  const mockSupabaseClient = {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
      if (key === 'SUPABASE_KEY') return 'test-key-123';
      return null;
    });

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
    configService = module.get<ConfigService>(ConfigService);

    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('debería crear el cliente de Supabase con las credenciales correctas', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
        if (key === 'SUPABASE_KEY') return 'test-key-123';
        return null;
      });

      (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SupabaseService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<SupabaseService>(SupabaseService);

      expect(mockConfigService.get).toHaveBeenCalledWith('SUPABASE_URL');
      expect(mockConfigService.get).toHaveBeenCalledWith('SUPABASE_KEY');
      expect(createClient).toHaveBeenCalledWith('https://test.supabase.co', 'test-key-123');
    });

    it('debería lanzar un error si falta SUPABASE_URL', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SUPABASE_URL') return null;
        if (key === 'SUPABASE_KEY') return 'test-key-123';
        return null;
      });

      await expect(
        Test.createTestingModule({
          providers: [
            SupabaseService,
            {
              provide: ConfigService,
              useValue: mockConfigService,
            },
          ],
        }).compile(),
      ).rejects.toThrow('SUPABASE_URL and SUPABASE_KEY must be defined in .env file');
    });

    it('debería lanzar un error si falta SUPABASE_KEY', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
        if (key === 'SUPABASE_KEY') return null;
        return null;
      });

      await expect(
        Test.createTestingModule({
          providers: [
            SupabaseService,
            {
              provide: ConfigService,
              useValue: mockConfigService,
            },
          ],
        }).compile(),
      ).rejects.toThrow('SUPABASE_URL and SUPABASE_KEY must be defined in .env file');
    });

    it('debería lanzar un error si faltan ambas variables', async () => {
      mockConfigService.get.mockReturnValue(null);

      await expect(
        Test.createTestingModule({
          providers: [
            SupabaseService,
            {
              provide: ConfigService,
              useValue: mockConfigService,
            },
          ],
        }).compile(),
      ).rejects.toThrow('SUPABASE_URL and SUPABASE_KEY must be defined in .env file');
    });
  });

  describe('getClient', () => {
    it('debería retornar el cliente de Supabase', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
        if (key === 'SUPABASE_KEY') return 'test-key-123';
        return null;
      });

      (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SupabaseService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<SupabaseService>(SupabaseService);

      const client = service.getClient();

      expect(client).toBe(mockSupabaseClient);
      expect(client).toHaveProperty('from');
      expect(client).toHaveProperty('storage');
    });
  });
});