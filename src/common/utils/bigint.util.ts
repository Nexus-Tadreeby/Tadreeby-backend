// export function convertBigIntFields<T extends object>(obj: T): T {
//     if (obj === null || obj === undefined) return obj;

    
//     if (obj instanceof Date) return obj as any as T;

//     const result: any = Array.isArray(obj) ? [] : {};

//     for (const [key, value] of Object.entries(obj)) {
//         if (value === null || value === undefined) {
//             result[key] = value;
//         } else if (typeof value === 'bigint') {
//             result[key] = Number(value);
//         } else if (value instanceof Date) {
   
//             result[key] = value;
//         } else if (typeof value === 'object') {
//             result[key] = convertBigIntFields(value);
//         } else {
//             result[key] = value;
//         }
//     }

//     return result;
// }



// src/common/types/unifiedType.types.ts

/**
 * Convert BigInt to Number and Date to ISO string recursively
 */
export function convertBigIntFields<T extends object>(obj: T): T {
    if (obj === null || obj === undefined) return obj;

    if (obj instanceof Date) {
        return obj.toISOString() as any as T;
    }

    const result: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
            result[key] = value;
        } else if (typeof value === 'bigint') {
            result[key] = Number(value);
        } else if (value instanceof Date) {
            result[key] = value.toISOString();
        } else if (typeof value === 'object') {
            result[key] = convertBigIntFields(value);
        } else {
            result[key] = value;
        }
    }

    return result;
}


export function convertArrayBigInts<T extends object>(items: T[]): T[] {
    if (!items || !Array.isArray(items)) {
        return [];
    }
    return items.map((item) => convertBigIntFields(item));
}