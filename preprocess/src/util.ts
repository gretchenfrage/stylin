
import { el } from "redom";

/**
 * Console.log alias.
 */
export function println(str: any) {
    str = str || '';
    console.log(str);
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

export function flatMap<A, B>(array: A[], lambda: (A) => B[]): B[] {
    let fmapped = [];
    for (let a of array) {
        for (let b of lambda(a)) {
            fmapped.push(b);
        }
    }
    return fmapped;
}