import {context_free_rule_processor, edit_rule, Processor, ReplaceRule} from "../general/dom_transform_algebra";
import {el} from "redom";
import {alter_elem, node_is_element} from "../general/dom_edit_utils";
import {println} from "../general/utils";

/**
 * Format subheaders from <h4>
 */
export const fmt_h4_subheader: ReplaceRule = edit_rule((elem: Element) => {
    if (elem.tagName === 'H4') {
        return alter_elem(elem, {
            tagName: 'span',
            classList: 'title',
        });
    } else {
        return null;
    }
});

/**
 * Format image breaks from <img.img-break-(1..=5)>.
 */
export const fmt_img_breaks: ReplaceRule[] = [];
for (let n = 1; n <= 5; n++) {
    fmt_img_breaks.push(edit_rule((elem: Element) => {
        let class_name_before = `img-break-${n}uh`;
        let class_name_after = `img-break-${n}uh-block`;

        if (elem.tagName === 'IMG'
            && Array.from(elem.classList).includes(class_name_before)) {

            let out = el(`div.${class_name_after}`,
                alter_elem(elem, {
                    tagName: 'IMG',
                    className: Array.from(elem.classList)
                        .filter(c => c != class_name_before)
                        .concat(['img-break-inner', 'img-pretty'])
                        .reduce((buf, c) => buf + ' ' + c, ''),
                })
            );
            return out;
        } else {
            return null;
        }

    }));
}

export type ExternalCodeRetriever = (path: string) => string | null;

export function fmt_inline_code_directives(retrieve_code: ExternalCodeRetriever): ReplaceRule {
    return (node: Node, processor: Processor): Node[] => {
        if (!node_is_element(node)) {
            return null;
        }
        let elem: Element = node;

        if (Array.from(elem.classList).includes('code-inline-directive')) {

            let path: string = elem.getAttribute('href');
            if (path == null) {
                println('>: WARN: code-inline-directive missing href');
                return null;
            }

            let code: string = retrieve_code(path);
            if (code == null) {
                throw `failed to retrieve external code for inlining, path=${path}`;
            }

            // TODO: color formatting

            let code_box: Element = el('pre', { class: 'code' }, code);

            return [code_box];
        } else {
            return null;
        }
    }
}
