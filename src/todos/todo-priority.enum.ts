export enum TodoPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export const PRIORITY_RANK: Record<TodoPriority, number> = {
  [TodoPriority.Low]: 0,
  [TodoPriority.Medium]: 1,
  [TodoPriority.High]: 2,
};
