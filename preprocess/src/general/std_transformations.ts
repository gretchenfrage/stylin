import {map_elements, Processor, processor_pipeline} from "./dom_transform_algebra";
import {alter_elem} from "./dom_edit_utils";

/**
 * Find any node with a src or href property that's an absolute path, and re-relativize it.
 */
export function absolute_path_prepend(root: string, attrib_key?: string): Processor {
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

            let out = alter_elem(elem, patch);
            return out;
        });
    } else {
        return processor_pipeline([
            absolute_path_prepend(root, 'src'),
            absolute_path_prepend(root, 'href'),
        ])
    }
}