
import { println, alter, flatMap } from "./util";
import * as convert from "./convert";
convert.init();
import {
    Processor,
    ReplaceRule,
    edit_rule,
    filter_rule,
    context_free_rule_processor,
    processor_pipeline,
    map_elements,
} from './transform';
import { content_wrap, column_wrap } from "./wrap";

import { el, setAttr } from 'redom';
import ProcessEnv = NodeJS.ProcessEnv;

let dom: Node[] = convert.read_dom("./do.html");

let rules: ReplaceRule[] = [];

// ====

// h4 -> span
rules.push(edit_rule((elem: Element) => {
    if (elem.tagName === 'H4') {
        return alter(elem, {
            tagName: 'span',
            classList: 'title',
        });
    } else {
        return null;
    }
}));

// img break wrapping
for (let n = 1; n <= 5; n++) {
    rules.push(edit_rule((elem: Element) => {
        let class_name_before = `img-break-${n}uh`;
        let class_name_after = `img-break-${n}uh-block`;

        if (elem.tagName === 'IMG'
            && Array.from(elem.classList).includes(class_name_before)) {

            println('yahoo!');

            let out = el(`div.${class_name_after}`,
                alter(elem, {
                    tagName: 'IMG',
                    classList: Array.from(elem.classList)
                        .filter(c => c != class_name_before)
                        .concat(['img-break-inner', 'img-pretty'])
                })
            );
            return out;
        } else {
            return null;
        }

    }));
}

// ====

function absolute_path_prepend(root: string, attrib_key?: string): Processor {
    if (attrib_key) {
        return map_elements((elem: Element) => {
            let path: string | null = elem.getAttribute(attrib_key);

            if (path == null) {
                return elem;
            }
            if (path[0] != '/') {
                return elem;
            }

            let patch: any = {};
            patch[attrib_key] = root + path;

            let out = alter(elem, patch);
            return out;
        });
    } else {
        return processor_pipeline([
            absolute_path_prepend(root, 'src'),
            absolute_path_prepend(root, 'href'),
        ])
    }
}

// ===

let project_base = '/Users/kahlo/Desktop/stylin';

let processor = context_free_rule_processor(rules);


//let processor = context_free_rule_processor(rules);

let dom2 = flatMap(dom, processor);
let dom3 = content_wrap(dom2, {
    title: 'Why is it so hard to do things?',
    path: ['do'],
    mini: 'Do',
});
let dom4 = column_wrap([dom3], 'col-5uw');

//convert.save_dom_html(dom3, "./target.html");
convert.save_dom_html(dom4, "../target/content/do/do.html");


