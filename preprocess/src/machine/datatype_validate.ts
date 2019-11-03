import {is_node} from "../general/dom_edit_utils";
import {present} from "../general/utils";
import {PageBoilerplateMetadata} from "../phoenixkahlo/dom_wrappers";

export interface CleanerValidator<T> {
    (datum: any): T | undefined;
}

function req_type<T>(type_name: string): CleanerValidator<T> {
    return (value: any) => (typeof value == type_name) ? <T>value : undefined;
}

export const req_string = req_type<string>('string');
const req_number = req_type<number>('number');
const req_boolean = req_type<boolean>('boolean');

function req_array<T>(elem_validator: CleanerValidator<T>): CleanerValidator<T[]> {
    return (value: any) => {
        if (!Array.isArray(value)) {
            throw `require array, got: ${JSON.stringify(value)}`;
        }

        let dirty_arr: any[] = <any[]>value;
        let clean_arr: T[] = [];

        for (let dirty_elem of dirty_arr) {
            let clean_elem = elem_validator(dirty_elem);
            if (clean_elem == null) {
                throw `failed to validate subelement: ${JSON.stringify(dirty_elem)}`;
            } else {
                clean_arr.push(clean_elem);
            }
        }

        return clean_arr;
    };
}

export function req_page_meta(value: any): PageBoilerplateMetadata {
    return {
        title: present(req_string(value['title']), 'title'),
        path: present(req_array(req_string)(value['path']), 'path'),
        mini: present(req_string(value['mini']), 'mini'),
    };
}

export function req_node_array(value: any): Node[] {
    if (Array.isArray(value)) {
        value = <any[]>value;
        for (let elem of value) {
            if (!is_node(elem)) {
                throw `expected node, got: ${elem}`;
            }
        }
        return <Node[]>value;
    } else {
        if (is_node(value)) {
            return [value];
        } else {
            throw `expected node, got: ${value}`;
        }
    }
}