import { Controller,Post,Body } from '@nestjs/common';
import { UsersService } from './users.service';
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService){}
@Post('register')
register(@Body() body: any){
    return this.usersService.register(body.username, body.password)
}
}
