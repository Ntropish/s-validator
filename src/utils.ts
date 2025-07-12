// A recursive type to intersect all types in a tuple.
export type Intersect<T> = (T extends any ? (t: T) => void : never) extends (
  t: infer U
) => void
  ? U
  : never;

// Converts a union of types into an intersection of those types.
export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;
