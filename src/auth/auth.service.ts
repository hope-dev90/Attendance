import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async signup(username: string, password: string) {
    const existing = await this.userRepo.findOne({
      where: { username },
    });

    if (existing) {
      return { message: 'User already exists' };
    }

    const user = this.userRepo.create({ username, password });
    await this.userRepo.save(user);

    return { message: 'User created successfully' };
  }

  async login(username: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { username, password },
    });

    if (!user) {
      return { message: 'Invalid credentials' };
    }

    return { message: 'Login successful' };
  }
}