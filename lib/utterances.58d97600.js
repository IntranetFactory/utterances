// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
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
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
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
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"ieWq":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

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
},{}],"Thhf":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = /^([a-z][\w-]+)\/([\w-.]+)$/i;
},{}],"1iUt":[function(require,module,exports) {
"use strict";

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var deparam_1 = require("./deparam");

var repo_regex_1 = __importDefault(require("./repo-regex"));

function readPageAttributes() {
  var params = deparam_1.deparam(location.search.substr(1));
  var issueTerm = null;
  var issueNumber = null;

  if ('issue-term' in params) {
    issueTerm = params['issue-term'];

    if (issueTerm !== undefined) {
      if (issueTerm === '') {
        throw new Error('When issue-term is specified, it cannot be blank.');
      }

      if (['title', 'url', 'pathname'].indexOf(issueTerm) !== -1) {
        issueTerm = params[issueTerm];
      }
    }
  } else if ('issue-number' in params) {
    issueNumber = +params['issue-number'];

    if (issueNumber.toString(10) !== params['issue-number']) {
      throw new Error("issue-number is invalid. \"" + params['issue-number']);
    }
  } else {
    throw new Error('"issue-term" or "issue-number" must be specified.');
  }

  if (!('repo' in params)) {
    throw new Error('"repo" is required.');
  }

  if (!('origin' in params)) {
    throw new Error('"origin" is required.');
  }

  if (!('api-endpoint' in params)) {
    throw new Error('"api-endpoint" is required.');
  }

  var resourcesPath = 'resources-path' in params ? params['resources-path'] : "";
  var matches = repo_regex_1.default.exec(params.repo);

  if (matches === null) {
    throw new Error("Invalid repo: \"" + params.repo + "\"");
  }

  return {
    owner: matches[1],
    repo: matches[2],
    branch: 'branch' in params ? params.branch : 'master',
    configPath: 'config-path' in params ? params['config-path'] : 'utterances.json',
    issueTerm: issueTerm,
    issueNumber: issueNumber,
    origin: params.origin,
    url: params.url,
    title: params.title,
    description: params.description,
    apiEndpoint: params['api-endpoint'],
    resourcesPath: resourcesPath
  };
}

exports.pageAttributes = readPageAttributes();
},{"./deparam":"ieWq","./repo-regex":"Thhf"}],"5+Ph":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var deparam_1 = require("./deparam");

var page_attributes_1 = require("./page-attributes");

var authorizeUrl = page_attributes_1.pageAttributes.apiEndpoint + "/authorize";
var tokenUrl = page_attributes_1.pageAttributes.apiEndpoint + "/token";
var redirect_uri = page_attributes_1.pageAttributes.resourcesPath ? location.origin + "/" + page_attributes_1.pageAttributes.resourcesPath + "/authorized.html" : location.origin + "/authorized.html";

var Token = function () {
  function Token() {
    this.storageKey = 'OAUTH_TOKEN2';
    this.token = null;

    try {
      this.token = localStorage.getItem(this.storageKey);
    } catch (e) {}
  }

  Object.defineProperty(Token.prototype, "value", {
    get: function get() {
      return this.token;
    },
    set: function set(newValue) {
      this.token = newValue;

      try {
        if (newValue === null) {
          localStorage.removeItem(this.storageKey);
        } else {
          localStorage.setItem(this.storageKey, newValue);
        }
      } catch (e) {}
    },
    enumerable: true,
    configurable: true
  });
  return Token;
}();

exports.token = new Token();

function login() {
  window.open(authorizeUrl + "?" + deparam_1.param({
    redirect_uri: redirect_uri
  }));
  return new Promise(function (resolve) {
    return window.notifyAuthorized = resolve;
  }).then(function (search) {
    return fetch(tokenUrl + search, {
      mode: 'cors'
    });
  }).then(function (response) {
    if (response.ok) {
      return response.json();
    }

    return response.text().then(function (text) {
      return Promise.reject("Error retrieving token:\n" + text);
    });
  }).then(function (t) {
    exports.token.value = t;
  }, function (reason) {
    exports.token.value = null;
    throw reason;
  });
}

exports.login = login;
},{"./deparam":"ieWq","./page-attributes":"1iUt"}],"RAYx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function decodeBase64UTF8(encoded) {
  encoded = encoded.replace(/\s/g, '');
  return decodeURIComponent(escape(atob(encoded)));
}

exports.decodeBase64UTF8 = decodeBase64UTF8;
},{}],"nnkK":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var oauth_1 = require("./oauth");

var encoding_1 = require("./encoding");

var page_attributes_1 = require("./page-attributes");

var GITHUB_API = 'https://api.github.com/';
var GITHUB_ENCODING__HTML_JSON = 'application/vnd.github.VERSION.html+json';
var GITHUB_ENCODING__HTML = 'application/vnd.github.VERSION.html';
var GITHUB_ENCODING__REACTIONS_PREVIEW = 'application/vnd.github.squirrel-girl-preview';
var PAGE_SIZE = 100;
var owner;
var repo;
var branch;

function setRepoContext(context) {
  owner = context.owner;
  repo = context.repo;
  branch = context.branch;
}

exports.setRepoContext = setRepoContext;

function githubRequest(relativeUrl, init) {
  init = init || {};
  init.mode = 'cors';
  init.cache = 'no-cache';
  var request = new Request(GITHUB_API + relativeUrl, init);
  request.headers.set('Accept', GITHUB_ENCODING__REACTIONS_PREVIEW);

  if (!/^search\//.test(relativeUrl) && oauth_1.token.value !== null) {
    request.headers.set('Authorization', "token " + oauth_1.token.value);
  }

  return request;
}

var rateLimit = {
  standard: {
    limit: Number.MAX_VALUE,
    remaining: Number.MAX_VALUE,
    reset: 0
  },
  search: {
    limit: Number.MAX_VALUE,
    remaining: Number.MAX_VALUE,
    reset: 0
  }
};

