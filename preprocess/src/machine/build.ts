import * as yaml from 'js-yaml';
import {PathLike, readFileSync} from "fs";
import {println} from '../general/utils';
import {MetaData, MetaSyntax, OpHandlerSet, OpSyntax, ScriptSyntax} from "./types";
import {OpContext, StackMachine} from "./machinery";

function resolve_meta(maybe: any): MetaSyntax | null {
    if ('meta' in maybe) {
        return maybe;
    } else {
        return null;
    }
}

/**
 * The main build entrypoint.
 */
export function build(op_set: OpHandlerSet, src: PathLike, target: PathLike) {
    println(`>>> building ${src} -> ${target}`);

    // read the yaml
    let script_str: string = readFileSync(`${src}/build.yaml`, 'utf8');

    // edge case
    if (script_str.trim().length == 0) {
        println('the build.yaml is empty, exiting');
        return;
    }

    let script: ScriptSyntax = yaml.safeLoad(script_str);

    // edge case
    if (script.length == 0) {
        return;
    }

    // resolve the metadata
    let meta_entry: MetaSyntax | null = resolve_meta(script[0]);
    let meta: MetaData;
    if (meta_entry != null) {
        // remove it from the program slice
        script = script.slice(1);
        meta = meta_entry.meta;
    } else {
        // if meta was absent from program, set it to an object object
        meta = {};
    }

    // run each line
    for (let i in script) {
        println(`>> instruction line ${i}`);

        let script_elem = script[i];
        if (!Array.isArray(script_elem)) {
            throw `illegal script elem ${script_elem}`;
        }
        let line: OpSyntax[] = script_elem;

        // create the machine
        let machine = new StackMachine(src, target, meta);

        // run each instruction
        for (let instr of line) {
            let op_context = new OpContext(machine, instr);

            if (op_context.op in op_set) {
                op_set[op_context.op](op_context);
            } else {
                throw `unknown instruction: ${op_context.op}`;
            }
        }

        if (machine.stack.length > 0) {
            println('>> warning: stack is not empty');
        }
    }

    println(`>>> success`);
    // done :)
}