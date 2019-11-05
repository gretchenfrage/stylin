import {OpContext} from "./machinery";
import {req_node_array, req_single_node, req_string} from "./datatype_validate";
import {first_present, flat_map, println} from "../general/utils";
import {execSync} from "child_process";
import {read_dom, save_dom_html} from "../general/html_file_ops";
import {OpHandler} from "./types";
import {Processor} from "../general/dom_transform_algebra";
import {html_redirect_dom} from "../general/redirect_page";
import {readFileSync} from "fs";
import {insertCssRefTag, insertCssTag} from "../general/std_transformations";

// here be OpHandlers (the general ones)

/**
 * A no-op.
 */
export const no_op: OpHandler = (ctx: OpContext): void => {
    println('> (no-op)');
};

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

    let command = `cp -R ${from} ${to}`;
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
 * Read some file as a UTF-8 string, push onto stack.
 *
 * Sets [context.last_file_read].
 */
export function readTxt(ctx: OpContext) {
    let file = ctx.require_arg_valid('file', req_string);
    ctx.remember_context('last_file_read', file);
    file = ctx.pathologize(file, 'source');

    println(`> reading UTF-8 from ${file}`);
    let txt: string = readFileSync(file, 'utf8');

    ctx.push(txt);
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
 * Push a CSS string from the stack into a complete HTML dom underneath
 * it.
 */
export function mergeCSSIntoPage(ctx: OpContext) {
    println('> merging CSS string into underlying HTML DOM');

    let css_string: string = ctx
        .pop_valid('css string', req_string);

    let dom: Node = ctx
        .pop_valid('HTML DOM', req_single_node);

    dom = insertCssTag(dom, css_string);

    ctx.push(dom);
}

function add_css_ref(ctx: OpContext, dom: Node): Node {
    let path: string = ctx.require_arg_valid('path', req_string);

    println(`> adding stylesheet ref to "${path}"`);

    dom = insertCssRefTag(dom, path);
    return dom;
}

/**
 * Take a complete HTML dom on the top of the stack, and add an external CSS
 * stylesheet reference to its head, pointing to [args.path].
 */
export const addCssRef: OpHandler = single_node_mapping(add_css_ref);

// TODO
/*
export function addCssRef(ctx: OpContext) {
    let path: string = ctx.require_arg_valid('path', req_string);
    println(`> adding stylesheet ref to "${path}"`);
    let dom: Node = ctx
        .pop_valid('HTML DOM', req_single_node);
    dom = insertCssRefTag(dom, path);
    ctx.push(dom);
}
*/

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

export function single_node_mapping(
    mapping: (ctx: OpContext, input: Node) => (Node[] | Node)
): OpHandler {
    return (ctx: OpContext) => {
        let before: Node = ctx.pop_valid('dom', req_single_node);
        let after: Node[] | Node = mapping(ctx, before);
        ctx.push(after);
    }
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
export function apply_parametric_processor(
    parametrizer: (ctx: OpContext) => Processor,
    log_name?: string,
): OpHandler {
    return dom_mapping((ctx, input) => {
        if (log_name != null) {
            println(`> applying processor: ${log_name}`);
        } else {
            println(`> applying an anonymous processor`);
        }

        let processor = parametrizer(ctx);
        return flat_map(input, processor);
    });
}

/**
 * Write an HTML file at [args.from] which redirects to [args.to].
 */
export function create_redirect_page(ctx: OpContext) {
    let from: string = ctx.require_arg_valid('from', req_string);
    let to: string = ctx.require_arg_valid('to', req_string);
    from = ctx.pathologize(from, 'target');

    println(`> creating redirect page "${from}" -> "${to}"`);

    let page: Node = html_redirect_dom(to);
    save_dom_html(page, from);
}
/**
 * Write an HTML file at [args.from] which redirects to path_prefix/[args.to]. for
 * absolute paths, or [args.to] for relative paths.
 */
export function create_redirect_page_prepend(abs_path_prefix: string | null): OpHandler {
    return (ctx: OpContext) => {
        let from: string = ctx.require_arg_valid('from', req_string);
        let to: string = ctx.require_arg_valid('to', req_string);
        from = ctx.pathologize(from, 'target');
        if (abs_path_prefix != null && to.length > 0 && to[0] == '/') {
            to = abs_path_prefix + to;
        }

        println(`> creating redirect page "${from}" -> "${to}"`);

        let page: Node = html_redirect_dom(to);
        save_dom_html(page, from);
    };
}