function processRateLimit(response) {
  var limit = response.headers.get('X-RateLimit-Limit');
  var remaining = response.headers.get('X-RateLimit-Remaining');
  var reset = response.headers.get('X-RateLimit-Reset');
  var isSearch = /\/search\//.test(response.url);
  var rate = isSearch ? rateLimit.search : rateLimit.standard;
  rate.limit = +limit;
  rate.remaining = +remaining;
  rate.reset = +reset;

  if (response.status === 403 && rate.remaining === 0) {
    var resetDate = new Date(0);
    resetDate.setUTCSeconds(rate.reset);
    var mins = Math.round((resetDate.getTime() - new Date().getTime()) / 1000 / 60);
    var apiType = isSearch ? 'search API' : 'non-search APIs';
    console.warn("Rate limit exceeded for " + apiType + ". Resets in " + mins + " minute" + (mins === 1 ? '' : 's') + ".");
  }
}

function readRelNext(response) {
  var link = response.headers.get('link');

  if (link === null) {
    return 0;
  }

  var match = /\?page=([2-9][0-9]*)>; rel="next"/.exec(link);

  if (match === null) {
    return 0;
  }

  return +match[1];
}

function githubFetch(request) {
  return fetch(request).then(function (response) {
    if (response.status === 401) {
      oauth_1.token.value = null;
    }

    if (response.status === 403) {
      response.json().then(function (data) {
        if (data.message === 'Resource not accessible by integration') {
          window.dispatchEvent(new CustomEvent('not-installed'));
        }
      });
    }

    processRateLimit(response);

    if (request.method === 'GET' && [401, 403].indexOf(response.status) !== -1 && request.headers.has('Authorization')) {
      request.headers.delete('Authorization');
      return githubFetch(request);
    }

    return response;
  });
}

function loadJsonFile(path, html) {
  if (html === void 0) {
    html = false;
  }

  var request = githubRequest("repos/" + owner + "/" + repo + "/contents/" + path + "?ref=" + branch);

  if (html) {
    request.headers.set('accept', GITHUB_ENCODING__HTML);
  }

  return githubFetch(request).then(function (response) {
    if (response.status === 404) {
      throw new Error("Repo \"" + owner + "/" + repo + "\" does not have a file named \"" + path + "\" in the \"" + branch + "\" branch.");
    }

    if (!response.ok) {
      throw new Error("Error fetching " + path + ".");
    }

    return html ? response.text() : response.json();
  }).then(function (file) {
    if (html) {
      return file;
    }

    var content = file.content;
    var decoded = encoding_1.decodeBase64UTF8(content);
    return JSON.parse(decoded);
  });
}

exports.loadJsonFile = loadJsonFile;

function loadIssuesByType(term, type) {
  var q = term + " type:issue in:body is:" + type + " repo:" + owner + "/" + repo;
  var request = githubRequest("search/issues?q=" + encodeURIComponent(q) + "&sort=created&order=asc");
  return githubFetch(request).then(function (response) {
    if (!response.ok) {
      throw new Error('Error fetching issues via search.');
    }

    return response.json();
  }).then(function (results) {
    if (results.total_count === 0) {
      return null;
    }

    return results.items;
  });
}

exports.loadIssuesByType = loadIssuesByType;

function loadIssueByTerm(term) {
  var q = "\"" + term + "\" is:issue in:title repo:" + owner + "/" + repo;
  var request = githubRequest("search/issues?q=" + encodeURIComponent(q) + "&sort=created&order=asc");
  return githubFetch(request).then(function (response) {
    if (!response.ok) {
      throw new Error('Error fetching issue via search.');
    }

    return response.json();
  }).then(function (results) {
    if (results.total_count === 0) {
      return null;
    }

    if (results.total_count > 1) {
      console.warn("Multiple issues match \"" + q + "\". Using earliest created.");
    }

    return results.items[0];
  });
}

exports.loadIssueByTerm = loadIssueByTerm;

function loadIssueByNumber(issueNumber) {
  var request = githubRequest("repos/" + owner + "/" + repo + "/issues/" + issueNumber);
  return githubFetch(request).then(function (response) {
    if (!response.ok) {
      throw new Error('Error fetching issue via issue number.');
    }

    return response.json();
  });
}

exports.loadIssueByNumber = loadIssueByNumber;

function commentsRequest(issueNumber, page, pageSize) {
  var page_size = pageSize ? pageSize : PAGE_SIZE;
  var url = "repos/" + owner + "/" + repo + "/issues/" + issueNumber + "/comments?page=" + page + "&per_page=" + page_size;
  var request = githubRequest(url);
  var accept = GITHUB_ENCODING__HTML_JSON + "," + GITHUB_ENCODING__REACTIONS_PREVIEW;
  request.headers.set('Accept', accept);
  return request;
}

function loadCommentsPage(issueNumber, page) {
  var request = commentsRequest(issueNumber, page);
  return githubFetch(request).then(function (response) {
    if (!response.ok) {
      throw new Error('Error fetching comments.');
    }

    var nextPage = readRelNext(response);
    return response.json().then(function (items) {
      return {
        items: items,
        nextPage: nextPage
      };
    });
  });
}

exports.loadCommentsPage = loadCommentsPage;

function loadIssueCreator(issueNumber) {
  var request = commentsRequest(issueNumber, 1, 1);
  return githubFetch(request).then(function (response) {
    if (!response.ok) {
      throw new Error('Error fetching issue creator.');
    }

    return response.json().then(function (items) {
      return items.length ? items[0].user : null;
    });
  });
}

exports.loadIssueCreator = loadIssueCreator;

function loadUser() {
  if (oauth_1.token.value === null) {
    return Promise.resolve(null);
  }

  return githubFetch(githubRequest('user')).then(function (response) {
    if (response.ok) {
      return response.json();
    }

    return null;
  });
}

exports.loadUser = loadUser;

