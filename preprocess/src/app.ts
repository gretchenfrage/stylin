
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
import * as yaml from 'js-yaml';

let dom: Node[] | Node = convert.read_dom("./do.html");

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

            let out = el(`div.${class_name_after}`,
                alter(elem, {
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

let rule_processor = context_free_rule_processor(rules);

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


dom = flatMap(dom, rule_processor);
dom = column_wrap(dom, 'col-5uw');
dom = content_wrap([dom], {
    title: 'Why is it so hard to do things?',
    path: ['do'],
    mini: 'Do',
});
dom = flatMap([dom], absolute_path_prepend('/Users/kahlo/Desktop/stylin'));

//convert.save_dom_html(dom, "../target/content/do/do.html");

import * as fs from 'fs';

let y = yaml.safeLoad(fs.readFileSync('./instrs.yaml', 'utf8'));
println(`${JSON.stringify(y)}`);

/*
function foo<T extends string | undefined>(n?: T): T extends string ? number : false {
    if (n) {
        return <T extends string ? number : false> n.length;
    } else {
        return <T extends string ? number : false> false;
    }
}

let a: number = foo("hello");
let b: boolean = foo(undefined);

 */