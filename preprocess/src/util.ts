
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