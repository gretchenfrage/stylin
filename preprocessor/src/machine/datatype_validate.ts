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
export const req_number = req_type<number>('number');
export const req_boolean = req_type<boolean>('boolean');

export function req_integer<T>(value: any): number | undefined {
    if (typeof value == 'number') {
        if (value % 1 == 0) {
            return value;
        } else {
            throw `not an integer: ${value}`;
        }
    } else {
        throw `not a number`;
    }
}

export function req_exact_value<T>(exact_value: T): CleanerValidator<T> {
    return (value: any) => (value === exact_value) ? <T> value : undefined;
}

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
        value = <any[]> value;
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

export function req_single_node(value: any): Node {
    let single_value: any;

    if (Array.isArray(value)) {
        value = <any[]> value;
        if (value.length == 1) {
            single_value = value[0];
        } else {
            throw `expected single node, got incorrect length array: ${value}`;
        }
    } else {
        single_value = value;
    }

    if (is_node(value)) {
        return value;
    } else {
        throw `expected node, got: ${value}`;
    }
}

export function req_any_of<T>(possibilities: CleanerValidator<T>[]): CleanerValidator<T> {
    return (value: any): T => {
        for (let variant of possibilities) {
            let clean: T | undefined = variant(value);
            if (clean != null) {
                return clean;
            }
        }

        throw `expected any of several types, got none of them`;
    }
}