import {el} from "redom";

export function is_node(value: any): value is Node {
    return 'cloneNode' in value;
}

export function node_is_element(node: Node): node is Element {
    return 'outerHTML' in node;
}

/**
 * Clone node, remove children, replace attributes, return altered version.
 */
export function alter(elem: Element, attrs: object): Element {
    let full_attrs = {};
    let tagName = elem.tagName;

    // see: https://stackoverflow.com/questions/8584098/how-to-change-an-element-type-using-jquery
    for (let k of elem.getAttributeNames()) {
        let v = elem.getAttribute(k);

        if (k == 'tagName') {
            tagName = v;
        } else {
            full_attrs[k] = v;
        }
    }


    for (let k in attrs) {
        let v = attrs[k];

        if (k == 'tagName') {
            tagName = v;
        } else {
            full_attrs[k] = v;
        }
    }

    return el(tagName, full_attrs);
}
