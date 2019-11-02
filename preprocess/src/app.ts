
import * as html_file_ops from './general/html_file_ops';
html_file_ops.init();
import * as utils from './general/utils';
import * as dom_transform_algebra from './general/dom_transform_algebra';
import * as dom_edit_utils from './general/dom_edit_utils';
import * as machine_types from './machine/types';
import * as build from './machine/build';
import * as datatype_validate from './machine/datatype_validate';
import * as machinery from './machine/machinery';

import * as wrap from './wrap';
//import * as build from './machine/build';

build.build(build.std_op_set, 'sandbox/from', 'sandbox/to');
