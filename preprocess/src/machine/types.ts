
// state
export type OpCode = string;
export type MetaData = { [key: string]: any };
export type Arguments = { [key: string]: any };
export type ContextRecord = { [key: string]: any };

// syntax
export type MetaSyntax = { "meta": MetaData };
export type OpSyntax = [OpCode, Arguments] | [OpCode] | OpCode;
export type ScriptSyntax = (MetaSyntax | OpSyntax[])[];

// handlers
export type OpHandler = (OpContext) => void;
export type OpHandlerSet = { [code: string]: OpHandler };