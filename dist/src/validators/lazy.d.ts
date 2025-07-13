import { Schema } from '../schemas/schema.js';
export declare function lazy<T extends Schema<any, any>>(resolver: () => T): T;
