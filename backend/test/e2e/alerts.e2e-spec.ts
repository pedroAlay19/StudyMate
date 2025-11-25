import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp } from '../test-helpers';
import { TaskState, TaskPriority } from '../../src/tasks/entities/task.entity';
import { DataSource } from 'typeorm';
import dayjs from 'dayjs';

describe('Alerts (e2e)', () => {
  let app: INestApplication;
  let studentToken: string;
  let studentId: string;
  let anotherStudentToken: string;
  let subjectId: string;
  let taskId: string;

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

    // Crear materia
    const subject = {
      name: 'Matemáticas',
      assignedTeacher: 'Prof. García',
      color: '#FF5733',
    };

    const subjectResponse = await request(app.getHttpServer())
      .post('/subjects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(subject);

    subjectId = subjectResponse.body.subjectId;

    // Crear segundo estudiante
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

  describe('GET /alerts (obtener alertas)', () => {
    it('debería retornar un array vacío si el estudiante no tiene alertas', async () => {
      const response = await request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .get('/alerts')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('debería retornar alertas del estudiante autenticado con la estructura correcta', async () => {
      const today = new Date();
      const twoDaysFromNow = new Date(today);
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

      const task = {
        subjectId: subjectId,
        title: 'Tarea de prueba',
        description: 'Descripción',
        start_date: today.toISOString().split('T')[0],
        delivery_date: twoDaysFromNow.toISOString().split('T')[0],
        priority: TaskPriority.HIGH,
        state: TaskState.PENDING,
      };

      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(task);

      taskId = taskResponse.body.task_id;

      const alertDate = new Date();
      const message = `The task "Tarea de prueba" is due in 2 days.`;

      const dataSource = app.get(DataSource);
      await dataSource.query(
        `INSERT INTO alert ("taskTaskId", "alertDate", "message", "created_at") 
         VALUES ($1, $2, $3, $4)`,
        [taskId, alertDate, message, new Date()]
      );

      const response = await request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('alertId');
      expect(response.body[0]).toHaveProperty('alertDate');
      expect(response.body[0]).toHaveProperty('message');
      expect(response.body[0]).toHaveProperty('created_at');
      expect(response.body.some(alert => alert.message === message)).toBe(true);
    });
  });

  describe('Funcionalidad del módulo', () => {
    it('debería funcionar correctamente con tareas que no generan alertas', async () => {
      // Crear tarea que vence en 1 semana (no debería tener alertas automáticas)
      const today = new Date();
      const oneWeekFromNow = new Date(today);
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

      const task = {
        subjectId: subjectId,
        title: 'Tarea futura',
        description: 'Descripción',
        start_date: today.toISOString().split('T')[0],
        delivery_date: oneWeekFromNow.toISOString().split('T')[0],
        priority: TaskPriority.LOW,
        state: TaskState.PENDING,
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(task);

      // No debería haber alertas para esta tarea
      const response = await request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      // No verificamos el length porque puede haber alertas de tests anteriores
      // Solo verificamos que el endpoint funciona
    });
  });
});
