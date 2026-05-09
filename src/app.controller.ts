import { Controller, Get, Post} from '@nestjs/common';
@Controller()
export class AppController{
  @Get()
  home(){
    return 'Nest is working';
  }
  @Get('users')
  getUser(){
    return['John', 'Jane','Peter']
  }
  @Post('newuser')
  postUser(){
    return'she was saved';
  }
}
