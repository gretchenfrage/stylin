
import { println } from "./util";
import * as convert from "./convert";
convert.init();
import { el } from 'redom';

let dom = convert.read_dom("./do.html");
convert.save_dom_html(dom, "./target.html");
