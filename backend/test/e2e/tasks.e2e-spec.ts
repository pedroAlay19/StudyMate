import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp } from '../test-helpers';
import { TaskState, TaskPriority } from '../../src/tasks/entities/task.entity';

describe('Tasks (e2e)', () => {
  let app: INestApplication;
  let studentToken: string;
  let studentId: string;
  let anotherStudentToken: string;
  let subjectId: string;
  let anotherSubjectId: string;
  let createdTaskId: string;

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

    // Crear materia para el primer estudiante
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

    // Crear otra materia para el primer estudiante
    const anotherSubject = {
      name: 'Física',
      assignedTeacher: 'Prof. López',
      color: '#33FF57',
    };

    const anotherSubjectResponse = await request(app.getHttpServer())
      .post('/subjects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(anotherSubject);

    anotherSubjectId = anotherSubjectResponse.body.subjectId;

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

  describe('POST /tasks (crear tarea)', () => {
    it('debería permitir crear una tarea completa', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const newTask = {
        subjectId: subjectId,
        title: 'Tarea de Matemáticas',
        description: 'Resolver ejercicios del capítulo 5',
        notes: 'Revisar ejemplos de la página 120',
        start_date: today.toISOString().split('T')[0],
        delivery_date: tomorrow.toISOString().split('T')[0],
        priority: TaskPriority.HIGH,
        state: TaskState.PENDING,
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newTask)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('task_id');
      expect(response.body.title).toBe(newTask.title);
      expect(response.body.description).toBe(newTask.description);
      expect(response.body.notes).toBe(newTask.notes);
      expect(response.body.priority).toBe(newTask.priority);
      expect(response.body.state).toBe(newTask.state);
      expect(response.body.subjectId).toBe(subjectId);

      createdTaskId = response.body.task_id;
    });

    it('debería crear una tarea sin notas (campo opcional)', async () => {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const newTask = {
        subjectId: subjectId,
        title: 'Examen de Física',
        description: 'Preparar temas 1-5',
        start_date: today.toISOString().split('T')[0],
        delivery_date: nextWeek.toISOString().split('T')[0],
        priority: TaskPriority.MEDIUM,
        state: TaskState.PENDING,
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newTask)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('task_id');
      expect(response.body.title).toBe(newTask.title);
    });

    it('debería denegar acceso sin autenticación', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const newTask = {
        subjectId: subjectId,
        title: 'Tarea sin auth',
        description: 'Descripción',
        start_date: today.toISOString().split('T')[0],
        delivery_date: tomorrow.toISOString().split('T')[0],
        priority: TaskPriority.LOW,
        state: TaskState.PENDING,
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .send(newTask)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('debería fallar con datos de validación incorrectos', async () => {
      const invalidTask = {
        subjectId: 'invalid-uuid',
        title: '',
        description: '',
        start_date: 'invalid-date',
        delivery_date: 'invalid-date',
        priority: 'invalid-priority',
        state: 'invalid-state',
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(invalidTask)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería fallar si falta un campo requerido', async () => {
      const today = new Date();

      const incompleteTask = {
        subjectId: subjectId,
        title: 'Tarea incompleta',
        // Faltan description, start_date, delivery_date, priority, state
        start_date: today.toISOString().split('T')[0],
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(incompleteTask)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería fallar si la fecha de inicio es en el pasado', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const taskWithPastDate = {
        subjectId: subjectId,
        title: 'Tarea con fecha pasada',
        description: 'Descripción',
        start_date: twoDaysAgo.toISOString().split('T')[0],
        delivery_date: tomorrow.toISOString().split('T')[0],
        priority: TaskPriority.LOW,
        state: TaskState.PENDING,
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(taskWithPastDate)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('debería fallar si la fecha de entrega es anterior a la fecha de inicio', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const taskWithInvalidDates = {
        subjectId: subjectId,
        title: 'Tarea con fechas inválidas',
        description: 'Descripción',
        start_date: today.toISOString().split('T')[0],
        delivery_date: yesterday.toISOString().split('T')[0],
        priority: TaskPriority.LOW,
        state: TaskState.PENDING,
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(taskWithInvalidDates)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /tasks (listar tareas)', () => {
    beforeEach(async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Crear tareas para el primer estudiante
      const task1 = {
        subjectId: subjectId,
        title: 'Tarea 1',
        description: 'Descripción 1',
        start_date: today.toISOString().split('T')[0],
        delivery_date: tomorrow.toISOString().split('T')[0],
        priority: TaskPriority.HIGH,
        state: TaskState.PENDING,
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(task1);

      const task2 = {
        subjectId: anotherSubjectId,
        title: 'Tarea 2',
        description: 'Descripción 2',
        start_date: today.toISOString().split('T')[0],
        delivery_date: tomorrow.toISOString().split('T')[0],
        priority: TaskPriority.MEDIUM,
        state: TaskState.IN_PROGRESS,
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(task2);

      // Crear materia para el segundo estudiante
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

      // Crear tarea para el segundo estudiante
      const task3 = {
        subjectId: subject2Id,
        title: 'Tarea 3',
        description: 'Descripción 3',
        start_date: today.toISOString().split('T')[0],
        delivery_date: tomorrow.toISOString().split('T')[0],
        priority: TaskPriority.LOW,
        state: TaskState.PENDING,
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${anotherStudentToken}`)
        .send(task3);
    });

    it('debería listar solo las tareas del estudiante autenticado', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // Solo las 2 tareas del primer estudiante
    });

    it('debería retornar un array vacío si el estudiante no tiene tareas', async () => {
      // Limpiar y crear un nuevo estudiante sin tareas
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
        .get('/tasks')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .get('/tasks')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /tasks/subject/:subjectId (listar tareas por materia)', () => {
    beforeEach(async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Crear 2 tareas para la primera materia
      const task1 = {
        subjectId: subjectId,
        title: 'Tarea de Matemáticas 1',
        description: 'Descripción 1',
        start_date: today.toISOString().split('T')[0],
        delivery_date: tomorrow.toISOString().split('T')[0],
        priority: TaskPriority.HIGH,
        state: TaskState.PENDING,
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(task1);

      const task2 = {
        subjectId: subjectId,
        title: 'Tarea de Matemáticas 2',
        description: 'Descripción 2',
        start_date: today.toISOString().split('T')[0],
        delivery_date: tomorrow.toISOString().split('T')[0],
        priority: TaskPriority.MEDIUM,
        state: TaskState.IN_PROGRESS,
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(task2);

      // Crear 1 tarea para la segunda materia
      const task3 = {
        subjectId: anotherSubjectId,
        title: 'Tarea de Física 1',
        description: 'Descripción 3',
        start_date: today.toISOString().split('T')[0],
        delivery_date: tomorrow.toISOString().split('T')[0],
        priority: TaskPriority.LOW,
        state: TaskState.PENDING,
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(task3);
    });

    it('debería listar solo las tareas de una materia específica', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks/subject/${subjectId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // Solo las 2 tareas de Matemáticas
      expect(response.body.every(task => task.subjectId === subjectId)).toBe(true);
    });

    it('debería retornar un array vacío si la materia no tiene tareas', async () => {
      // Crear una nueva materia sin tareas
      const newSubject = {
        name: 'Química',
        assignedTeacher: 'Prof. Rodríguez',
        color: '#5733FF',
      };

      const newSubjectResponse = await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newSubject);

      const newSubjectId = newSubjectResponse.body.subjectId;

      const response = await request(app.getHttpServer())
        .get(`/tasks/subject/${newSubjectId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .get(`/tasks/subject/${subjectId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /tasks/:id (obtener tarea por ID)', () => {
    beforeEach(async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const task = {
        subjectId: subjectId,
        title: 'Tarea de prueba',
        description: 'Descripción de prueba',
        notes: 'Notas importantes',
        start_date: today.toISOString().split('T')[0],
        delivery_date: tomorrow.toISOString().split('T')[0],
        priority: TaskPriority.HIGH,
        state: TaskState.PENDING,
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(task);

      createdTaskId = response.body.task_id;
    });

    it('debería obtener una tarea por ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.task_id).toBe(createdTaskId);
      expect(response.body.title).toBe('Tarea de prueba');
      expect(response.body.description).toBe('Descripción de prueba');
      expect(response.body.notes).toBe('Notas importantes');
      expect(response.body.priority).toBe(TaskPriority.HIGH);
      expect(response.body.state).toBe(TaskState.PENDING);
    });

    it('debería retornar 404 si la tarea no existe', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .get(`/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PATCH /tasks/:id (actualizar tarea)', () => {
    beforeEach(async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const task = {
        subjectId: subjectId,
        title: 'Tarea original',
        description: 'Descripción original',
        start_date: today.toISOString().split('T')[0],
        delivery_date: tomorrow.toISOString().split('T')[0],
        priority: TaskPriority.LOW,
        state: TaskState.PENDING,
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(task);

      createdTaskId = response.body.task_id;
    });

    it('debería actualizar el título y descripción de una tarea', async () => {
      const updateData = {
        title: 'Tarea actualizada',
        description: 'Nueva descripción',
      };

      const response = await request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.priority).toBe(TaskPriority.LOW); // No cambia
    });

    it('debería actualizar el estado de una tarea', async () => {
      const updateData = {
        state: TaskState.COMPLETED,
      };

      const response = await request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.state).toBe(TaskState.COMPLETED);
    });

    it('debería actualizar la prioridad de una tarea', async () => {
      const updateData = {
        priority: TaskPriority.HIGH,
      };

      const response = await request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.priority).toBe(TaskPriority.HIGH);
    });

    it('debería actualizar las notas de una tarea', async () => {
      const updateData = {
        notes: 'Nuevas notas importantes',
      };

      const response = await request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(response.body.notes).toBe(updateData.notes);
    });

    it('debería retornar 404 si la tarea no existe', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const updateData = {
        title: 'Nuevo título',
      };

      await request(app.getHttpServer())
        .patch(`/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería denegar acceso sin autenticación', async () => {
      const updateData = {
        title: 'Nuevo título',
      };

      await request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .send(updateData)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('DELETE /tasks/:id (eliminar tarea)', () => {
    beforeEach(async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const task = {
        subjectId: subjectId,
        title: 'Tarea a eliminar',
        description: 'Descripción',
        start_date: today.toISOString().split('T')[0],
        delivery_date: tomorrow.toISOString().split('T')[0],
        priority: TaskPriority.MEDIUM,
        state: TaskState.PENDING,
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(task);

      createdTaskId = response.body.task_id;
    });

    it('debería eliminar una tarea', async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.NO_CONTENT);

      // Verificar que la tarea ya no existe
      await request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería retornar 404 si la tarea no existe', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      await request(app.getHttpServer())
        .delete(`/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${createdTaskId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
