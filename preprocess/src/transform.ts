
import { node_is_element } from "./util";

/**
 * Node sequence transformation.
 */
type Processor = (Node) => Node[];

/**
 * Optionally matching node transformation.
 */
type ReplaceRule = (Node, Processor) => Node[] | null;

/**
 * Replace rule: transform 1 elem -> 1 elem, recurse on children.
 * @param rule
 */
function edit_rule(rule: (Element) => Element | null): ReplaceRule {
    return (node, processor) => {
        if (node_is_element(node)) {
            let edit = rule(node);
            if (edit === null) {
                return null;
            } else {
                let new_children = Array.from(edit.children).flatMap(processor);

                // replace the children
                edit = <Element> edit.cloneNode(false);
                while (edit.firstChild) {
                    edit.firstChild.remove();
                }
                new_children.forEach(edit.appendChild);

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
function filter_rule(rule: (Element) => boolean): ReplaceRule {
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
function context_free_rule_processor(rules: ReplaceRule[]): Processor {
    return function(node: Node) {
        for (let rule of rules) {
            let replace: Node[] | null = rule(node, this);
            if (replace !== null) {
                return replace;
            }
        }

        return [node];
    };
}

/**
 * Fold nodes through a sequence of processors.
 */
function processor_pipeline(processors: Processor[]): Processor {
    return (node: Node) => {
        let seq: Node[] = [node];

        for (let stage of processors) {
            seq = seq.flatMap(stage);
        }

        return seq;
    };
}