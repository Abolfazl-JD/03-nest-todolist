import { CallHandler, ExecutionContext, NestInterceptor, UseInterceptors } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { map, Observable } from "rxjs";

// type of class
interface classConstructor {
    new (...args : any[]) : {}
}

export function Serialize(dto: classConstructor) {
    return UseInterceptors(new SerializeInterceptor(dto))    
}

export class SerializeInterceptor implements NestInterceptor{
    constructor(private dto : classConstructor){}

    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {

        return next.handle().pipe(
            map((data: any) => {
                return plainToInstance(this.dto, data, {
                    excludeExtraneousValues: true,
                    enableImplicitConversion : true
                })
            })
        )
    }
}