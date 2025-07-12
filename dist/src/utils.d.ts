export type Intersect<T> = (T extends any ? (t: T) => void : never) extends (t: infer U) => void ? U : never;
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
