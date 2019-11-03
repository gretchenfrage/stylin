import {OpContext} from "./machinery";
import {req_node_array, req_string} from "./datatype_validate";
import {first_present, flat_map, println} from "../general/utils";
import {execSync} from "child_process";
import {read_dom, save_dom_html} from "../general/html_file_ops";
import {OpHandler} from "./types";
import {Processor} from "../general/dom_transform_algebra";

// here be OpHandlers (the general ones)

/**
 * The command:
 * > cp -r [args.from] [args.to]
 *
 * Supports globs.
 */
export function copy(ctx: OpContext) {
    let from = ctx.require_arg_valid('from', req_string);
    let to = ctx.require_arg_valid('to', req_string);

    from = ctx.pathologize(from, 'source');
    to = ctx.pathologize(to, 'target');

    let command = `cp -r ${from} ${to}`;
    println(`> ${command}`);

    execSync(command, { stdio: 'inherit' });
}

/**
 * Read HTML file [args.file], parse DOM, push onto stack.
 *
 * Sets [context.last_file_read].
 */
export function readDOM(ctx: OpContext) {
    let file = ctx.require_arg_valid('file', req_string);
    ctx.remember_context('last_file_read', file);
    file = ctx.pathologize(file, 'source');

    println(`> reading DOM from ${file}`);
    let dom: Node[] = read_dom(file);

    ctx.push(dom);
}

/**
 * Pop DOM from stack, render to HTML, writes to file
 * [args.file] || [context.last_file_read].
 */
export function writeHTML(ctx: OpContext) {
    let dom: Node[] = ctx.pop_valid('content', req_node_array);

    let file: string = first_present('write HTML target file', [
        () => ctx.option_arg_validate('file', req_string),
        () => ctx.contextual_validate('last_file_read', req_string),
    ]);
    file = ctx.pathologize(file, 'target');

    println(`> writing DOM to ${file}`);

    save_dom_html(dom, file);
}

/**
 * Produce a OpHandler to pop a DOM from the stack, map it through a function, then
 * push it back on the stack.
 *
 * The mapping is passed the context, allowing it to fetch parameters.
 */
export function dom_mapping(
    mapping: (ctx: OpContext, input: Node[]) => (Node[] | Node)
): OpHandler {
    return (ctx: OpContext) => {
        let before: Node[] = ctx.pop_valid('content', req_node_array);
        let after: Node[] | Node = mapping(ctx, before);
        ctx.push(after);
    };
}

/**
 * Produce an OpHandler which maps the DOM by flat-mapping it through a non-parametric
 * Processor.
 */
export function apply_processor(processor: Processor, log_name?: string): OpHandler {
    return dom_mapping((ctx, input) => {
        if (log_name != null) {
            println(`> applying processor: ${log_name}`);
        } else {
            println(`> applying an anonymous processor`);
        }
        return flat_map(input, processor);
    });
}

/**
 * Given a lambda which fetches parameters from a context, and uses them to produce a
 * processor, this function produces an OpHandler which maps the dom through that
 * parametric processor.
 */
export function apply_parametric_processor(parametrizer: (ctx: OpContext) => Processor): OpHandler {
    return dom_mapping((ctx, input) => {
        let processor = parametrizer(ctx);
        return flat_map(input, processor);
    });
}