function createIssue(issueTerm, documentUrl, title, description, user) {
  var request = new Request(page_attributes_1.pageAttributes.apiEndpoint + "/repos/" + owner + "/" + repo + "/issues", {
    method: 'POST',
    body: JSON.stringify({
      title: issueTerm,
      body: "# " + title + "\n\n" + description + "\n\n[" + documentUrl + "](" + documentUrl + ")",
      assignees: [user.login]
    })
  });
  request.headers.set('Accept', GITHUB_ENCODING__REACTIONS_PREVIEW);
  request.headers.set('Authorization', "token " + oauth_1.token.value);
  return fetch(request).then(function (response) {
    if (!response.ok) {
      throw new Error('Error creating comments container issue');
    }

    return response.json();
  });
}

exports.createIssue = createIssue;

function postComment(issueNumber, markdown) {
  var url = "repos/" + owner + "/" + repo + "/issues/" + issueNumber + "/comments";
  var body = JSON.stringify({
    body: markdown
  });
  var request = githubRequest(url, {
    method: 'POST',
    body: body
  });
  var accept = GITHUB_ENCODING__HTML_JSON + "," + GITHUB_ENCODING__REACTIONS_PREVIEW;
  request.headers.set('Accept', accept);
  return githubFetch(request).then(function (response) {
    if (!response.ok) {
      throw new Error('Error posting comment.');
    }

    return response.json();
  });
}

exports.postComment = postComment;

function renderMarkdown(text) {
  var body = JSON.stringify({
    text: text,
    mode: 'gfm',
    context: owner + "/" + repo
  });
  return githubFetch(githubRequest('markdown', {
    method: 'POST',
    body: body
  })).then(function (response) {
    return response.text();
  });
}

exports.renderMarkdown = renderMarkdown;
},{"./oauth":"5+Ph","./encoding":"RAYx","./page-attributes":"1iUt"}],"YcVq":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var hostOrigin;

function setHostOrigin(origin) {
  hostOrigin = origin;
  addEventListener('resize', publishResize);
}

exports.setHostOrigin = setHostOrigin;
var lastHeight = -1;

function publishResize() {
  var height = document.body.scrollHeight;

  if (height === lastHeight) {
    return;
  }

  lastHeight = height;
  var message = {
    type: 'resize',
    height: height
  };
  parent.postMessage(message, hostOrigin);
}

exports.publishResize = publishResize;
},{}],"Y7ul":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var bus_1 = require("./bus");

var anonymousAvatar = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 14 16\" version=\"1.1\"><path fill=\"rgb(179,179,179)\" fill-rule=\"evenodd\" d=\"M8 10.5L9 14H5l1-3.5L5.25 9h3.5L8 10.5zM10 6H4L2 7h10l-2-1zM9 2L7 3 5 2 4 5h6L9 2zm4.03 7.75L10 9l1 2-2 3h3.22c.45 0 .86-.31.97-.75l.56-2.28c.14-.53-.19-1.08-.72-1.22zM4 9l-3.03.75c-.53.14-.86.69-.72 1.22l.56 2.28c.11.44.52.75.97.75H5l-2-3 1-2z\"></path></svg>";
var anonymousAvatarUrl = "data:image/svg+xml;base64," + btoa(anonymousAvatar);

var NewIssueComponent = function () {
  function NewIssueComponent(user, submit) {
    var _this = this;

    this.user = user;
    this.submit = submit;
    this.submitting = false;

    this.handleInput = function () {
      _this.submitButton.disabled = /^\s*$/.test(_this.textarea.value);

      if (_this.textarea.scrollHeight < 450 && _this.textarea.offsetHeight < _this.textarea.scrollHeight) {
        _this.textarea.style.height = _this.textarea.scrollHeight + "px";
        bus_1.publishResize();
      }
    };

    this.handleSubmit = function (event) {
      event.preventDefault();

      if (_this.submitting) {
        return;
      }

      _this.submitting = true;

      if (_this.user) {
        _this.textarea.disabled = true;
        _this.submitButton.disabled = true;
      }

      _this.submit(_this.input.value, _this.textarea.value).catch(function () {
        return 0;
      }).then(function () {
        _this.submitting = false;
        _this.textarea.disabled = !_this.user;
        _this.textarea.value = '';
        _this.submitButton.disabled = false;
      });
    };

    this.element = document.createElement('article');
    this.element.addEventListener('mousemove', bus_1.publishResize);
    this.element.innerHTML = "\n      <article id=\"newIssueTimelineComment\" class=\"timeline-comment\">\n        <a class=\"avatar\" target=\"_blank\">\n          <img height=\"44\" width=\"44\">\n        </a>\n        <form class=\"comment\" accept-charset=\"UTF-8\" action=\"javascript:\">\n          <header class=\"comment-header\">\n            <strong>Submit your feedback</strong>\n          </header>\n          <div class=\"comment-body\">\n            <input class=\"form-control input-block\" placeholder=\"Title\"/>\n            <textarea placeholder=\"Leave your comment\" aria-label=\"comment\"></textarea>\n          </div>\n          <footer class=\"comment-footer\">\n            <a class=\"text-link markdown-info\" tabindex=\"-1\" target=\"_blank\"\n              href=\"https://guides.github.com/features/mastering-markdown/\">\n              Styling with Markdown is supported\n            </a>\n            <button class=\"btn btn-primary\" type=\"submit\">Submit Comment</button>\n          </footer>\n        </form>\n      </article>\n      <article id=\"newIssueThanksForFeedback\" class=\"timeline-comment\" hidden>\n        <header class=\"comment-header feedback-thanks\"><strong>Thanks for submitting your feedback. Click this message to submit more.</strong></header>\n      </article>";
    this.avatarAnchor = this.element.querySelector('.avatar');
    this.avatar = this.avatarAnchor.firstElementChild;
    this.form = this.avatarAnchor.nextElementSibling;
    this.input = this.form.firstElementChild.nextElementSibling.firstElementChild;
    this.textarea = this.input.nextElementSibling;
    this.submitButton = this.form.lastElementChild.lastElementChild;
    this.newIssueTimelineComment = this.element.querySelector('#newIssueTimelineComment');
    this.newIssueThanksForFeedback = this.element.querySelector('#newIssueThanksForFeedback');
    this.newIssueThanksForFeedback.addEventListener('click', function () {
      _this.newIssueThanksForFeedback.setAttribute('hidden', '');

      _this.newIssueTimelineComment.removeAttribute('hidden');
    });
    this.setUser(user);
    this.textarea.addEventListener('input', this.handleInput);
    this.form.addEventListener('submit', this.handleSubmit);
  }

  NewIssueComponent.prototype.showThanksForFeedback = function () {
    this.newIssueThanksForFeedback.removeAttribute('hidden');
    this.newIssueTimelineComment.setAttribute('hidden', '');
  };

  NewIssueComponent.prototype.setUser = function (user) {
    this.user = user;
    this.submitButton.textContent = user ? 'Submit Comment' : 'Sign in to comment';
    this.submitButton.disabled = !!user;

    if (user) {
      this.avatarAnchor.href = user.html_url;
      this.avatar.alt = '@' + user.login;
      this.avatar.src = user.avatar_url + '?v=3&s=88';
    } else {
      this.avatarAnchor.removeAttribute('href');
      this.avatar.alt = '@anonymous';
      this.avatar.src = anonymousAvatarUrl;
    }
  };

  NewIssueComponent.prototype.clear = function () {
    this.textarea.value = '';
    this.input.value = '';
  };

  return NewIssueComponent;
}();

