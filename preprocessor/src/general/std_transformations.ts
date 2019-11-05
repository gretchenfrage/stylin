import {map_elements, Processor, processor_pipeline} from "./dom_transform_algebra";
import {alter_elem, node_is_element} from "./dom_edit_utils";
import {println} from "./utils";
import {el} from "redom";

/**
 * Find any node with a src or href property that's an absolute path, and re-relativize it.
 */
export function absolute_path_prepend(root: string, attrib_key?: string): Processor {
    if (attrib_key) {
        return map_elements((elem: Element) => {
            let path: string | null = elem.getAttribute(attrib_key);

            if (path == null) {
                return elem;
            }
            if (path[0] != '/') {
                return elem;
            }

            // println(`>: "${path}" -> "${root + path}"`);

            let patch: any = {};
            patch[attrib_key] = root + path;

            let out = alter_elem(elem, patch);
            return out;
        });
    } else {
        return processor_pipeline([
            absolute_path_prepend(root, 'src'),
            absolute_path_prepend(root, 'href'),
        ])
    }
}

function resolveHead(node: Node): Node {
    if (!node_is_element(node)) { throw `resolveHead to non-element node: ${node}` }
    if (node.tagName !== 'HTML') { throw `resolveHead to non-HTML element: ${node}` }

    let head: Node;

    let head_node_list: Element[] = Array.from(node.getElementsByTagName('HEAD'));
    if (head_node_list.length == 0) {
        // create a new head
        head = el('head');
        node.insertBefore(head, node.firstChild);
    } else {
        // head already exists
        head = head_node_list[0];
    }

    return head;
}

/**
 * Given an HTML page, locate its head, and insert a CSS string in a CSS style tag.
 */
export function insertCssTag(root: Node, css: string): Node {
    // clone (we're doing this functionally)
    let node = root.cloneNode(true);

    let head = resolveHead(node);

    // add the CSS tag
    let css_node: Node = el('style', { type: 'text/css' }, css);
    head.appendChild(css_node);

    // done
    return node;
}

/**
 * Given an HTML page, locate its head, and insert an external CSS stylesheet
 * reference tag.
 */
export function insertCssRefTag(root: Node, path: string): Node {
    let node: Node = root.cloneNode(true);
    let head: Node = resolveHead(node);
    let ref_tag: Node = el('link', {
        rel: 'stylesheet',
        type: 'text/css',
        href: path,
    });
    head.appendChild(ref_tag);
    return node;
}