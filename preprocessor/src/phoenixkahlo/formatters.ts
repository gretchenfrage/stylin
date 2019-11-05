import {context_free_rule_processor, edit_rule, Processor, ReplaceRule} from "../general/dom_transform_algebra";
import {el, html} from "redom";
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

export type ExternalCode =
    string |
    { code: string, lexer: string } |
    { file_path: string };
export type ExternalCodeRetriever = (path: string) => ExternalCode | undefined;
export type PygmentStyle = string | undefined | false;

import * as proc from "child_process";
import {eval_dom} from "../general/html_file_ops";

export function fmt_inline_code_directives(
    retrieve_code: ExternalCodeRetriever,
    pygment_style: PygmentStyle
): ReplaceRule {
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

            let code: ExternalCode | undefined = retrieve_code(path);
            if (code == null) {
                throw `failed to retrieve external code for inlining, path=${path}`;
            }

            if (pygment_style === false) {
                let code_box: Element = el('pre', { class: 'code' }, code);

                return [code_box];
            } else {
                if (pygment_style == null) {
                    pygment_style = 'default';
                }

                let fmt_html: string;
                if (typeof code === 'string') {
                    let command = `pygmentize -f html -g -O style=${pygment_style}`;
                    fmt_html = proc.execSync(command, {
                        encoding: 'utf-8',
                        input: code,
                        stdio: 'pipe',
                    });
                } else if ('code' in code && 'lexer' in code) {
                    let command = `pygmentize -f html -l ${code.lexer} -O style=${pygment_style}`;
                    fmt_html = proc.execSync(command, {
                        encoding: 'utf-8',
                        input: code.code,
                        stdio: 'pipe',
                    });
                } else if ('file_path' in code) {
                    let command = `pygmentize -f html -g -O style=${pygment_style} ${code.file_path}`;
                    fmt_html = proc.execSync(command, {
                        encoding: 'utf-8',
                        stdio: 'pipe',
                    });
                } else {
                    throw `invalid ExternalCode value: ${JSON.stringify(code)}`;
                }

                let fmt_dom: Node[] = eval_dom(fmt_html);

                let code_box: Element = el('div', { class: 'code' }, fmt_dom);

                return [code_box];

                /*
                // let command = `pygmentize -f html -g -O style=${pygment_style}`;
                let command = `pygmentize -f html -g`;
                let fmt_html: string = proc.execSync(command, {
                    encoding: 'utf-8',
                    input: code,
                    stdio: 'pipe',
                });
                let fmt_dom: Node[] = eval_dom(fmt_html);

                let code_box: Element = el('div', { class: 'code' }, fmt_dom);

                return [code_box];

                 */
            }

//            // TODO: color formatting
//            /*
//            execSync('pygmentize -f html -g -O style=tango ClassMatcher.java')
//            */
//            let command = `pygmentize -f html -g -O style=tango`;
//            let html_pretty: string = proc.execSync(command, {
//                encoding: 'utf-8',
//                input: code,
//                stdio: 'pipe',
//            });
//
//            let dom_pretty: Node[] = eval_dom(html_pretty);
//
//            return [el('div', { class: 'code' }, dom_pretty)];
//
//            /*
//            let code_box: Element = el('pre', { class: 'code' }, code);
//            return [code_box];
//            */
        } else {
            return null;
        }
    }
}