exports.NewIssueComponent = NewIssueComponent;
},{"./bus":"YcVq"}],"NLUH":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var thresholds = [1000, 'second', 1000 * 60, 'minute', 1000 * 60 * 60, 'hour', 1000 * 60 * 60 * 24, 'day', 1000 * 60 * 60 * 24 * 7, 'week', 1000 * 60 * 60 * 24 * 27, 'month'];
var formatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
};

function timeAgo(current, value) {
  var elapsed = current - value.getTime();

  if (elapsed < 5000) {
    return 'just now';
  }

  var i = 0;

  while (i + 2 < thresholds.length && elapsed * 1.1 > thresholds[i + 2]) {
    i += 2;
  }

  var divisor = thresholds[i];
  var text = thresholds[i + 1];
  var units = Math.round(elapsed / divisor);

  if (units > 3 && i === thresholds.length - 2) {
    return "on " + value.toLocaleDateString(undefined, formatOptions);
  }

  return units === 1 ? (text === 'hour' ? 'an' : 'a') + " " + text + " ago" : units + " " + text + "s ago";
}

exports.timeAgo = timeAgo;
},{}],"G14J":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var time_ago_1 = require("./time-ago");

var avatarArgs = '?v=3&s=88';
var displayAssociations = {
  COLLABORATOR: 'Collaborator',
  CONTRIBUTOR: 'Contributor',
  MEMBER: 'Member',
  OWNER: 'Owner'
};

var CommentComponent = function () {
  function CommentComponent(comment, currentUser) {
    this.comment = comment;
    this.currentUser = currentUser;
    var user = comment.user,
        html_url = comment.html_url,
        created_at = comment.created_at,
        body_html = comment.body_html,
        author_association = comment.author_association;
    this.element = document.createElement('article');
    this.element.classList.add('timeline-comment');

    if (user.login === currentUser) {
      this.element.classList.add('current-user');
    }

    var association = displayAssociations[author_association];
    this.element.innerHTML = "\n      <a class=\"avatar\" href=\"" + user.html_url + "\" target=\"_blank\" tabindex=\"-1\">\n        <img alt=\"@" + user.login + "\" height=\"44\" width=\"44\"\n              src=\"" + user.avatar_url + avatarArgs + "\">\n      </a>\n      <div class=\"comment\">\n        <header class=\"comment-header\">\n          <span class=\"comment-meta\">\n            <a class=\"text-link\" href=\"" + user.html_url + "\" target=\"_blank\"><strong>" + user.login + "</strong></a>\n            commented\n            <a class=\"text-link\" href=\"" + html_url + "\" target=\"_blank\">" + time_ago_1.timeAgo(Date.now(), new Date(created_at)) + "</a>\n          </span>\n          " + (association ? "<span class=\"author-association-badge\">" + association + "</span>" : '') + "\n        </header>\n        <div class=\"markdown-body markdown-body-scrollable\">\n          " + body_html + "\n        </div>\n      </div>";
    this.retargetLinks();
  }

  CommentComponent.prototype.setCurrentUser = function (currentUser) {
    if (this.currentUser === currentUser) {
      return;
    }

    this.currentUser = currentUser;

    if (this.comment.user.login === this.currentUser) {
      this.element.classList.add('current-user');
    } else {
      this.element.classList.remove('current-user');
    }
  };

  CommentComponent.prototype.retargetLinks = function () {
    var links = this.element.lastElementChild.lastElementChild.querySelectorAll('a');
    var j = links.length;

    while (j--) {
      var link = links.item(j);
      link.target = '_blank';
    }
  };

  return CommentComponent;
}();

exports.CommentComponent = CommentComponent;
},{"./time-ago":"NLUH"}],"6vj8":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var comment_component_1 = require("./comment-component");

var bus_1 = require("./bus");

var TimelineComponent = function () {
  function TimelineComponent(user) {
    this.user = user;
    this.timeline = [];
    this.element = document.createElement('section');
    this.element.classList.add('timeline');
    this.marker = document.createComment('marker');
    this.element.appendChild(this.marker);
  }

  TimelineComponent.prototype.setUser = function (user) {
    this.user = user;
    var login = user ? user.login : null;

    for (var i = 0; i < this.timeline.length; i++) {
      this.timeline[i].setCurrentUser(login);
    }

    bus_1.publishResize();
  };

  TimelineComponent.prototype.appendComment = function (comment) {
    var component = new comment_component_1.CommentComponent(comment, this.user ? this.user.login : null);
    this.timeline.push(component);
    this.element.insertBefore(component.element, this.marker);
    bus_1.publishResize();
  };

  return TimelineComponent;
}();

