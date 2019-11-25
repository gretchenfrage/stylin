import {context_free_rule_processor, edit_rule, map_elements, Processor, ReplaceRule} from "../general/dom_transform_algebra";
import {el, html} from "redom";
import {alter_elem, node_is_element} from "../general/dom_edit_utils";
import {flat_map, println} from "../general/utils";

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

const use_our_code_bg_color: boolean = false;

function disable_bg(elem: Element): Element {
    elem = <Element>elem.cloneNode(true);
    elem.classList.add('override-inherit-background-color');
    return elem;
}

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

                // wrap it in our code box
                let code_box: Element;

                // but... make the code background color consistent
                if (use_our_code_bg_color) {
                    fmt_dom = flat_map(fmt_dom, map_elements(disable_bg));

                    code_box = el('div', {class: 'code'}, fmt_dom);
                } else {
                    code_box = el(
                        'div',
                        { class: 'code override-colored-code-background-color'},
                        fmt_dom,
                        );
                }

                return [code_box];
            }
        } else {
            return null;
        }
    }
}

export function fmt_code_colorize_directives(pygment_style: PygmentStyle): ReplaceRule {
    return (node: Node, processor: Processor): Node[] => {
        if (!node_is_element(node)) {
            return null;
        }
        let elem: Element = node;

        if (!elem.hasAttribute('code-colorize')) {
            return null;
        }

        if (pygment_style === false) {
            return [node];
        }

        if (pygment_style == null) {
            pygment_style = 'default';
        }

        let lexer = elem.getAttribute('code-colorize');
        let code = elem.textContent;

        let command = `pygmentize -f html -l ${lexer} -O style=${pygment_style}`;
        let inner_html: string = proc.execSync(command, {
            encoding: 'utf-8',
            input: code,
            stdio: 'pipe',
        });
        let inner_dom: Node[] = eval_dom(inner_html);

        let elem_colored: Element;

        elem_colored = <Element> elem.cloneNode(false);
        elem_colored.removeAttribute('code-colorize');

        if (use_our_code_bg_color) {
            inner_dom = flat_map(inner_dom, map_elements(disable_bg));
        } else {
            elem_colored.classList.add('override-colored-code-background-color');
        }

        for (let child of inner_dom) {
            elem_colored.appendChild(child);
        }

        return [elem_colored];
    };
}

export function fmt_code_pre_blocks(
    pygment_style: PygmentStyle,
): ReplaceRule {
    return (node: Node, processor: Processor): Node[] | null => {
        if (!node_is_element(node)) {
            return null;
        }
        let elem: Element = node;

        if (
            elem.tagName === 'PRE'
            &&
            Array.from(elem.classList).includes('code')
        ) {
            let code = elem.textContent.trim();
            let lexer = elem.getAttribute('code-colorize');

            if (pygment_style === false) {
                let code_box: Element = el('pre', { class: 'code' }, code);

                return [code_box];
            } else {
                let fmt_html: string;
                if (lexer != null) {
                    let command = `pygmentize -f html -l ${lexer} -O style=${pygment_style}`;
                    fmt_html = proc.execSync(command, {
                        encoding: 'utf-8',
                        input: code,
                        stdio: 'pipe',
                    });
                } else {
                    let command = `pygmentize -f html -g -O style=${pygment_style}`;
                    fmt_html = proc.execSync(command, {
                        encoding: 'utf-8',
                        input: code,
                        stdio: 'pipe',
                    });
                }
                let fmt_dom: Node[] = eval_dom(fmt_html);

                // wrap it in our code box
                let code_box: Element;

                // but... make the code background color consistent
                if (use_our_code_bg_color) {
                    fmt_dom = flat_map(fmt_dom, map_elements(disable_bg));

                    code_box = el('div', {class: 'code'}, fmt_dom);
                } else {
                    code_box = el(
                        'div',
                        { class: 'code override-colored-code-background-color'},
                        fmt_dom,
                    );
                }

                let code_icon = elem.getAttribute('code-icon');
                if (code_icon != null) {
                    let icon_bar = el(
                        'div.code-icon-bar',
                        el(
                            'img.code-icon',
                            { src: code_icon }
                        )
                    );

                    code_box.prepend(icon_bar);
                }

                return [code_box];
            }
        } else {
            return null;
        }
    };
}


/*
function trim_code_snippet(elem: Element): Element | null {
    if (elem.tagName === 'PRE' && Array.from(elem.classList).includes('code')) {
        let elem2 = <Element> elem.cloneNode(true);
        println(`text content = ${elem2.textContent}`);
        elem2.textContent = elem2.textContent.trim();
        println(`text content trimmed = ${elem2.textContent}`);
        println('TRIMMIN');
        return elem2;
    } else {
        return null;
    }
}

export const trim_code_snippet_rule: ReplaceRule = (
    node: Node,
    processor: Processor
): Node[] | null => {
    if (node_is_element(node)) {
        let trimmed = trim_code_snippet(node);
        if (trimmed === null) {
            return null;
        } else {
            return [trimmed];
        }
    } else {
        return null;
    }
};


 */