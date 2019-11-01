
import { println, alter, flatMap } from "./util";
import * as convert from "./convert";
convert.init();
import {
    Processor,
    ReplaceRule,
    edit_rule,
    filter_rule,
    context_free_rule_processor,
    processor_pipeline
} from './transform';

import { el, setAttr } from 'redom';

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

            return el(`div.${class_name_after}`,
                alter(elem, {
                    tagName: 'IMG',
                    classList: Array.from(elem.classList)
                        .filter(c => c != class_name_before)
                        .concat(['img-break-inner', 'img-pretty'])
                })
            );
        } else {
            return null;
        }

    }));
}

// ====

let processor = context_free_rule_processor(rules);

let dom2 = flatMap(dom, processor);

convert.save_dom_html(dom2, "./target.html");

