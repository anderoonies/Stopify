export class LineMapping {
  getLine: (line: number, column: number) => number | null;

  constructor(func: (line: number, column: number) => number | null) {
    this.getLine = func;
  }
}

export interface Steppable {
  run: (onDone: () => void) => void;
  stop: (onStop: () => any) => void;
  transformed: string;
  step: (onDone: () => void, runToCompletion: boolean) => void;
  onStep: (ln?: number) => void;
};

export type steppify = (
  code: string,
  breakPoints: number[],
  isStop: () => boolean,
  stop: () => any,
  onStep: (ln: number) => void,
) => Steppable;

export function isSteppify(func: any): func is steppify {
  return func.isSteppify !== undefined;
}
