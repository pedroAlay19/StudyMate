import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp } from '../test-helpers';
import { DataSource } from 'typeorm';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let studentToken: string;
  let adminUserId: string;
  let studentUserId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);

    // Crear usuario ADMIN
    const adminData = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
    };

    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(adminData);

    adminUserId = adminResponse.body.studentId;

    // Actualizar el rol a ADMIN manualmente (esto simula tener un admin en el sistema)
    // En producción, esto se haría con un seeder o script de migración
    const dataSource = app.get(DataSource);
    await dataSource.query(`UPDATE users SET role = 'Admin' WHERE "studentId" = $1`, [adminUserId]);

    // Login del admin
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: adminData.email,
        password: adminData.password,
      });

    adminToken = adminLoginResponse.body.access_token;

    // Crear usuario STUDENT normal
    const studentData = {
      name: 'Student User',
      email: 'student@example.com',
      password: 'student123',
    };

    const studentResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(studentData);

    studentUserId = studentResponse.body.studentId;

    // Login del student
    const studentLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: studentData.email,
        password: studentData.password,
      });

    studentToken = studentLoginResponse.body.access_token;
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await closeTestApp(app);
  });

  describe('POST /users (crear usuario)', () => {
    it('debería permitir a un ADMIN crear un nuevo usuario', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('studentId');
      expect(response.body.name).toBe(newUser.name);
      expect(response.body.email).toBe(newUser.email);
    });

    it('debería denegar acceso a un STUDENT (usuario normal)', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser2@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newUser)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('debería denegar acceso sin autenticación', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser3@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(newUser)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('debería fallar con datos de validación incorrectos', async () => {
      const invalidUser = {
        name: 'A', // Muy corto
        email: 'invalid-email',
        password: '123',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUser)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /users (listar todos los usuarios)', () => {
    it('debería permitir a un ADMIN ver todos los usuarios', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2); // Al menos admin y student
    });

    it('debería denegar acceso a un STUDENT', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /users/:id (obtener usuario por ID)', () => {
    it('debería permitir a un ADMIN obtener un usuario por ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${studentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.studentId).toBe(studentUserId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
    });

    it('debería denegar acceso a un STUDENT', async () => {
      await request(app.getHttpServer())
        .get(`/users/${adminUserId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('debería retornar 404 si el usuario no existe', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .get(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .get(`/users/${studentUserId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PATCH /users/:id (actualizar usuario)', () => {
    it('debería permitir a un ADMIN actualizar un usuario', async () => {
      const updateData = {
        name: 'Updated Student Name',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${studentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.studentId).toBe(studentUserId);
    });

    it('debería denegar acceso a un STUDENT', async () => {
      const updateData = {
        name: 'Trying to Update',
      };

      await request(app.getHttpServer())
        .patch(`/users/${adminUserId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('debería retornar 404 si el usuario no existe', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = {
        name: 'New Name',
      };

      await request(app.getHttpServer())
        .patch(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería denegar acceso sin autenticación', async () => {
      const updateData = {
        name: 'New Name',
      };

      await request(app.getHttpServer())
        .patch(`/users/${studentUserId}`)
        .send(updateData)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('DELETE /users/:id (eliminar usuario)', () => {
    it('debería permitir a un ADMIN eliminar un usuario', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${studentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.OK);

      // Verificar que el usuario ya no existe
      await request(app.getHttpServer())
        .get(`/users/${studentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería denegar acceso a un STUDENT', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${adminUserId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('debería retornar 404 si el usuario no existe', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .delete(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${studentUserId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
