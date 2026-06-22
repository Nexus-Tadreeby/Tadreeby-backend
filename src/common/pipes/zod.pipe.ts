import {
    PipeTransform,
    BadRequestException,
    ArgumentMetadata,
} from "@nestjs/common";
import { ZodType } from "zod";

export class ZodValidationPipe<T> implements PipeTransform {
    constructor(private schema: ZodType<T>) { }

    transform(value: unknown, _metadata: ArgumentMetadata): T {
        const result = this.schema.safeParse(value);

        if (!result.success) {
            throw new BadRequestException({
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }

        return result.data;
    }
}