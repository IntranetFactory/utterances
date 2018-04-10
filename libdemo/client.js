// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})({56:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function deparam(query) {
    var match;
    var plus = /\+/g;
    var search = /([^&=]+)=?([^&]*)/g;
    var decode = function decode(s) {
        return decodeURIComponent(s.replace(plus, ' '));
    };
    var params = {};
    while (match = search.exec(query)) {
        params[decode(match[1])] = decode(match[2]);
    }
    return params;
}
exports.deparam = deparam;
function param(obj) {
    var parts = [];
    for (var name in obj) {
        if (obj.hasOwnProperty(name)) {
            parts.push(encodeURIComponent(name) + "=" + encodeURIComponent(obj[name]));
        }
    }
    return parts.join('&');
}
exports.param = param;
},{}],20:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var deparam_1 = require("./deparam");
var script = document.querySelector('#GitHubCommentScript');
if (!script) {
    throw Error("GitHubCommentScript configuration element is required");
}
var attrs = {};
for (var i = 0; i < script.attributes.length; i++) {
    var attribute = script.attributes.item(i);
    attrs[attribute.name] = attribute.value;
}
attrs.url = location.href;
attrs.origin = location.origin;
attrs.pathname = location.pathname.substr(1).replace(/\.\w+$/, '');
attrs.title = document.title;
var descriptionMeta = document.querySelector("meta[name='description']");
attrs.description = descriptionMeta ? descriptionMeta.content : '';
document.head.insertAdjacentHTML('afterbegin', "<style>\n    .utterances {\n      position: relative;\n      width: 100%;\n    }\n    .utterances-frame {\n      position: absolute;\n      left: 0;\n      right: 0;\n      width: 1px;\n      min-width: 100%;\n      max-width: 100%;\n      height: 100%;\n      border: 0;\n    }\n  </style>");
var url = attrs['resources-path'] + '/utterances.html';
script.insertAdjacentHTML('afterend', "<div class=\"utterances\">\n    <iframe class=\"utterances-frame\" scrolling=\"no\" src=\"" + url + "?" + deparam_1.param(attrs) + "\"></iframe>\n  </div>");
var container = script.nextElementSibling;
script.parentElement.removeChild(script);
addEventListener('message', function (event) {
    var data = event.data;
    if (data && data.type === 'resize' && data.height) {
        container.style.height = data.height + "px";
    }
});
},{"./deparam":56}]},{},[20])
//# sourceMappingURL=client.map