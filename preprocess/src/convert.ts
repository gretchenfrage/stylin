
import { println, node_is_element } from './util';
import { JSDOM } from 'jsdom';
import { readFileSync, writeFileSync, PathLike } from "fs";

/**
 * Initialize the preprocessor global state.
 */
export function init() {
    // create a global fake DOM, so that redom can initialize properly
    let window = (new JSDOM("")).window;
    var document = window.document;
    var SVGElement = window['SVGElement'];
    globalThis.document = document;
    globalThis.SVGElement = SVGElement;
}

/**
 * Read a file, parse it as jsdom DOM.
 */
export function read_dom(file: PathLike): Node[] {
    let html = readFileSync(file, 'utf8');
    return Array.from(JSDOM.fragment(html).childNodes);
}

/**
 * Convert a DocumentFragment into a string.
 */
export function render_dom(dom: Node[]): string {
    return dom
        .filter(node_is_element)
        .map(node => node.outerHTML)
        .reduce((whole, part) => whole + part + '\n', '');
}

/**
 * Convert a DocumentFragment into a string, save it to a file.
 */
export function save_dom_html(dom: Node[] | Node, file: PathLike) {
    if (!Array.isArray(dom)) {
        dom = [dom];
    }

    let html = render_dom(dom);
    writeFileSync(file, html);
}