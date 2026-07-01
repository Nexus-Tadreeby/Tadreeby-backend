import { PaginationQueryType } from "src/common/types/unifiedType.types";
import { z, ZodType } from "zod";


export const PaginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
}).strict() satisfies ZodType<PaginationQueryType>
