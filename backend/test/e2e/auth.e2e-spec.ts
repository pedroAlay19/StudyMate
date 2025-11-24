import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp } from '../test-helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await closeTestApp(app);
  });

  describe('POST /auth/register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const newUser = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('studentId');
      expect(response.body.name).toBe(newUser.name);
      expect(response.body.email).toBe(newUser.email);
      expect(response.body).toHaveProperty('password'); // El servicio devuelve la password hasheada
      expect(response.body.password).not.toBe(newUser.password); // Debe estar hasheada
    });

    it('debería fallar si el email ya existe', async () => {
      const userData = {
        name: 'Test User',
        email: 'duplicate@example.com',
        password: 'password123',
      };

      // Registrar el primer usuario
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(HttpStatus.CREATED);

      // Intentar registrar con el mismo email (debería devolver 409 Conflict)
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(HttpStatus.CONFLICT);
    });

    it('debería fallar con datos de validación incorrectos', async () => {
      const invalidData = {
        name: 'T', // Muy corto (mínimo 2 caracteres)
        email: 'invalid-email', // Email inválido
        password: '123', // Muy corta (mínimo 6 caracteres)
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería fallar si falta el nombre', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería fallar si falta el email', async () => {
      const invalidData = {
        name: 'Test User',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería fallar si falta la contraseña', async () => {
      const invalidData = {
        name: 'Test User',
        email: 'test@example.com',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('POST /auth/login', () => {
    it('debería autenticar un usuario y retornar un token JWT', async () => {
      // Registrar usuario primero
      const userData = {
        name: 'Login Test User',
        email: 'logintest@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      // Intentar login (devuelve 201 Created)
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
    });

    it('debería fallar con credenciales incorrectas', async () => {
      // Devuelve 400 porque el email no pasa la validación del DTO
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería fallar si la contraseña es incorrecta', async () => {
      // Registrar usuario
      const userData = {
        name: 'Test User',
        email: 'testpass@example.com',
        password: 'correctpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      // Intentar login con contraseña incorrecta
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('debería fallar con datos de validación incorrectos', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: '123',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /auth/profile', () => {
    it('debería retornar el perfil del usuario autenticado', async () => {
      // Registrar y hacer login
      const userData = {
        name: 'Profile Test User',
        email: 'profiletest@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      const token = loginResponse.body.access_token;

      // Obtener perfil
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(response.body.email).toBe(userData.email);
      expect(response.body.name).toBe(userData.name);
      expect(response.body).toHaveProperty('studentId');
    });

    it('debería fallar sin token de autenticación', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('debería fallar con un token inválido', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('debería fallar con un token expirado o mal formado', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
