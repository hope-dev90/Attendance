import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  login(username: string, password: string) {
    const user = this.usersService.findOne(username);

    if (!user || user.password !== password) {
      return { message: 'Invalid credentials' };
    }

    const payload = {
      username: user.username,
      sub: user.id,
    };

    return {
      access_token: this.jwtService.sign(payload), 
    };
  }
}