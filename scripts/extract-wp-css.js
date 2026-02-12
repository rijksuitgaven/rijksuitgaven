// Run this in Chrome DevTools Console on rijksuitgaven.nl (after accepting cookies)
// File: scripts/extract-wp-css.js

var props = [
  "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing",
  "color", "backgroundColor", "borderRadius", "padding", "margin",
  "maxWidth", "textTransform", "borderTopWidth", "boxShadow"
];

function g(el) {
  var cs = window.getComputedStyle(el);
  var o = { tag: el.tagName, text: el.textContent.slice(0, 60).trim() };
  for (var i = 0; i < props.length; i++) {
    o[props[i]] = cs[props[i]];
  }
  return o;
}

var r = {};

// Headings
var heads = document.querySelectorAll("h1,h2,h3,h4,h5,h6,.et_pb_module_header");
r.headings = [];
for (var i = 0; i < heads.length; i++) { r.headings.push(g(heads[i])); }

// Paragraphs
var paras = document.querySelectorAll("p");
r.paragraphs = [];
for (var i = 0; i < Math.min(paras.length, 15); i++) { r.paragraphs.push(g(paras[i])); }

// Buttons
var btns = document.querySelectorAll(".et_pb_button");
r.buttons = [];
for (var i = 0; i < btns.length; i++) { r.buttons.push(g(btns[i])); }

// Sections
var secs = document.querySelectorAll(".et_pb_section");
r.sections = [];
for (var i = 0; i < secs.length; i++) {
  var cs = window.getComputedStyle(secs[i]);
  var h = secs[i].querySelector("h2,h3,h1");
  r.sections.push({
    text: h ? h.textContent.slice(0, 40) : "(none)",
    bg: cs.backgroundColor,
    padding: cs.padding
  });
}

// Blurbs
var blurbs = document.querySelectorAll(".et_pb_blurb_content");
r.blurbs = [];
for (var i = 0; i < Math.min(blurbs.length, 6); i++) {
  var t = blurbs[i].querySelector("h4,.et_pb_module_header");
  var d = blurbs[i].querySelector(".et_pb_blurb_description p");
  r.blurbs.push({
    title: t ? g(t) : null,
    desc: d ? g(d) : null
  });
}

// Large text modules
var texts = document.querySelectorAll(".et_pb_text");
r.large_text = [];
for (var i = 0; i < Math.min(texts.length, 20); i++) {
  var inner = texts[i].querySelector("h1,h2,h3,h4,p");
  if (inner) { r.large_text.push(g(inner)); }
}

copy(JSON.stringify(r, null, 2));
console.log("Done! Copied to clipboard. Paste it to Claude.");