exports.TimelineComponent = TimelineComponent;
},{"./comment-component":"G14J","./bus":"YcVq"}],"TxUM":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var github_1 = require("./github");

var bus_1 = require("./bus");

var anonymousAvatar = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 14 16\" version=\"1.1\"><path fill=\"rgb(179,179,179)\" fill-rule=\"evenodd\" d=\"M8 10.5L9 14H5l1-3.5L5.25 9h3.5L8 10.5zM10 6H4L2 7h10l-2-1zM9 2L7 3 5 2 4 5h6L9 2zm4.03 7.75L10 9l1 2-2 3h3.22c.45 0 .86-.31.97-.75l.56-2.28c.14-.53-.19-1.08-.72-1.22zM4 9l-3.03.75c-.53.14-.86.69-.72 1.22l.56 2.28c.11.44.52.75.97.75H5l-2-3 1-2z\"></path></svg>";
var anonymousAvatarUrl = "data:image/svg+xml;base64," + btoa(anonymousAvatar);
var nothingToPreview = 'Nothing to preview';

var NewCommentComponent = function () {
  function NewCommentComponent(user, submit) {
    var _this = this;

    this.user = user;
    this.submit = submit;
    this.submitting = false;
    this.renderTimeout = 0;

    this.handleInput = function () {
      var text = _this.textarea.value;
      var isWhitespace = /^\s*$/.test(text);
      _this.submitButton.disabled = isWhitespace;

      if (_this.textarea.scrollHeight < 450 && _this.textarea.offsetHeight < _this.textarea.scrollHeight) {
        _this.textarea.style.height = _this.textarea.scrollHeight + "px";
        bus_1.publishResize();
      }

      clearTimeout(_this.renderTimeout);

      if (isWhitespace) {
        _this.preview.textContent = nothingToPreview;
      } else {
        _this.preview.textContent = 'Loading preview...';
        _this.renderTimeout = setTimeout(function () {
          return github_1.renderMarkdown(text).then(function (html) {
            return _this.preview.innerHTML = html;
          }).then(bus_1.publishResize);
        }, 500);
      }
    };

    this.handleSubmit = function (event) {
      event.preventDefault();

      if (_this.submitting) {
        return;
      }

      _this.submitting = true;

      if (_this.user) {
        _this.submitButton.disabled = true;
      }

      _this.submit(_this.textarea.value).catch(function () {
        return 0;
      }).then(function () {
        _this.submitting = false;
        _this.textarea.value = '';
        _this.submitButton.disabled = false;

        _this.handleClick({
          target: _this.form.querySelector('.tabnav-tab.tab-write')
        });

        _this.preview.textContent = nothingToPreview;
      });
    };

    this.handleClick = function (_a) {
      var target = _a.target;

      if (!(target instanceof HTMLButtonElement) || !target.classList.contains('tabnav-tab')) {
        return;
      }

      if (target.classList.contains('selected')) {
        return;
      }

      _this.form.querySelector('.tabnav-tab.selected').classList.remove('selected');

      target.classList.add('selected');
      var isPreview = target.classList.contains('tab-preview');
      _this.textarea.style.display = isPreview ? 'none' : '';
      _this.preview.style.display = isPreview ? '' : 'none';
      bus_1.publishResize();
    };

    this.element = document.createElement('article');
    this.element.classList.add('timeline-comment');
    this.element.addEventListener('mousemove', bus_1.publishResize);
    this.element.innerHTML = "\n      <a class=\"avatar\" target=\"_blank\" tabindex=\"-1\">\n        <img height=\"44\" width=\"44\">\n      </a>\n      <form class=\"comment\" accept-charset=\"UTF-8\" action=\"javascript:\">\n        <header class=\"new-comment-header\">\n          <nav class=\"tabnav-tabs\" role=\"tablist\">\n            <button type=\"button\" class=\"tabnav-tab tab-write selected\"\n                    role=\"tab\" aria-selected=\"true\">\n              Write\n            </button>\n            <button type=\"button\" class=\"tabnav-tab tab-preview\"\n                    role=\"tab\">\n              Preview\n            </button>\n          </nav>\n        </header>\n        <div class=\"comment-body\">\n          <textarea placeholder=\"Leave a comment\" aria-label=\"comment\"></textarea>\n          <div class=\"markdown-body\" style=\"display: none\">\n            " + nothingToPreview + "\n          </div>\n        </div>\n        <footer class=\"comment-footer\">\n          <a class=\"text-link markdown-info\" tabindex=\"-1\" target=\"_blank\"\n             href=\"https://guides.github.com/features/mastering-markdown/\">\n            Styling with Markdown is supported\n          </a>\n          <button class=\"btn btn-primary\" type=\"submit\">Submit Comment</button>\n        </footer>\n      </form>";
    this.avatarAnchor = this.element.firstElementChild;
    this.avatar = this.avatarAnchor.firstElementChild;
    this.form = this.avatarAnchor.nextElementSibling;
    this.textarea = this.form.firstElementChild.nextElementSibling.firstElementChild;
    this.preview = this.form.firstElementChild.nextElementSibling.lastElementChild;
    this.submitButton = this.form.lastElementChild.lastElementChild;
    this.setUser(user);
    this.textarea.addEventListener('input', this.handleInput);
    this.form.addEventListener('submit', this.handleSubmit);
    this.form.addEventListener('click', this.handleClick);
  }

  NewCommentComponent.prototype.setUser = function (user) {
    this.user = user;
    this.submitButton.textContent = user ? 'Submit Comment' : 'Sign in to comment';
    this.submitButton.disabled = !!user;

    if (user) {
      this.avatarAnchor.href = user.html_url;
      this.avatar.alt = '@' + user.login;
      this.avatar.src = user.avatar_url + '?v=3&s=88';
    } else {
      this.avatarAnchor.removeAttribute('href');
      this.avatar.alt = '@anonymous';
      this.avatar.src = anonymousAvatarUrl;
    }
  };

  NewCommentComponent.prototype.clear = function () {
    this.textarea.value = '';
  };

  return NewCommentComponent;
}();

