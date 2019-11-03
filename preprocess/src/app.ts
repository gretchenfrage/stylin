
import * as html_file_ops from './general/html_file_ops';
html_file_ops.init();
import * as utils from './general/utils';
import * as dom_transform_algebra from './general/dom_transform_algebra';
import * as dom_edit_utils from './general/dom_edit_utils';
import * as std_transforms from './general/std_transformations';

import * as machine_types from './machine/types';
import * as build from './machine/build';
import * as datatype_validate from './machine/datatype_validate';
import * as machinery from './machine/machinery';
import * as std_ops from './machine/std_ops';

import * as wrappers from './phoenixkahlo/dom_wrappers';
import * as formatters from './phoenixkahlo/formatters';

import {OpHandlerSet} from "./machine/types";
import {OpContext} from "./machine/machinery";
import {context_free_rule_processor, Processor} from "./general/dom_transform_algebra";
import {content_wrap, PageBoilerplateMetadata} from "./phoenixkahlo/dom_wrappers";
import {req_page_meta} from "./machine/datatype_validate";
import {println} from "./general/utils";
import {req_string} from "./machine/datatype_validate";
import {column_wrap} from "./phoenixkahlo/dom_wrappers";
import {fmt_h4_subheader, fmt_img_breaks} from "./phoenixkahlo/formatters";
import {absolute_path_prepend} from "./general/std_transformations";

function main() {
    // construct the op handler set
    function wrapWithBoilerplate(ctx: OpContext, content: Node[]): Node {
        let page_meta: PageBoilerplateMetadata = ctx
            .meta_inline_validate('page', req_page_meta);

        println('> wrapping with phoenixkahlo.com boilerplate');
        return content_wrap(content, page_meta);
    }

    function wrapWithColumn(ctx: OpContext, content: Node[]): Node {
        let col_class: string = ctx
            .require_arg_valid('column_class', req_string);

        println(`> wrapping with column class=${col_class}`);
        return column_wrap(content, col_class);
    }

    let ops: OpHandlerSet = {
        copy: std_ops.copy,
        readDOM: std_ops.readDOM,
        writeHTML: std_ops.writeHTML,

        wrapWithBoilerplate: std_ops.dom_mapping(wrapWithBoilerplate),
        wrapWithColumn: std_ops.dom_mapping(wrapWithColumn),

        fmtSubheadersH4: std_ops.apply_processor(
            context_free_rule_processor([fmt_h4_subheader]),
            'format h4 -> subheader',
        ),

        fmtImgBreaks: std_ops.apply_processor(
            context_free_rule_processor(fmt_img_breaks),
            'format img breaks',
        ),

        absPathRebase: std_ops.apply_processor(
            absolute_path_prepend('../../..'),
            'absolute path prepend (for local dev)'
        )
    };

    // run the machine
    build.build(ops, 'sandbox/from', 'sandbox/to')
}

main();
