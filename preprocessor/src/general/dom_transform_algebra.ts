import {flat_map} from "./utils";
import {alter_elem, node_is_element} from "./dom_edit_utils";

/**
 * Node sequence transformation.
 */
export type Processor = (Node) => Node[];

/**
 * Optionally matching node transformation.
 */
export type ReplaceRule = (Node, Processor) => Node[] | null;

/**
 * Replace rule: transform 1 elem -> 1 elem, recurse on children.
 *
 * @param rule
 */
export function edit_rule(rule: (Element) => Element | null): ReplaceRule {
    return (node, processor) => {
        if (node_is_element(node)) {
            let edit = rule(node);
            if (edit === null) {
                return null;
            } else {
                let new_children: Node[] = flat_map(Array.from(node.childNodes), processor);

                // replace children
                let mount_to: Node = edit;
                while (mount_to.childNodes.length > 0) {
                    if (mount_to.childNodes.length == 1) {
                        mount_to = mount_to.firstChild;
                    } else {
                        throw `edit_rule replacement has too many children ${mount_to}`;
                    }
                }
                for (let child of new_children) {
                    mount_to.appendChild(child);
                }

                return [edit];
            }
        } else {
            return null;
        }
    };
}

/**
 * Replace rule: remove the elem if it fails a predicate.
 */
export function filter_rule(rule: (Element) => boolean): ReplaceRule {
    return (node, processor) => {
        if (node_is_element(node) && !rule(node)) {
            return [];
        } else {
            return null;
        }
    };
}

/**
 * Transform node through the first replace rule which matches.
 *
 * If none match, leave as-is.
 */
export function context_free_rule_processor(rules: ReplaceRule[]): Processor {
    function self(node: Node) {
        // try all rules
        for (let rule of rules) {
            let replace: Node[] | null = rule(node, self);
            if (replace !== null) {
                return replace;
            }
        }

        // fall back to identity edit-rule
        // (so that we recurse to children)
        // but return it unaltered if it's not an element
        // (eg. it's text)
        let fallback = edit_rule(elem => alter_elem(elem, {}))(node, self) || [node];
        return fallback;
    }

    return self;
}

/**
 * Fold nodes through a sequence of processors.
 */
export function processor_pipeline(processors: Processor[]): Processor {
    return (node: Node) => {
        let seq: Node[] = [node];

        for (let stage of processors) {
            seq = flat_map(seq, stage);
        }

        return seq;
    };
}

/**
 * A mapping on all elements, independent of children.
 *
 * The rule is passed the element with its children, but ignores any
 * modification to the children in the returned element.
 */
export function map_elements(mapping: (Element) => Element): Processor {
    function self(node: Node): Node {
        if (node_is_element(node)) {
            let mapped: Element = mapping(node);
            let mapped_children: Node[] = Array.from(node.childNodes).map(self);

            // clone because:
            // 1. we're going to mutate it
            // 2. to remove its children
            mapped = <Element> mapped.cloneNode(false);

            // then add the mapped children
            for (let child of mapped_children) {
                mapped.appendChild(child);
            }

            return mapped;
        } else {
            return node;
        }
    }

    return (node) => [self(node)];
}