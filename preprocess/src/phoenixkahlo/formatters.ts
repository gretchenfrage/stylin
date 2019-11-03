import {context_free_rule_processor, edit_rule, ReplaceRule} from "../general/dom_transform_algebra";
import {el} from "redom";
import {alter_elem} from "../general/dom_edit_utils";

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