exports.NewCommentComponent = NewCommentComponent;
},{"./github":"nnkK","./bus":"YcVq"}],"85Qa":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var page_attributes_1 = require("./page-attributes");

var bus_1 = require("./bus");

var github_1 = require("./github");

var oauth_1 = require("./oauth");

var timeline_component_1 = require("./timeline-component");

var new_comment_component_1 = require("./new-comment-component");

var IssueComponent = function () {
  function IssueComponent(issue, user) {
    var _this = this;

    var commentCount = this.commentCount = issue.comments;
    var ago = window["moment"](issue.created_at).fromNow();
    this.element = document.createElement('div');
    this.element.classList.add('Box-row');
    this.element.innerHTML = "\n      <div class=\"issue-box\">\n        <div class=\"arrow arrow-right\"></div>\n        <div class=\"arrow arrow-down\" hidden></div>\n        <div class=\"issue-title\"><span class=\"issue-title-text\">" + issue.title + "</span></div>\n        <a id=\"viewInGithub\" hidden class=\"view-in-github-box\" target=\"_blank\" href=\"" + issue.html_url + "\">View in Github</a>\n        <div class=\"comment-count-container\">\n          <span class=\"comment-icon\">\n            <svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"0 0 50 50\" version=\"1.1\" fill=\"#333333\" width=\"50px\" height=\"50px\">\n              <g id=\"surface1\" fill=\"#333333\"><path style=\" \" d=\"M 7 4 C 4.253906 4 2 6.253906 2 9 L 2 33 C 2 35.746094 4.253906 38 7 38 L 11.09375 38 C 11.230469 39.203125 11.214844 40.316406 10.90625 41.25 C 10.527344 42.398438 9.820313 43.363281 8.5 44.15625 C 8.128906 44.390625 7.957031 44.839844 8.070313 45.261719 C 8.183594 45.683594 8.5625 45.984375 9 46 C 13.242188 46 18.105469 43.785156 20.5625 38 L 43 38 C 45.746094 38 48 35.746094 48 33 L 48 9 C 48 6.253906 45.746094 4 43 4 Z M 7 6 L 43 6 C 44.65625 6 46 7.34375 46 9 L 46 33 C 46 34.65625 44.65625 36 43 36 L 20 36 C 19.582031 36 19.207031 36.261719 19.0625 36.65625 C 17.507813 40.898438 14.730469 42.917969 11.84375 43.65625 C 12.234375 43.097656 12.605469 42.507813 12.8125 41.875 C 13.332031 40.296875 13.289063 38.570313 12.96875 36.8125 C 12.878906 36.347656 12.476563 36.007813 12 36 L 7 36 C 5.34375 36 4 34.65625 4 33 L 4 9 C 4 7.34375 5.34375 6 7 6 Z \" fill=\"#333333\"/></g>\n            </svg>\n          </span>\n          <span class=\"count-text\">" + commentCount + "</span>\n        </div>\n      </div>\n    ";
    var rightArrow = this.rightArrow = this.element.querySelector(".arrow-right");
    var downArrow = this.downArrow = this.element.querySelector(".arrow-down");
    var commentCountContainer = this.element.querySelector('.comment-count-container');
    var commentCountElt = this.element.querySelector('.count-text');
    var issueTitleText = this.element.querySelector('.issue-title-text');
    var viewInGithub = this.element.querySelector('#viewInGithub');

    var toggleHidden = function toggleHidden() {
      var isOpen = rightArrow.hasAttribute('hidden');

      if (isOpen) {
        rightArrow.removeAttribute('hidden');
        downArrow.setAttribute('hidden', '');
        timeline.element.setAttribute('hidden', '');
        newCommentComponent.element.setAttribute('hidden', '');
        viewInGithub.setAttribute('hidden', '');
      } else {
        rightArrow.setAttribute('hidden', '');
        downArrow.removeAttribute('hidden');
        timeline.element.removeAttribute('hidden');
        newCommentComponent.element.removeAttribute('hidden');
        viewInGithub.removeAttribute('hidden');
      }

      bus_1.publishResize();
    };

    rightArrow.addEventListener('click', toggleHidden);
    downArrow.addEventListener('click', toggleHidden);
    commentCountContainer.addEventListener('click', toggleHidden);
    issueTitleText.addEventListener('click', toggleHidden);

    if (issue && issue.comments > 0) {
      github_1.loadCommentsPage(issue.number, 1).then(function (commentsPage) {
        commentsPage.items.forEach(function (item) {
          timeline.appendComment(item);
        });
      });
    }

    var timeline = this.timelineComponent = new timeline_component_1.TimelineComponent(user);
    timeline.element.setAttribute('hidden', '');
    this.element.appendChild(this.timelineComponent.element);

    var submit = function submit(markdown) {
      if (user) {
        var commentPromise = void 0;

        if (issue) {
          commentPromise = github_1.postComment(issue.number, markdown);
        } else {
          commentPromise = github_1.createIssue(page_attributes_1.pageAttributes.issueTerm, page_attributes_1.pageAttributes.url, page_attributes_1.pageAttributes.title, page_attributes_1.pageAttributes.description, user).then(function (newIssue) {
            issue = newIssue;
            return github_1.postComment(issue.number, markdown);
          });
        }

        return commentPromise.then(function (comment) {
          timeline.appendComment(comment);
          ++commentCount;
          commentCountElt.textContent = commentCount + '';
          newCommentComponent.clear();
        });
      }

      return oauth_1.login().then(function () {
        return github_1.loadUser();
      }).then(function (u) {
        user = u;
        timeline.setUser(user);
        newCommentComponent.setUser(user);

        _this.element.dispatchEvent(new CustomEvent('user-changed', {
          detail: user,
          bubbles: true
        }));
      });
    };

    var newCommentComponent = this.newCommentComponent = new new_comment_component_1.NewCommentComponent(user, submit);
    newCommentComponent.element.setAttribute('hidden', '');
    this.element.appendChild(newCommentComponent.element);
    var issueSub = document.createElement('div');
    issueSub.classList.add('issue-sub');
    issueSub.innerHTML = "\n      <div class=\"spinner spinner-size-21\">\n        <div class=\"bounce1\"></div>\n        <div class=\"bounce2\"></div>\n        <div class=\"bounce3\"></div>\n      </div>";
    this.element.appendChild(issueSub);
    github_1.loadIssueCreator(issue.number).then(function (user) {
      if (user) {
        issueSub.innerHTML = "<a target=\"_blank\" href=\"" + issue.html_url + "\">#" + issue.number + "</a> opened " + ago + " by <a target=\"_blank\" href=\"" + user.html_url + "\">" + user.login + "</a>";
      } else {
        issueSub.innerHTML = "<a target=\"_blank\" href=\"" + issue.html_url + "\">#" + issue.number + "</a> opened " + ago + " by <a target=\"_blank\" href=\"" + issue.user.html_url + "\">" + issue.user.login + "</a>";
      }
    });
  }

  IssueComponent.prototype.setUser = function (user) {
    this.newCommentComponent.setUser(user);
    this.timelineComponent.setUser(user);
  };

  return IssueComponent;
}();

