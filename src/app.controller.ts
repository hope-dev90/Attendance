import {
  Controller,
  Body,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';

import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(JwtAuthGuard)
  @Get('task')
  findAll(@Request() req: any) {
    return this.appService.findAll(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('task')
  addTask(@Body() body: any, @Request() req: any) {
    return this.appService.addTask(
      body.title,
      body.body,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('task/:id')
  deleteTask(@Param('id') id: string, @Request() req: any) {
    return this.appService.deleteTask(id, req.user.userId);
  }
}