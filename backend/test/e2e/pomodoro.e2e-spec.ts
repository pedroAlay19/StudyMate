import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp } from '../test-helpers';
import { TaskState, TaskPriority } from '../../src/tasks/entities/task.entity';

describe('Pomodoro (e2e)', () => {
  let app: INestApplication;
  let studentToken: string;
  let studentId: string;
  let anotherStudentToken: string;
  let subjectId: string;
  let taskId: string;
  let anotherTaskId: string;
  let createdSessionId: string;

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

    // Crear tareas
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const task1 = {
      subjectId: subjectId,
      title: 'Tarea de Matemáticas',
      description: 'Resolver ejercicios',
      start_date: today.toISOString().split('T')[0],
      delivery_date: tomorrow.toISOString().split('T')[0],
      priority: TaskPriority.HIGH,
      state: TaskState.PENDING,
    };

    const task1Response = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(task1);

    taskId = task1Response.body.task_id;

    const task2 = {
      subjectId: subjectId,
      title: 'Tarea de Física',
      description: 'Estudiar capítulos',
      start_date: today.toISOString().split('T')[0],
      delivery_date: tomorrow.toISOString().split('T')[0],
      priority: TaskPriority.MEDIUM,
      state: TaskState.IN_PROGRESS,
    };

    const task2Response = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(task2);

    anotherTaskId = task2Response.body.task_id;

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

  describe('POST /pomodoro (crear sesión de pomodoro)', () => {
    it('debería permitir crear una sesión de pomodoro con valores por defecto', async () => {
      const newSession = {
        taskId: taskId,
      };

      const response = await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newSession)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('session_id');
      expect(response.body.duration_min).toBe(25); // Valor por defecto
      expect(response.body.break_time).toBe(5); // Valor por defecto
      expect(response.body.breaks_taken).toBe(0); // Valor por defecto
      expect(response.body.completed).toBe(false); // Valor por defecto
      expect(response.body).toHaveProperty('start_session');

      createdSessionId = response.body.session_id;
    });

    it('debería permitir crear una sesión con valores personalizados', async () => {
      const newSession = {
        taskId: taskId,
        duration_min: 45,
        break_time: 10,
        breaks_taken: 2,
        completed: false,
      };

      const response = await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newSession)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('session_id');
      expect(response.body.duration_min).toBe(45);
      expect(response.body.break_time).toBe(10);
      expect(response.body.breaks_taken).toBe(2);
      expect(response.body.completed).toBe(false);
    });

    it('debería denegar acceso sin autenticación', async () => {
      const newSession = {
        taskId: taskId,
      };

      await request(app.getHttpServer())
        .post('/pomodoro')
        .send(newSession)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('debería fallar con datos de validación incorrectos', async () => {
      const invalidSession = {
        taskId: 'invalid-uuid',
        duration_min: 150, // Excede el máximo de 120
        break_time: 40, // Excede el máximo de 30
        breaks_taken: -1, // Negativo
      };

      await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(invalidSession)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería fallar si falta el campo requerido taskId', async () => {
      const incompleteSession = {
        duration_min: 25,
      };

      await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(incompleteSession)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería fallar si duration_min es menor a 1', async () => {
      const invalidSession = {
        taskId: taskId,
        duration_min: 0,
      };

      await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(invalidSession)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería fallar si break_time es menor a 1', async () => {
      const invalidSession = {
        taskId: taskId,
        break_time: 0,
      };

      await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(invalidSession)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /pomodoro (listar sesiones de pomodoro)', () => {
    beforeEach(async () => {
      // Crear sesiones para el primer estudiante
      const session1 = {
        taskId: taskId,
        duration_min: 25,
      };

      await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(session1);

      const session2 = {
        taskId: anotherTaskId,
        duration_min: 30,
      };

      await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(session2);

      // Crear materia y tarea para el segundo estudiante
      const subject2 = {
        name: 'Química',
        assignedTeacher: 'Prof. Martínez',
        color: '#3357FF',
      };

      const subject2Response = await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${anotherStudentToken}`)
        .send(subject2);

      const subject2Id = subject2Response.body.subjectId;

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const task3 = {
        subjectId: subject2Id,
        title: 'Tarea de Química',
        description: 'Descripción',
        start_date: today.toISOString().split('T')[0],
        delivery_date: tomorrow.toISOString().split('T')[0],
        priority: TaskPriority.LOW,
        state: TaskState.PENDING,
      };

      const task3Response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${anotherStudentToken}`)
        .send(task3);

      const task3Id = task3Response.body.task_id;

      // Crear sesión para el segundo estudiante
      const session3 = {
        taskId: task3Id,
        duration_min: 20,
      };

      await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${anotherStudentToken}`)
        .send(session3);
    });

    it('debería listar solo las sesiones del estudiante autenticado', async () => {
      const response = await request(app.getHttpServer())
        .get('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // Solo las 2 sesiones del primer estudiante
    });

    it('debería retornar un array vacío si el estudiante no tiene sesiones', async () => {
      // Limpiar y crear un nuevo estudiante sin sesiones
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
        .get('/pomodoro')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .get('/pomodoro')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /pomodoro/task/:taskId (listar sesiones por tarea)', () => {
    beforeEach(async () => {
      // Crear 2 sesiones para la primera tarea
      const session1 = {
        taskId: taskId,
        duration_min: 25,
      };

      await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(session1);

      const session2 = {
        taskId: taskId,
        duration_min: 30,
      };

      await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(session2);

      // Crear 1 sesión para la segunda tarea
      const session3 = {
        taskId: anotherTaskId,
        duration_min: 20,
      };

      await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(session3);
    });

    it('debería listar solo las sesiones de una tarea específica', async () => {
      const response = await request(app.getHttpServer())
        .get(`/pomodoro/task/${taskId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // Solo las 2 sesiones de la primera tarea
    });

    it('debería retornar un array vacío si la tarea no tiene sesiones', async () => {
      // Crear una nueva tarea sin sesiones
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const newTask = {
        subjectId: subjectId,
        title: 'Nueva Tarea',
        description: 'Descripción',
        start_date: today.toISOString().split('T')[0],
        delivery_date: tomorrow.toISOString().split('T')[0],
        priority: TaskPriority.LOW,
        state: TaskState.PENDING,
      };

      const newTaskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newTask);

      const newTaskId = newTaskResponse.body.task_id;

      const response = await request(app.getHttpServer())
        .get(`/pomodoro/task/${newTaskId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .get(`/pomodoro/task/${taskId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /pomodoro/stats/:taskId (obtener estadísticas por tarea)', () => {
    beforeEach(async () => {
      // Crear sesiones con diferentes estados
      const session1 = {
        taskId: taskId,
        duration_min: 25,
        breaks_taken: 1,
        completed: true,
      };

      await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(session1);

      const session2 = {
        taskId: taskId,
        duration_min: 30,
        breaks_taken: 2,
        completed: true,
      };

      await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(session2);

      const session3 = {
        taskId: taskId,
        duration_min: 20,
        breaks_taken: 0,
        completed: false,
      };

      await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(session3);
    });

    it('debería obtener las estadísticas de una tarea', async () => {
      const response = await request(app.getHttpServer())
        .get(`/pomodoro/stats/${taskId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('totalSessions');
      expect(response.body).toHaveProperty('completedSessions');
      expect(response.body).toHaveProperty('totalMinutes');
      expect(response.body).toHaveProperty('totalBreaks');
      expect(response.body.totalSessions).toBe(3);
      expect(response.body.completedSessions).toBe(2);
      expect(response.body.totalMinutes).toBe(75); // 25 + 30 + 20
      expect(response.body.totalBreaks).toBe(3); // 1 + 2 + 0
    });

    it('debería retornar estadísticas en cero si la tarea no tiene sesiones', async () => {
      const response = await request(app.getHttpServer())
        .get(`/pomodoro/stats/${anotherTaskId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.totalSessions).toBe(0);
      expect(response.body.completedSessions).toBe(0);
      expect(response.body.totalMinutes).toBe(0);
      expect(response.body.totalBreaks).toBe(0);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .get(`/pomodoro/stats/${taskId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /pomodoro/:id (obtener sesión por ID)', () => {
    beforeEach(async () => {
      const session = {
        taskId: taskId,
        duration_min: 25,
        break_time: 5,
        breaks_taken: 1,
        completed: false,
      };

      const response = await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(session);

      createdSessionId = response.body.session_id;
    });

    it('debería obtener una sesión por ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/pomodoro/${createdSessionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.session_id).toBe(createdSessionId);
      expect(response.body.duration_min).toBe(25);
      expect(response.body.break_time).toBe(5);
      expect(response.body.breaks_taken).toBe(1);
      expect(response.body.completed).toBe(false);
    });

    it('debería retornar 404 si la sesión no existe', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .get(`/pomodoro/${fakeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .get(`/pomodoro/${createdSessionId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PATCH /pomodoro/:id (actualizar sesión)', () => {
    beforeEach(async () => {
      const session = {
        taskId: taskId,
        duration_min: 25,
        breaks_taken: 0,
        completed: false,
      };

      const response = await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(session);

      createdSessionId = response.body.session_id;
    });

    it('debería actualizar el estado de completado de una sesión', async () => {
      const updateData = {
        completed: true,
      };

      const response = await request(app.getHttpServer())
        .patch(`/pomodoro/${createdSessionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.completed).toBe(true);
    });

    it('debería actualizar el número de descansos tomados', async () => {
      const updateData = {
        breaks_taken: 3,
      };

      const response = await request(app.getHttpServer())
        .patch(`/pomodoro/${createdSessionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.breaks_taken).toBe(3);
    });

    it('debería actualizar la duración de la sesión', async () => {
      const updateData = {
        duration_min: 50,
      };

      const response = await request(app.getHttpServer())
        .patch(`/pomodoro/${createdSessionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.duration_min).toBe(50);
    });

    it('debería actualizar el tiempo de descanso', async () => {
      const updateData = {
        break_time: 15,
      };

      const response = await request(app.getHttpServer())
        .patch(`/pomodoro/${createdSessionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.break_time).toBe(15);
    });

    it('debería retornar 404 si la sesión no existe', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = {
        completed: true,
      };

      await request(app.getHttpServer())
        .patch(`/pomodoro/${fakeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería denegar acceso sin autenticación', async () => {
      const updateData = {
        completed: true,
      };

      await request(app.getHttpServer())
        .patch(`/pomodoro/${createdSessionId}`)
        .send(updateData)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('DELETE /pomodoro/:id (eliminar sesión)', () => {
    beforeEach(async () => {
      const session = {
        taskId: taskId,
        duration_min: 25,
      };

      const response = await request(app.getHttpServer())
        .post('/pomodoro')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(session);

      createdSessionId = response.body.session_id;
    });

    it('debería eliminar una sesión', async () => {
      await request(app.getHttpServer())
        .delete(`/pomodoro/${createdSessionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verificar que la sesión ya no existe
      await request(app.getHttpServer())
        .get(`/pomodoro/${createdSessionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería retornar 404 si la sesión no existe', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .delete(`/pomodoro/${fakeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .delete(`/pomodoro/${createdSessionId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
