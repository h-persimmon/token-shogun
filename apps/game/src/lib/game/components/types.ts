export type Component<Type extends string, Param> = {
  readonly type: Type;
} & Param;
