declare module "bcryptjs" {
  export function hashSync(password: string, salt?: number | string): string;
  export function hash(password: string, salt?: number | string): Promise<string>;
  export function compareSync(password: string, hash: string): boolean;
  export function compare(password: string, hash: string): Promise<boolean>;
  export function genSaltSync(rounds?: number): string;
  export function genSalt(rounds?: number): Promise<string>;
}

declare module "papaparse" {
  interface ParseConfig {
    header?: boolean;
    dynamicTyping?: boolean;
    skipEmptyLines?: boolean;
    transformHeader?: (header: string) => string;
    complete?: (results: ParseResult<any>) => void;
    error?: (error: any) => void;
  }

  interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
  }

  interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      fields: string[];
    };
  }

  function parse<T = any>(input: string | File, config?: ParseConfig): ParseResult<T>;
  function unparse(data: any[], config?: { header?: string[] }): string;

  export type { ParseConfig, ParseError, ParseResult };
  const _default: { parse: typeof parse; unparse: typeof unparse };
  export default _default;
}
