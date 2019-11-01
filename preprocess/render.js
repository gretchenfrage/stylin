
// set up
function setUp() {
  // prevent these local variables from accidentally being accessed from frontend code

  // log
  console.log('starting renderer');

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
// TODO: ^ factor this out into its own file? that can just be, imported from the frontend?

// redom procedural layout
const {
  el,
  setChildren,
  mount
} = redom;
console.log('doing layout');

// instantiation helpers
function spacer_col () {
  return el('div', { className: 'col l2 hide-on-med-and-down' });
}

class ContentRow {
  constructor(inner) {
    this.el = el('div', { className: "row" },
      spacer_col(),
      el('div', { className: 'col s12 l8 content-block' }, inner),
      spacer_col(),
    );
  }
}

// manipulation helpers
function lookup(id) {
  return document.getElementById(id);
}

function wrapElem (elem, wrapper) {
  mount(elem.parentNode, wrapper(elem.cloneNode(true)), elem, true);
}

function reflWrap (reflName, wrapper) {
  var slides = document.getElementsByClassName('refl-' + reflName);
  for(var i = 0; i < slides.length; i++) {
    wrapElem(slides.item(i), wrapper);
  }
}

// procedurally setup page
let pages = {
  'About Me': {},
  'Blog': {},
  'Crates': {},
  'Endworld': {},
  'Sentences': {},
  'Contact': {}
};
let activePage = 'About Me';

reflWrap('block', function (elem) { return new ContentRow(elem) });

setChildren(
  lookup('header-list'),
  Object.keys(pages)
    .map(function (name) {
      return el('li', { className: name === activePage ? 'header-active-page' : '' }, name);
    })
);

//// exit frontend-accessible code ////

// render HTMl
console.log('rendering HTML:');
console.log(document.body.outerHTML);