exports.IssueComponent = IssueComponent;
},{"./page-attributes":"1iUt","./bus":"YcVq","./github":"nnkK","./oauth":"5+Ph","./timeline-component":"6vj8","./new-comment-component":"TxUM"}],"CoE3":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var page_attributes_1 = require("./page-attributes");

var oauth_1 = require("./oauth");

var bus_1 = require("./bus");

var github_1 = require("./github");

var new_issue_component_1 = require("./new-issue-component");

var issue_component_1 = require("./issue-component");

var comment_component_1 = require("./comment-component");

var FeedbackComponent = function () {
  function FeedbackComponent(_user, openIssues, closedIssues) {
    var _this = this;

    this._user = _user;
    this.openIssues = openIssues;
    this.closedIssues = closedIssues;
    this.issueComponents = [];
    var openIssuesTabName = 'open';
    var closedIssuesTabName = 'closed';

    if (openIssues == null) {
      this.openIssues = [];
    }

    if (closedIssues == null) {
      this.closedIssues = [];
    }

    this.element = document.createElement('div');
    this.element.classList.add('feedback-container');
    this.element.innerHTML = "\n      <div id=\"newIssueFormContainer\"></div>\n      <div id=\"tabsContainer\" class=\"tabnav\">\n        <nav class=\"tabnav-tabs\">\n          <a id=\"openedTab\" link=\"#\" class=\"tabnav-tab selected\" tabname=\"" + openIssuesTabName + "\"><span id=\"openTabIssueCount\" class=\"text-bold\"></span> Open</a>\n          <a id=\"closedTab\" link=\"#\" class=\"tabnav-tab\" tabname=\"" + closedIssuesTabName + "\"><span id=\"closedTabIssueCount\" class=\"text-bold\"></span> Closed</a>\n        </nav>\n      </div>\n      <div id=\"issuesBox\" class=\"Box issues-box\">\n        <div class=\"spinner\">\n          <div class=\"bounce1\"></div>\n          <div class=\"bounce2\"></div>\n          <div class=\"bounce3\"></div>\n        </div>\n      </div>\n    ";
    this.updateTabVisibility();
    var self = this;
    var lastBoxTop = 0;

    var newIssueSubmit = function newIssueSubmit(title, description) {
      if (_this._user) {
        var commentPromise = void 0;
        commentPromise = github_1.createIssue(title, page_attributes_1.pageAttributes.url, title, page_attributes_1.pageAttributes.description, _this._user).then(function (newIssue) {
          closedTab.classList.remove('selected');
          openedTab.classList.add('selected');
          self.openIssues.push(newIssue);
          self.updateTabVisibility();
          self.setIssues(self.openIssues);
          var issueCountElt = self.element.querySelector("#openTabIssueCount");
          var count = self.openIssues ? self.openIssues.length : 0;
          issueCountElt.textContent = "" + count;
          var issueBoxes = self.issuesBox.children;
          var lastBox = issueBoxes[issueBoxes.length - 1];
          var arrow = lastBox.querySelector('.arrow-right');
          var clickEvent = document.createEvent('MouseEvent');
          clickEvent.initEvent('click', false, true);
          arrow.dispatchEvent(clickEvent);
          lastBoxTop = lastBox.getBoundingClientRect().top;
          return github_1.postComment(newIssue.number, description);
        });
        return commentPromise.then(function (comment) {
          var commentComponent = new comment_component_1.CommentComponent(comment, _this._user.login);
          var issueBoxes = self.issuesBox.children;
          var lastBox = issueBoxes[issueBoxes.length - 1];
          var marker = lastBox.firstElementChild.nextElementSibling.lastChild;
          marker.parentElement.insertBefore(commentComponent.element, marker);

          _this.newIssueComponent.clear();

          _this.newIssueComponent.showThanksForFeedback();

          bus_1.publishResize();
          window.top.scrollTo({
            top: lastBoxTop,
            behavior: "smooth"
          });
        });
      }

      return oauth_1.login().then(function () {
        return github_1.loadUser();
      }).then(function (u) {
        _this._user = u;

        _this.newIssueComponent.setUser(_this._user);

        _this.issueComponents.forEach(function (component) {
          component.setUser(u);
        });
      });
    };

    var newIssueFormContainer = this.element.querySelector('#newIssueFormContainer');
    this.newIssueComponent = new new_issue_component_1.NewIssueComponent(this._user, newIssueSubmit);
    newIssueFormContainer.appendChild(this.newIssueComponent.element);
    this.issuesBox = this.element.querySelector('#issuesBox');
    var openedTab = this.openedTab = this.element.querySelector('#openedTab');
    var closedTab = this.closedTab = this.element.querySelector('#closedTab');
    this.openedTab.addEventListener('click', this.handleTabClick.bind(this));
    this.closedTab.addEventListener('click', this.handleTabClick.bind(this));
    var openCount = openIssues ? openIssues.length : 0;
    var closedCount = closedIssues ? closedIssues.length : 0;
    var issueCountElt = openedTab.querySelector('#openTabIssueCount');
    issueCountElt.textContent = "" + openCount;
    var closedIssueCountElt = closedTab.querySelector('#closedTabIssueCount');
    closedIssueCountElt.textContent = "" + closedCount;
    this.issuesBox.addEventListener('user-changed', function (event) {
      var user = event.detail;

      _this.newIssueComponent.setUser(user);

      _this.issueComponents.forEach(function (component) {
        component.setUser(user);
      });
    });
    this.setIssues(openIssues);
  }

  FeedbackComponent.prototype.updateTabVisibility = function () {
    var openCount = this.openIssues ? this.openIssues.length : 0;
    var closedCount = this.closedIssues ? this.closedIssues.length : 0;
    var hideAll = !openCount && !closedCount;
    var hideTabs = openCount > 0 && !closedCount;
    var tabsContainer = this.element.querySelector('#tabsContainer');
    var issuesBox = this.element.querySelector('#issuesBox');

    if (hideAll || hideTabs) {
      tabsContainer.setAttribute('hidden', '');
    } else {
      tabsContainer.removeAttribute('hidden');
    }

    if (hideAll) {
      issuesBox.setAttribute('hidden', '');
    } else {
      issuesBox.removeAttribute('hidden');
    }
  };

  FeedbackComponent.prototype.handleTabClick = function (event) {
    var _this = this;

    var target = event.target;
    var prevSelected = target.parentElement.querySelector('.selected');
    prevSelected.classList.remove('selected');
    target.classList.add('selected');
    this.issuesBox.innerHTML = "<div class=\"spinner\">\n    <div class=\"bounce1\"></div>\n    <div class=\"bounce2\"></div>\n    <div class=\"bounce3\"></div>\n  </div>";
    bus_1.publishResize();
    var tabName = target.getAttribute('tabname');
    github_1.loadIssuesByType(page_attributes_1.pageAttributes.issueTerm, tabName).then(function (issues) {
      var issueCountElt = target.querySelector("#" + tabName + "TabIssueCount");
      var count = issues ? issues.length : 0;
      issueCountElt.textContent = "" + count;

      if (tabName === "open") {
        _this.openIssues = issues;
      } else {
        _this.closedIssues = issues;
      }

      _this.updateTabVisibility();

      _this.setIssues(issues);
    });
  };

  FeedbackComponent.prototype.setIssues = function (issues) {
    var _this = this;

    var issuesBox = this.issuesBox;
    issuesBox.innerHTML = '';
    this.issueComponents = [];

    if (!issues) {
      var noIssuesElt = document.createElement('div');
      noIssuesElt.classList.add('no-issues');
      noIssuesElt.textContent = "No issues";
      issuesBox.appendChild(noIssuesElt);
      bus_1.publishResize();
      return;
    }

    issues.forEach(function (issue) {
      var component = new issue_component_1.IssueComponent(issue, _this._user);
      issuesBox.appendChild(component.element);

      _this.issueComponents.push(component);
    });
    bus_1.publishResize();
  };

  return FeedbackComponent;
}();

