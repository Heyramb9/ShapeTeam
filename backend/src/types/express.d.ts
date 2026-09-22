import type { User } from './domain';
declare global { namespace Express { interface Request { user?:User; token?:string } } }
export {};
