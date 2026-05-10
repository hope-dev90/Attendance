import { Injectable } from '@nestjs/common';
type User = {
    id: number;
    username: string;
    password: string;
}
@Injectable()
export class UsersService {
    private users: User[]=[];
    register(username: string, password: string): User{
        const user = {
            id : Date.now(),
            username,
            password,
        };
        this.users.push(user);
        return user;

    }
    findOne(username: string){
        return this.users.find(user => user.username == username);
    
    }
}
