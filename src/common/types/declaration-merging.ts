import { UserRole } from '@prisma/client';

declare global {
	namespace Express {
		interface User {
			id: number;
			role: UserRole;
		}

		interface Request {
			user?: User;
		}
	}

	interface BigInt {
		toJSON(): string;
	}
}


// import { UserRole } from '@prisma/client';

// declare global {
//   namespace Express {
//     interface Request {
//       user?: { 
//         id: number; 
//         role: UserRole; 
//       };
//     }
//   }

//   interface BigInt {
//     toJSON(): string;
//   }
// }