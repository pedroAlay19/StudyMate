import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp } from '../test-helpers';

describe('Subjects (e2e)', () => {
  let app: INestApplication;
  let studentToken: string;
  let studentId: string;
  let anotherStudentToken: string;
  let createdSubjectId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);

    // Crear primer estudiante
    const studentData = {
      name: 'Student One',
      email: 'student1@example.com',
      password: 'password123',
    };

    const studentResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(studentData);

    studentId = studentResponse.body.studentId;

    // Login del primer estudiante
    const studentLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: studentData.email,
        password: studentData.password,
      });

    studentToken = studentLoginResponse.body.access_token;

    // Crear segundo estudiante para probar aislamiento
    const anotherStudentData = {
      name: 'Student Two',
      email: 'student2@example.com',
      password: 'password123',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(anotherStudentData);

    // Login del segundo estudiante
    const anotherStudentLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: anotherStudentData.email,
        password: anotherStudentData.password,
      });

    anotherStudentToken = anotherStudentLoginResponse.body.access_token;
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await closeTestApp(app);
  });

  describe('POST /subjects (crear materia)', () => {
    it('debería permitir a un estudiante crear una materia', async () => {
      const newSubject = {
        name: 'Matemáticas',
        assignedTeacher: 'Prof. García',
        schedule: [
          {
            day: 'Lunes',
            start: '08:00',
            end: '10:00',
          },
          {
            day: 'Miércoles',
            start: '08:00',
            end: '10:00',
          },
        ],
        color: '#FF5733',
      };

      const response = await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newSubject)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('subjectId');
      expect(response.body.name).toBe(newSubject.name);
      expect(response.body.assignedTeacher).toBe(newSubject.assignedTeacher);
      expect(response.body.color).toBe(newSubject.color);
      expect(response.body.schedule).toEqual(newSubject.schedule);

      createdSubjectId = response.body.subjectId;
    });

    it('debería crear una materia sin horario (schedule opcional)', async () => {
      const newSubject = {
        name: 'Física',
        assignedTeacher: 'Prof. Martínez',
        color: '#33FF57',
      };

      const response = await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newSubject)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('subjectId');
      expect(response.body.name).toBe(newSubject.name);
    });

    it('debería denegar acceso sin autenticación', async () => {
      const newSubject = {
        name: 'Química',
        assignedTeacher: 'Prof. López',
        color: '#3357FF',
      };

      await request(app.getHttpServer())
        .post('/subjects')
        .send(newSubject)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('debería fallar con datos de validación incorrectos', async () => {
      const invalidSubject = {
        name: '',
        assignedTeacher: '',
        color: '',
      };

      await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(invalidSubject)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería fallar si falta un campo requerido', async () => {
      const incompleteSubject = {
        name: 'Historia',
        // Falta assignedTeacher y color
      };

      await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(incompleteSubject)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /subjects (listar materias)', () => {
    beforeEach(async () => {
      // Crear una materia para el primer estudiante
      const subject1 = {
        name: 'Matemáticas',
        assignedTeacher: 'Prof. García',
        color: '#FF5733',
      };

      await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(subject1);

      // Crear otra materia para el primer estudiante
      const subject2 = {
        name: 'Física',
        assignedTeacher: 'Prof. Martínez',
        color: '#33FF57',
      };

      await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(subject2);

      // Crear una materia para el segundo estudiante
      const subject3 = {
        name: 'Química',
        assignedTeacher: 'Prof. López',
        color: '#3357FF',
      };

      await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${anotherStudentToken}`)
        .send(subject3);
    });

    it('debería listar solo las materias del estudiante autenticado', async () => {
      const response = await request(app.getHttpServer())
        .get('/subjects')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // Solo las 2 materias del primer estudiante
      expect(response.body.every((subject) => subject.name !== 'Química')).toBe(true);
    });

    it('debería retornar un array vacío si el estudiante no tiene materias', async () => {
      // Limpiar y crear un nuevo estudiante sin materias
      await cleanDatabase(app);

      const newStudentData = {
        name: 'New Student',
        email: 'newstudent@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(newStudentData);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: newStudentData.email,
          password: newStudentData.password,
        });

      const newToken = loginResponse.body.access_token;

      const response = await request(app.getHttpServer())
        .get('/subjects')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .get('/subjects')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /subjects/:id (obtener materia por ID)', () => {
    beforeEach(async () => {
      // Crear una materia
      const subject = {
        name: 'Matemáticas',
        assignedTeacher: 'Prof. García',
        schedule: [
          {
            day: 'Lunes',
            start: '08:00',
            end: '10:00',
          },
        ],
        color: '#FF5733',
      };

      const response = await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(subject);

      createdSubjectId = response.body.subjectId;
    });

    it('debería obtener una materia por ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.subjectId).toBe(createdSubjectId);
      expect(response.body.name).toBe('Matemáticas');
      expect(response.body.assignedTeacher).toBe('Prof. García');
    });

    it('debería retornar 404 si la materia no existe', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .get(`/subjects/${fakeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .get(`/subjects/${createdSubjectId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PATCH /subjects/:id (actualizar materia)', () => {
    beforeEach(async () => {
      // Crear una materia
      const subject = {
        name: 'Matemáticas',
        assignedTeacher: 'Prof. García',
        color: '#FF5733',
      };

      const response = await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(subject);

      createdSubjectId = response.body.subjectId;
    });

    it('debería actualizar una materia', async () => {
      const updateData = {
        name: 'Matemáticas Avanzadas',
        assignedTeacher: 'Prof. Rodríguez',
      };

      const response = await request(app.getHttpServer())
        .patch(`/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.assignedTeacher).toBe(updateData.assignedTeacher);
      expect(response.body.color).toBe('#FF5733'); // El color no cambia
    });

    it('debería actualizar solo el horario de una materia', async () => {
      const updateData = {
        schedule: [
          {
            day: 'Martes',
            start: '14:00',
            end: '16:00',
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .patch(`/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.schedule).toEqual(updateData.schedule);
      expect(response.body.name).toBe('Matemáticas'); // El nombre no cambia
    });

    it('debería retornar 404 si la materia no existe', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = {
        name: 'Nueva Materia',
      };

      await request(app.getHttpServer())
        .patch(`/subjects/${fakeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería denegar acceso sin autenticación', async () => {
      const updateData = {
        name: 'Nueva Materia',
      };

      await request(app.getHttpServer())
        .patch(`/subjects/${createdSubjectId}`)
        .send(updateData)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('DELETE /subjects/:id (eliminar materia)', () => {
    beforeEach(async () => {
      // Crear una materia
      const subject = {
        name: 'Matemáticas',
        assignedTeacher: 'Prof. García',
        color: '#FF5733',
      };

      const response = await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(subject);

      createdSubjectId = response.body.subjectId;
    });

    it('debería eliminar una materia', async () => {
      await request(app.getHttpServer())
        .delete(`/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      // Verificar que la materia ya no existe
      await request(app.getHttpServer())
        .get(`/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería retornar 404 si la materia no existe', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .delete(`/subjects/${fakeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .delete(`/subjects/${createdSubjectId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
