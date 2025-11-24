import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateStudentsDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const { email } = createStudentDto;
    const studentExists = await this.studentRepository.findOneBy({ email });
    if (studentExists)
      throw new ConflictException(`Student with email ${email} already exists`);

    const student = this.studentRepository.create({
      ...createStudentDto,
      password: await bcrypt.hash(createStudentDto.password, 10),
    
    });
    return await this.studentRepository.save(student);
  }

  async findAll(): Promise<Student[]> {
    return await this.studentRepository.find();
  }

  async findOne(id: string): Promise<Student> {
    const studentFound = await this.studentRepository.findOneBy({
      studentId: id,
    });
    if (!studentFound)
      throw new NotFoundException(`Student with ID ${id} not found`);
    return studentFound;
  }

  async findByEmail(email: string): Promise<Student | null> {
    const user = await this.studentRepository.findOneBy({ email });
    if (!user) {
      throw new BadRequestException('User with email not found');
    }
    return user;
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentsDto,
  ): Promise<Student | null> {
    const studentFound = await this.findOne(id);
    if (!studentFound) {
      throw new NotFoundException(`Student with id ${id} not found`);
    }
    Object.assign(studentFound, updateStudentDto);
    return await this.studentRepository.save(studentFound);
  }

  async remove(id: string) {
    if (!await this.findOne(id)) {
      throw new NotFoundException(`Student with id ${id} not found`);
    }
    return await this.studentRepository.delete(id);
  }
}
