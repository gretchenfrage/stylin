/**
 * Console.log alias.
 */
function println(string) {
  if (string === undefined) {
    string = "";
  }
  console.log(string);
}

/**
 * Initialize the preprocessor global state.
 */
function init() {
  // import jsdom
  let jsdom = require("jsdom");
  const { JSDOM } = jsdom;
  global.JSDOM = JSDOM;

  // create a global fake DOM, so that redom can initialize properly
  let window = (new JSDOM("")).window;
  global.document = window.document;
  global.SVGElement = window.SVGElement;

  // import redom
  global.redom = require("redom");

  // import file system
  global.fs = require("fs");
}

/**
 * Read a file, parse it as jsdom DOM.
 */
function read_dom(file) {
  let src = fs.readFileSync(file, 'utf8');
  return JSDOM.fragment(src);
}

/**
 * Convert a DocumentFragment into a string.
 */
function render_dom(dom) {
  return Array.from(dom.childNodes)
    .map(node => node.outerHTML)
    .filter(part => part !== undefined)
    .reduce((whole, part) => whole + part + '\n', '');
}

/**
 * Convert a DocumentFragment into a string, save it to a file.
 */
function save_dom_html(dom, file) {
  let html = render_dom(dom);
  fs.writeFileSync(file, html);
}

// ===========================

function replace_rule(lambda) {

}

// ===========================

function main() {
  println("initializing preprocessor");
  init();
  println();

  println("reading file");
  let dom = read_dom('do.html');
  println();

  println('writing file');
  save_dom_html(dom, 'target.html');
  println();

  println('done!');
}

main();

/*
// set up
function setUp() {
  console.log('beginning preprocessor');

  // read the index.html
  const fs = require('fs');
  let index_str = fs.readFileSync('../template/index.html', 'utf8');

  // create the global fake DOM
  const jsdom = require("jsdom");
  const { JSDOM } = jsdom;
  let window = (new JSDOM(index_str)).window;
  global.document = window.document;
  global.SVGElement = window.SVGElement;

  // import redom through npm, since the browser accesses it differently
  // this has to be done after the fake dom is loaded
  const redom = require('redom');
  global.redom = redom;

  console.log('set up complete!');
}

setUp();

//// enter frontend-accessible code ////

//// exit frontend-accessible code ////

// render HTMl
console.log('rendering HTML:');
console.log(document.body.outerHTML);
 */