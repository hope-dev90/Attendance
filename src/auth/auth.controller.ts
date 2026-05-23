import { Controller,Post,Body } from '@nestjs/common';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
    constructor( private readonly authServices : AuthService){
    }
   @Post('login')
   login (@Body() body: any){
return this.authServices.login(body.username, body.password);
}}