exports.FeedbackComponent = FeedbackComponent;
},{"./page-attributes":"1iUt","./oauth":"5+Ph","./bus":"YcVq","./github":"nnkK","./new-issue-component":"Y7ul","./issue-component":"85Qa","./comment-component":"G14J"}],"fHsu":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var page_attributes_1 = require("./page-attributes");

var github_1 = require("./github");

var feedback_component_1 = require("./feedback-component");

var bus_1 = require("./bus");

github_1.setRepoContext(page_attributes_1.pageAttributes);
Promise.all([github_1.loadUser(), github_1.loadIssuesByType(page_attributes_1.pageAttributes.issueTerm, "open"), github_1.loadIssuesByType(page_attributes_1.pageAttributes.issueTerm, "closed")]).then(function (_a) {
  var user = _a[0],
      openIssues = _a[1],
      closedIssues = _a[2];
  return bootstrap(user, openIssues, closedIssues);
});

function bootstrap(user, openIssues, closedIssues) {
  bus_1.setHostOrigin(page_attributes_1.pageAttributes.origin);
  var feedback = new feedback_component_1.FeedbackComponent(user, openIssues, closedIssues);
  document.body.appendChild(feedback.element);
  bus_1.publishResize();
}

addEventListener('not-installed', function handleNotInstalled() {
  removeEventListener('not-installed', handleNotInstalled);
  document.querySelector('.timeline').insertAdjacentHTML('afterbegin', "\n  <div class=\"flash flash-error flash-not-installed\">\n    Error: utterances is not installed on <code>" + page_attributes_1.pageAttributes.owner + "/" + page_attributes_1.pageAttributes.repo + "</code>.\n    If you own this repo,\n    <a href=\"https://github.com/apps/utterances\" target=\"_blank\"><strong>install the app</strong></a>.\n    Read more about this change in\n    <a href=\"https://github.com/utterance/utterances/pull/25\" target=\"_blank\">the PR</a>.\n  </div>");
});
},{"./page-attributes":"1iUt","./github":"nnkK","./feedback-component":"CoE3","./bus":"YcVq"}]},{},["fHsu"], null)
//# sourceMappingURL=utterances.58d97600.map