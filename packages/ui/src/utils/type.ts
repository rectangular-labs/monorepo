// mostly to play nice with exactOptionalPropertyTypes
export type ExplicitUndefined<T> = {
  [P in keyof T]-?: T[P] | undefined;
};
