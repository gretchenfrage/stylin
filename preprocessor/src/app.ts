
import * as html_file_ops from './general/html_file_ops';
html_file_ops.init();
import * as utils from './general/utils';
import * as dom_transform_algebra from './general/dom_transform_algebra';
import * as dom_edit_utils from './general/dom_edit_utils';
import * as std_transforms from './general/std_transformations';
import * as redirect_page from './general/redirect_page';

import * as machine_types from './machine/types';
import * as build from './machine/build';
import * as datatype_validate from './machine/datatype_validate';
import * as machinery from './machine/machinery';
import * as std_ops from './machine/std_ops';

import * as wrappers from './phoenixkahlo/dom_wrappers';
import * as formatters from './phoenixkahlo/formatters';

import {OpHandler, OpHandlerSet} from "./machine/types";
import {OpContext} from "./machine/machinery";
import {context_free_rule_processor, Processor} from "./general/dom_transform_algebra";
import {content_wrap, PageBoilerplateMetadata} from "./phoenixkahlo/dom_wrappers";
import {req_any_of, req_exact_value, req_page_meta} from "./machine/datatype_validate";
import {println} from "./general/utils";
import {req_string} from "./machine/datatype_validate";
import {column_wrap} from "./phoenixkahlo/dom_wrappers";
import {
    ExternalCode,
    fmt_code_colorize_directives,
    fmt_h4_subheader,
    fmt_img_breaks,
    fmt_inline_code_directives,
    PygmentStyle
} from "./phoenixkahlo/formatters";
import {absolute_path_prepend, insertCssRefTag} from "./general/std_transformations";
import {ExternalCodeRetriever} from "./phoenixkahlo/formatters";
import {readFileSync} from "fs";
import {single_node_mapping} from "./machine/std_ops";

function main() {
    // parse args
    let from: string = process.argv[2];
    let to: string = process.argv[3];

    let abs_path_base: string | undefined = process.env['ABSOLUTE_PATH_PREPEND'];

    // construct the op handler set
    function wrapWithBoilerplate(ctx: OpContext, content: Node[]): Node {
        let page_meta: PageBoilerplateMetadata = ctx
            .meta_inline_validate('page', req_page_meta);

        println('> wrapping with phoenixkahlo.com boilerplate');
        return content_wrap(content, page_meta, ctx.args);
    }

    function wrapWithColumn(ctx: OpContext, content: Node[]): Node {
        let col_class: string = ctx
            .require_arg_valid('column_class', req_string);

        println(`> wrapping with column class=${col_class}`);
        return column_wrap(content, col_class);
    }

    let absPathRebase: OpHandler;
    if (abs_path_base != null) {
        absPathRebase = std_ops.apply_processor(
            absolute_path_prepend(abs_path_base),
            'absolute path prepend (for local dev)'
        );
    } else {
        absPathRebase = std_ops.no_op;
    }

    function get_meta_pygment_style(ctx: OpContext): PygmentStyle {
        return ctx.option_meta_validate(
            'pygment_style',
            req_any_of<PygmentStyle>([
                req_exact_value(false),
                req_string,
            ])
        );
    }

    /**
     * Inline code directives, with styling according to [meta.pygment_style].
     *
     * Process is parametric over the context, since retrieved external code files
     * are relative to the content's build directory.
     */
    function inline_code_directives_processor(ctx: OpContext): Processor {
        /**
         * The callback we'll pass to retrieve the code.
         */
        function retrieve_code(path: string): ExternalCode | undefined {
            path = ctx.pathologize(path, 'source');
            return { file_path: path };
        }

        let pygment_style: PygmentStyle = get_meta_pygment_style(ctx);

        return context_free_rule_processor([
            fmt_inline_code_directives(retrieve_code, pygment_style)
        ]);
    }

    function colorize_code_directives_processor(ctx: OpContext): Processor {
        let pygment_style: PygmentStyle = get_meta_pygment_style(ctx);

        return context_free_rule_processor([
            fmt_code_colorize_directives(pygment_style)
        ]);
    }

    /**
     * Add a CSS ref to the stylesheet of [meta.pygment_style].
     * @param ctx
     * @param dom
     */
    function add_pygment_css_ref(ctx: OpContext, dom: Node): Node {
        println('> adding pygment CSS ref');

        let pygment_style: PygmentStyle = get_meta_pygment_style(ctx);
        if (pygment_style === false) {
            println('>: pygment_style == false, this becomes a no-op');
            return dom;
        }

        let path: string;
        if (pygment_style == null) {
            pygment_style = 'default';
        }
        path = `/css/pygment-themes/${pygment_style}.css`;

        dom = insertCssRefTag(dom, path);
        return dom;
    }

    let ops: OpHandlerSet = {
        copy: std_ops.copy,
        readDOM: std_ops.readDOM,
        readTxt: std_ops.readTxt,
        writeHTML: std_ops.writeHTML,
        mergeCSSIntoPage: std_ops.mergeCSSIntoPage,
        addCssRef: std_ops.addCssRef,

        redirect: std_ops.create_redirect_page_prepend(abs_path_base),

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
        inlineCodeDirectives: std_ops.apply_parametric_processor(
            inline_code_directives_processor,
            'format directives to inline code',
        ),
        colorizeCodeDirectives: std_ops.apply_parametric_processor(
            colorize_code_directives_processor,
            'format directives to colorize code',
        ),
        addPygmentCssRef: single_node_mapping(add_pygment_css_ref),

        absPathRebase: absPathRebase,
    };

    // run the machine
    build.build(ops, from, to)
}

try {
    main();
} catch (e) {
    if (typeof e !== 'string') {
        throw e;
    }

    const Reset = "\x1b[0m"
    const Bright = "\x1b[1m"
    const Dim = "\x1b[2m"
    const Underscore = "\x1b[4m"
    const Blink = "\x1b[5m"
    const Reverse = "\x1b[7m"
    const Hidden = "\x1b[8m"

    const FgBlack = "\x1b[30m"
    const FgRed = "\x1b[31m"
    const FgGreen = "\x1b[32m"
    const FgYellow = "\x1b[33m"
    const FgBlue = "\x1b[34m"
    const FgMagenta = "\x1b[35m"
    const FgCyan = "\x1b[36m"
    const FgWhite = "\x1b[37m"

    const BgBlack = "\x1b[40m"
    const BgRed = "\x1b[41m"
    const BgGreen = "\x1b[42m"
    const BgYellow = "\x1b[43m"
    const BgBlue = "\x1b[44m"
    const BgMagenta = "\x1b[45m"
    const BgCyan = "\x1b[46m"
    const BgWhite = "\x1b[47m"

    println(`${FgRed}ERROR: ${e}${Reset}`);
    process.exit(1);
}