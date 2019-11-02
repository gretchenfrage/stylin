import * as yaml from 'js-yaml';
import {PathLike, readFileSync} from "fs";
import {println} from './util';

type MetaData = { [key: string]: any };
type MetaEntry = { "meta": MetaData };
type OpCode = string;
type Arguments = { [key: string]: any };
type Instr = [OpCode, Arguments] | [OpCode] | OpCode;
type BuildScript = (MetaEntry | Instr)[];
type ContextRecord = { [key: string]: any };

function resolve_meta(maybe: any): MetaEntry | null {
    if ('meta' in maybe) {
        return maybe;
    } else {
        return null;
    }
}

/**
 * The machine machine state.
 */
class StackMachine {
    source_dir: PathLike;
    target_dir: PathLike;
    meta: MetaData;
    stack: {
        datum: any;
        emitted_by_op_name: string;
    }[];
    context_record: ContextRecord;

    constructor(source_dir: PathLike, target_dir: PathLike, meta: MetaData) {
        this.source_dir = source_dir;
        this.target_dir = target_dir;
        this.meta = meta;
        this.stack = [];
    }

    require_meta(key: string, op_name: string): any {
        if (this.meta[key]) {
            return this.meta[key];
        } else {
            throw `missing required metadata key=${key} for op=${op_name}`;
        }
    }

    pop(operand_name: string, op_name: string): any {
        if (this.stack.length > 0) {
            return this.stack.pop().datum;
        } else {
            throw `missing required stack operand=${operand_name} for op=${op_name}`;
        }
    }

    push(datum: any, op_name: string) {
        this.stack.push({datum: datum, emitted_by_op_name: op_name});
    }
}

interface CleanerValidator<T> {
    (datum: any): T | undefined;
}

/**
 * Context for executing an operation.
 */
class OpContext {
    op: OpCode;
    args: Arguments;
    machine: StackMachine;

    constructor(machine: StackMachine, syntax: Instr) {
        this.machine = machine;

        if (Array.isArray(syntax)) {
            if (syntax.length == 2) {
                this.op = syntax[0];
                this.args = syntax[1];
            } else if (syntax.length == 1) {
                this.op = syntax[0];
                this.args = {};
            } else {
                throw (
                    "illegal instruction array length (must be 1 or 2):"
                    + JSON.stringify(syntax)
                );
            }
        } else {
            if (typeof syntax === "string") {
                this.op = syntax;
                this.args = {};
            } else {
                throw `illegal instruction syntax type: ${syntax}`;
            }
        }
    }

    require_arg(key: string): any {
        if (this.args[key]) {
            return this.args[key];
        } else {
            throw `missing required op argument=${key} for op=${this.op}`;
        }
    }

    require_meta(key: string): any {
        return this.machine.require_meta(key, this.op);
    }

    pop(operand_name: string): any {
        return this.machine.pop(operand_name, this.op);
    }

    push(datum: any) {
        this.machine.push(datum, this.op);
    }

    contextual(key: string): any | undefined {
        return this.machine.context_record[key];
    }

    _validate<T>(value: any, value_name: string, validator: CleanerValidator<T>): T{
        let value_valid: T;
        try {
            let value_valid = validator(value);
        } catch (e) {
            println(`unable to validate ${value_name} for op=${this.op} value=${value}`);
            throw e;
        }
        if (value_valid) {
            return value_valid;
        } else {
            throw `unable to validate ${value_name} for op=${this.op} value=${value}`;
        }
    }


    require_arg_valid<T>(key: string, validator: CleanerValidator<T>): T {
        let value: any = this.require_arg(key);
        return this._validate(value, `op argument=${key}`, validator);
    }

    require_meta_valid<T>(key: string, validator: CleanerValidator<T>): T {
        let value: any = this.require_meta(key);
        return this._validate(value, `metadata key=${key}`, validator);
    }

    pop_valid<T>(operand_name: string, validator: CleanerValidator<T>): T {
        let value = this.pop(operand_name);
        return this._validate(
            value, `stack operand "${operand_name}"`, validator
        );
    }

    contextual_validate<T>(key: string, validator: CleanerValidator<T>): T | undefined {
        let value = this.contextual(key);
        if (value) {
            return this._validate(
                value,
                `internal contextual value: ${key}`,
                validator
            );
        } else {
            return undefined;
        }
    }
}

type OpLambda = (OpContext) => void;
type OpSet = { [code: string]: OpLambda };

export function build(src: PathLike, target: PathLike) {
    // read the yaml
    let script_str: string = readFileSync(`${src}/build.yaml`, 'utf8');
    let script: BuildScript = yaml.safeLoad(script_str);

    // edge case
    if (script.length == 0) {
        return;
    }

    // resolve the metadata
    let meta_entry: MetaEntry | null = resolve_meta(script[0]);
    let meta: MetaData;
    if (meta_entry != null) {
        // remove it from the program slice
        script = script.slice(1);
        meta = meta_entry.meta;
    } else {
        // if meta was absent from program, set it to an object object
        meta = {};
    }

    // build the machine machine state

}