import * as yaml from 'js-yaml';
import {PathLike, readFileSync} from "fs";
import {first_present, println} from '../general/utils';
import {read_dom, save_dom_html} from "../general/html_file_ops";
import {execSync} from 'child_process';
import {MetaData, MetaSyntax, OpHandlerSet, OpSyntax, ScriptSyntax} from "./types";
import {req_node_array, req_page_meta, req_string} from "./datatype_validate";
import {OpContext, StackMachine} from "./machinery";
import {column_wrap, content_wrap, PageBoilerplateMetadata} from "../phoenixkahlo/dom_wrappers";

// === validators

// === op set


export const std_op_set: OpHandlerSet = {
    copy: (ctx: OpContext) => {
        let from = ctx.require_arg_valid('from', req_string);
        let to = ctx.require_arg_valid('to', req_string);

        from = ctx.pathologize(from, 'source');
        to = ctx.pathologize(to, 'target');

        let command = `cp ${from} ${to}`;
        println(`> ${command}`);

        execSync(command, { stdio: 'inherit' });
    },
    wrapWithColumn: (ctx: OpContext) => {
        let content: Node[] = ctx.pop_valid('content', req_node_array);
        let col_class = ctx.require_arg_valid('column_class', req_string);
        println(`> wrapping with column class=${col_class}`);

        let wrapped = column_wrap(content, col_class);
        ctx.push(wrapped);
    },
    wrapWithBoilerplate: (ctx: OpContext) => {
        let page_meta: PageBoilerplateMetadata = ctx.meta_inline_validate('page', req_page_meta);
        let content: Node[] = ctx.pop_valid('content', req_node_array);
        println('> wrapping with phoenixkahlo.com boilerplate');

        let wrapped = content_wrap(content, page_meta);
        ctx.push(wrapped);
    },
    readDOM: (ctx: OpContext) => {
        let file = ctx.require_arg_valid('file', req_string);
        ctx.remember_context('last_file_read', file);
        file = ctx.pathologize(file, 'source');

        println(`> reading DOM from ${file}`);
        let dom: Node[] = read_dom(file);

        ctx.push(dom);
    },
    writeHTML: (ctx: OpContext) => {
        let dom: Node[] = ctx.pop_valid('content', req_node_array);

        let file: string = first_present('write HTML target file', [
            () => ctx.option_arg_validate('file', req_string),
            () => ctx.contextual_validate('last_file_read', req_string),
        ]);
        file = ctx.pathologize(file, 'target');

        println(`> writing DOM to ${file}`);

        save_dom_html(dom, file);
    },
};

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