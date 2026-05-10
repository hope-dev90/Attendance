import { Injectable } from '@nestjs/common';

type Task = {
  id: number;
  title: string;
  body: string;
  userId: number;
};

@Injectable()
export class AppService {
  private tasks: Task[] = [];

  // 🔥 FIX 1
  findAll(userId: number): Task[] {
    return this.tasks.filter(task => task.userId === userId);
  }

  // 🔥 FIX 2
  addTask(title: string, body: string, userId: number): Task {
    const task: Task = {
      id: Date.now(),
      title,
      body,
      userId,
    };

    this.tasks.push(task);
    return task;
  }

  // 🔥 FIX 3
  deleteTask(id: string, userId: number): Task[] {
    this.tasks = this.tasks.filter(
      task => !(task.id === Number(id) && task.userId === userId),
    );

    return this.tasks;
  }
}