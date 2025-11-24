import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { UsersService } from 'src/users/users.service';
import { JwtPayload } from '@supabase/supabase-js';
import type { ScheduleItem } from './entities/subject.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjectsRepository: Repository<Subject>,

    private readonly studentsService: UsersService,
  ) {}

  /**
   * Verifica si dos horarios se solapan
   */
  private doSchedulesOverlap(schedule1: ScheduleItem, schedule2: ScheduleItem): boolean {
    // Si no son el mismo día, no hay solapamiento
    if (schedule1.day !== schedule2.day) {
      return false;
    }

    // Convertir las horas a minutos desde medianoche para facilitar la comparación
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start1 = timeToMinutes(schedule1.start);
    const end1 = timeToMinutes(schedule1.end);
    const start2 = timeToMinutes(schedule2.start);
    const end2 = timeToMinutes(schedule2.end);

    // Hay solapamiento si un horario empieza antes de que termine el otro
    return (start1 < end2 && end1 > start2);
  }

  /**
   * Verifica conflictos de horario con otras materias del estudiante
   */
  private async checkScheduleConflicts(
    schedules: ScheduleItem[],
    userId: string,
    excludeSubjectId?: string,
  ): Promise<void> {
    if (!schedules || schedules.length === 0) {
      return;
    }

    // Obtener todas las materias del estudiante excepto la que se está actualizando
    const whereCondition: any = { student: { studentId: userId } };
    if (excludeSubjectId) {
      whereCondition.subjectId = Not(excludeSubjectId);
    }

    const existingSubjects = await this.subjectsRepository.find({
      where: whereCondition,
    });

    // Verificar cada horario de la nueva/actualizada materia contra las existentes
    for (const newSchedule of schedules) {
      for (const subject of existingSubjects) {
        if (!subject.schedule) continue;
        
        for (const existingSchedule of subject.schedule) {
          if (this.doSchedulesOverlap(newSchedule, existingSchedule)) {
            throw new BadRequestException(
              `Conflicto de horario detectado: El horario ${newSchedule.day} ${newSchedule.start}-${newSchedule.end} se solapa con la materia "${subject.name}" (${existingSchedule.day} ${existingSchedule.start}-${existingSchedule.end})`,
            );
          }
        }
      }
    }
  }
  async create(createSubjectDto: CreateSubjectDto, user: JwtPayload) {
    // Validar conflictos de horario
    await this.checkScheduleConflicts(createSubjectDto.schedule, user.sub);
    
    const student = await this.studentsService.findOne(user.sub);
    const subject = this.subjectsRepository.create({
      ...createSubjectDto,
      student,
    });
    return await this.subjectsRepository.save(subject);
  }

  async findAll(user: JwtPayload): Promise<Subject[]> {
    return await this.subjectsRepository.find({
      where: { student: { studentId: user.sub } },
    });
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.subjectsRepository.findOne({
      where: { subjectId: id },
    });
    if (!subject) throw new NotFoundException(`Subject with id ${id} not found`);
    return subject;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    const subject = await this.findOne(id);
    
    // Si se está actualizando el horario, validar conflictos
    if (updateSubjectDto.schedule) {
      // Necesitamos el studentId del subject
      const subjectWithStudent = await this.subjectsRepository.findOne({
        where: { subjectId: id },
        relations: ['student'],
      });
      
      if (subjectWithStudent?.student?.studentId) {
        await this.checkScheduleConflicts(
          updateSubjectDto.schedule,
          subjectWithStudent.student.studentId,
          id,
        );
      }
    }
    
    Object.assign(subject, updateSubjectDto);
    return await this.subjectsRepository.save(subject);
  }

  async remove(id: string) {
    await this.findOne(id);
    return await this.subjectsRepository.delete(id);
  }
}
