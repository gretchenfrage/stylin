import {PathLike} from "fs";
import {Arguments, ContextRecord, MetaData, OpCode, OpSyntax} from "./types";
import {CleanerValidator} from "./datatype_validate";
import {println} from "../general/utils";

/**
 * The machine machine state.
 */
export class StackMachine {
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
        this.context_record = {};
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

/**
 * Context for executing an operation.
 */
export class OpContext {
    op: OpCode;
    args: Arguments;
    machine: StackMachine;

    constructor(machine: StackMachine, syntax: OpSyntax) {
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
        if (this.args[key] != null) {
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

    _validate<T>(value: any, value_name: string, validator: CleanerValidator<T>): T {
        let value_valid: T;
        try {
            value_valid = validator(value);
        } catch (e) {
            println(`unable to validate ${value_name} for op=${this.op} value=${value}`);
            throw e;
        }
        if (value_valid != null) {
            return value_valid;
        } else {
            throw `unable to validate ${value_name} for op=${this.op} value=${value}`;
        }
    }


    require_arg_valid<T>(key: string, validator: CleanerValidator<T>): T {
        let value: any = this.require_arg(key);
        return this._validate(value, `op argument=${key}`, validator);
    }

    option_arg_validate<T>(key: string, validator: CleanerValidator<T>): T | undefined {
        let value = this.args[key];
        if (value != null) {
            return this._validate(
                value,
                `optional op argument=${key}`,
                validator,
            );
        } else {
            return undefined;
        }
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
        if (value != null) {
            return this._validate(
                value,
                `internal contextual value: ${key}`,
                validator
            );
        } else {
            return undefined;
        }
    }

    remember_context(key: string, value: any) {
        this.machine.context_record[key] = value;
    }

    meta_inline_validate<T>(subdata_name: string, validator: CleanerValidator<T>): T {
        return this._validate(
            this.machine.meta,
            `metadata inline "${subdata_name}"`,
            validator
        );
    }

    /**
     * Turn the input into a valid [citation needed] relative path.
     */
    pathologize(raw: string, relative_to: "source" | "target"): string {
        let unescaped: string;
        if (relative_to === "source") {
            unescaped = `${this.machine.source_dir}/${raw}`;
        } else if (relative_to === "target") {
            unescaped = `${this.machine.target_dir}/${raw}`;
        } else {
            throw `illegal relative_to=${relative_to}`;
        }
        return unescaped.replace(' ', '\\ ');
    }
}