(function () {
'use strict';

function deparam(query) {
    var match;
    var plus = /\+/g;
    var search = /([^&=]+)=?([^&]*)/g;
    var decode = function (s) { return decodeURIComponent(s.replace(plus, ' ')); };
    var params = {};
    while (match = search.exec(query)) {
        params[decode(match[1])] = decode(match[2]);
    }
    return params;
}
function param(obj) {
    var parts = [];
    for (var name_1 in obj) {
        if (obj.hasOwnProperty(name_1)) {
            parts.push(encodeURIComponent(name_1) + "=" + encodeURIComponent(obj[name_1]));
        }
    }
    return parts.join('&');
}

var repoRegex = /^([a-z][\w-]+)\/([\w-.]+)$/i;

function readPageAttributes() {
    var params = deparam(location.search.substr(1));
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
    }
    else if ('issue-number' in params) {
        issueNumber = +params['issue-number'];
        if (issueNumber.toString(10) !== params['issue-number']) {
            throw new Error("issue-number is invalid. \"" + params['issue-number']);
        }
    }
    else {
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
    var matches = repoRegex.exec(params.repo);
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
        apiEndpoint: params['api-endpoint']
    };
}
var pageAttributes = readPageAttributes();

var authorizeUrl = pageAttributes.apiEndpoint + "/authorize";
var tokenUrl = pageAttributes.apiEndpoint + "/token";
var redirect_uri = location.origin + "/authorized.html";
var scope = 'public_repo';
var Token = (function () {
    function Token() {
        this.storageKey = 'OAUTH_TOKEN';
        this.token = null;
        try {
            this.token = localStorage.getItem(this.storageKey);
        }
        catch (e) { }
    }
    Object.defineProperty(Token.prototype, "value", {
        get: function () {
            return this.token;
        },
        set: function (newValue) {
            this.token = newValue;
            try {
                if (newValue === null) {
                    localStorage.removeItem(this.storageKey);
                }
                else {
                    localStorage.setItem(this.storageKey, newValue);
                }
            }
            catch (e) { }
        },
        enumerable: true,
        configurable: true
    });
    return Token;
}());
var token = new Token();
function login() {
    window.open(authorizeUrl + "?" + param({ scope: scope, redirect_uri: redirect_uri }));
    return new Promise(function (resolve) { return window.notifyAuthorized = resolve; })
        .then(function () { return fetch(tokenUrl, { mode: 'cors', credentials: 'include' }); })
        .then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return response.text().then(function (text) { return Promise.reject("Error retrieving token:\n" + text); });
    })
        .then(function (t) { token.value = t; }, function (reason) { token.value = null; throw reason; });
}

function decodeBase64UTF8(encoded) {
    encoded = encoded.replace(/\s/g, '');
    return decodeURIComponent(escape(atob(encoded)));
}

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
function githubRequest(relativeUrl, init) {
    init = init || {};
    init.mode = 'cors';
    init.cache = 'no-cache';
    var request = new Request(GITHUB_API + relativeUrl, init);
    request.headers.set('Accept', GITHUB_ENCODING__REACTIONS_PREVIEW);
    if (token.value !== null) {
        request.headers.set('Authorization', "token " + token.value);
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
            token.value = null;
        }
        processRateLimit(response);
        return response;
    });
}
function loadJsonFile(path, html) {
    if (html === void 0) { html = false; }
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
        var decoded = decodeBase64UTF8(content);
        return JSON.parse(decoded);
    });
}
function loadIssuesByType(type) {
    var q = " type:issue in:title is:" + type + " repo:" + owner + "/" + repo;
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


function commentsRequest(issueNumber, page) {
    var url = "repos/" + owner + "/" + repo + "/issues/" + issueNumber + "/comments?page=" + page + "&per_page=" + PAGE_SIZE;
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
        return response.json()
            .then(function (items) { return ({ items: items, nextPage: nextPage }); });
    });
}
function loadUser() {
    if (token.value === null) {
        return Promise.resolve(null);
    }
    return githubFetch(githubRequest('user'))
        .then(function (response) {
        if (response.ok) {
            return response.json();
        }
        return null;
    });
}
function createIssue(issueTerm, documentUrl, title, description) {
    var request = new Request(pageAttributes.apiEndpoint + "/repos/" + owner + "/" + repo + "/issues", {
        method: 'POST',
        body: JSON.stringify({
            title: issueTerm,
            body: "# " + title + "\n\n" + description + "\n\n[" + documentUrl + "](" + documentUrl + ")"
        })
    });
    request.headers.set('Accept', GITHUB_ENCODING__REACTIONS_PREVIEW);
    request.headers.set('Authorization', "token " + token.value);
    return fetch(request).then(function (response) {
        if (!response.ok) {
            throw new Error('Error creating comments container issue');
        }
        return response.json();
    });
}
function postComment(issueNumber, markdown) {
    var url = "repos/" + owner + "/" + repo + "/issues/" + issueNumber + "/comments";
    var body = JSON.stringify({ body: markdown });
    var request = githubRequest(url, { method: 'POST', body: body });
    var accept = GITHUB_ENCODING__HTML_JSON + "," + GITHUB_ENCODING__REACTIONS_PREVIEW;
    request.headers.set('Accept', accept);
    return githubFetch(request).then(function (response) {
        if (!response.ok) {
            throw new Error('Error posting comment.');
        }
        return response.json();
    });
}

var thresholds = [
    1000, 'second',
    1000 * 60, 'minute',
    1000 * 60 * 60, 'hour',
    1000 * 60 * 60 * 24, 'day',
    1000 * 60 * 60 * 24 * 7, 'week',
    1000 * 60 * 60 * 24 * 27, 'month'
];
var formatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
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

var avatarArgs = '?v=3&s=88';
var displayAssociations = {
    COLLABORATOR: 'Collaborator',
    CONTRIBUTOR: 'Contributor',
    MEMBER: 'Member',
    OWNER: 'Owner'
};
var CommentComponent = (function () {
    function CommentComponent(comment, currentUser) {
        this.comment = comment;
        this.currentUser = currentUser;
        var user = comment.user, html_url = comment.html_url, created_at = comment.created_at, body_html = comment.body_html, author_association = comment.author_association;
        this.element = document.createElement('article');
        this.element.classList.add('timeline-comment');
        if (user.login === currentUser) {
            this.element.classList.add('current-user');
        }
        var association = displayAssociations[author_association];
        this.element.innerHTML = "\n      <a class=\"avatar\" href=\"" + user.html_url + "\" target=\"_blank\">\n        <img alt=\"@" + user.login + "\" height=\"44\" width=\"44\"\n              src=\"" + user.avatar_url + avatarArgs + "\">\n      </a>\n      <div class=\"comment\">\n        <header class=\"comment-header\">\n          <a class=\"text-link\" href=\"" + user.html_url + "\" target=\"_blank\"><strong>" + user.login + "</strong></a>\n          commented\n          <a class=\"text-link\" href=\"" + html_url + "\" target=\"_blank\">" + timeAgo(Date.now(), new Date(created_at)) + "</a>\n          " + (association ? "<span class=\"author-association-badge\">" + association + "</span>" : '') + "\n        </header>\n        <div class=\"markdown-body\">\n          " + body_html + "\n        </div>\n      </div>";
        this.retargetLinks();
    }
    CommentComponent.prototype.setComment = function (comment) {
        var commentDiv = this.element.lastElementChild;
        var user = comment.user, html_url = comment.html_url, created_at = comment.created_at, body_html = comment.body_html;
        if (this.comment.user.login !== user.login) {
            if (user.login === this.currentUser) {
                this.element.classList.add('current-user');
            }
            else {
                this.element.classList.remove('current-user');
            }
            var avatarAnchor = this.element.firstElementChild;
            var avatarImg = avatarAnchor.firstElementChild;
            avatarAnchor.href = user.html_url;
            avatarImg.alt = '@' + user.login;
            avatarImg.src = user.avatar_url + avatarArgs;
            var authorAnchor = commentDiv
                .firstElementChild.firstElementChild;
            authorAnchor.href = user.html_url;
            authorAnchor.textContent = user.login;
        }
        if (this.comment.created_at !== created_at || this.comment.html_url !== html_url) {
            var timestamp = commentDiv.firstElementChild.firstElementChild.lastElementChild;
            timestamp.href = html_url;
            timestamp.textContent = timeAgo(Date.now(), new Date(created_at));
        }
        if (this.comment.body_html !== body_html) {
            var body = commentDiv.lastElementChild;
            body.innerHTML = body_html;
            this.retargetLinks();
        }
        this.comment = comment;
    };
    CommentComponent.prototype.setCurrentUser = function (currentUser) {
        if (this.currentUser === currentUser) {
            return;
        }
        this.currentUser = currentUser;
        if (this.comment.user.login === this.currentUser) {
            this.element.classList.add('current-user');
        }
        else {
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
}());

var hostOrigin;
function setHostOrigin(origin) {
    hostOrigin = origin;
    addEventListener('resize', publishResize);
}
var lastHeight = -1;
function publishResize() {
    var height = document.body.scrollHeight;
    if (height === lastHeight) {
        return;
    }
    lastHeight = height;
    var message = { type: 'resize', height: height };
    parent.postMessage(message, hostOrigin);
}

var TimelineComponent = (function () {
    function TimelineComponent(user, issue) {
        this.user = user;
        this.issue = issue;
        this.timeline = [];
        this.count = 0;
        this.element = document.createElement('section');
        this.element.classList.add('timeline');
        this.element.innerHTML = "\n      <h1 class=\"timeline-header\">\n        <a class=\"text-link\" target=\"_blank\"></a>\n        <em>\n          - powered by\n          <a class=\"text-link\" href=\"https://utteranc.es\" target=\"_blank\">utteranc.es</a>\n        </em>\n      </h1>";
        this.countAnchor = this.element.firstElementChild.firstElementChild;
        this.marker = document.createComment('marker');
        this.element.appendChild(this.marker);
        this.setIssue(this.issue);
        this.renderCount();
    }
    TimelineComponent.prototype.setUser = function (user) {
        this.user = user;
        var login = user ? user.login : null;
        for (var i = 0; i < this.timeline.length; i++) {
            this.timeline[i].setCurrentUser(login);
        }
        publishResize();
    };
    TimelineComponent.prototype.setIssue = function (issue) {
        this.issue = issue;
        if (issue) {
            this.countAnchor.href = issue.html_url;
        }
        else {
            this.countAnchor.removeAttribute('href');
        }
    };
    TimelineComponent.prototype.appendComment = function (comment) {
        var component = new CommentComponent(comment, this.user ? this.user.login : null);
        this.timeline.push(component);
        this.element.insertBefore(component.element, this.marker);
        this.count++;
        this.renderCount();
        publishResize();
    };
    TimelineComponent.prototype.replaceComments = function (comments) {
        var i;
        for (i = 0; i < comments.length; i++) {
            var comment = comments[i];
            if (i <= this.timeline.length) {
                this.appendComment(comment);
                continue;
            }
            this.timeline[i].setComment(comment);
        }
        for (; i < this.timeline.length; i++) {
            this.element.removeChild(this.element.lastElementChild);
        }
        this.count = comments.length;
        this.renderCount();
        publishResize();
    };
    TimelineComponent.prototype.renderCount = function () {
        this.countAnchor.textContent = this.count + " Comment" + (this.count === 1 ? '' : 's');
    };
    return TimelineComponent;
}());

var anonymousAvatar$1 = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 14 16\" version=\"1.1\"><path fill=\"rgb(179,179,179)\" fill-rule=\"evenodd\" d=\"M8 10.5L9 14H5l1-3.5L5.25 9h3.5L8 10.5zM10 6H4L2 7h10l-2-1zM9 2L7 3 5 2 4 5h6L9 2zm4.03 7.75L10 9l1 2-2 3h3.22c.45 0 .86-.31.97-.75l.56-2.28c.14-.53-.19-1.08-.72-1.22zM4 9l-3.03.75c-.53.14-.86.69-.72 1.22l.56 2.28c.11.44.52.75.97.75H5l-2-3 1-2z\"></path></svg>";
var anonymousAvatarUrl$1 = "data:image/svg+xml;base64," + btoa(anonymousAvatar$1);
var NewCommentComponent = (function () {
    function NewCommentComponent(user, submit) {
        var _this = this;
        this.user = user;
        this.submit = submit;
        this.submitting = false;
        this.handleInput = function () {
            _this.submitButton.disabled = /^\s*$/.test(_this.textarea.value);
            if (_this.textarea.scrollHeight < 450 && _this.textarea.offsetHeight < _this.textarea.scrollHeight) {
                _this.textarea.style.height = _this.textarea.scrollHeight + "px";
                publishResize();
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
            _this.submit(_this.textarea.value).catch(function () { return 0; }).then(function () {
                _this.submitting = false;
                _this.textarea.disabled = !_this.user;
                _this.textarea.value = '';
                _this.submitButton.disabled = false;
            });
        };
        this.element = document.createElement('article');
        this.element.classList.add('timeline-comment');
        this.element.addEventListener('mousemove', publishResize);
        this.element.innerHTML = "\n      <a class=\"avatar\" target=\"_blank\">\n        <img height=\"44\" width=\"44\">\n      </a>\n      <form class=\"comment\" accept-charset=\"UTF-8\" action=\"javascript:\">\n        <header class=\"comment-header\">\n          <strong>Join the discussion</strong>\n        </header>\n        <div class=\"comment-body\">\n          <textarea placeholder=\"Leave a comment\" aria-label=\"comment\"></textarea>\n        </div>\n        <footer class=\"comment-footer\">\n          <a class=\"text-link markdown-info\" tabindex=\"-1\" target=\"_blank\"\n             href=\"https://guides.github.com/features/mastering-markdown/\">\n            Styling with Markdown is supported\n          </a>\n          <button class=\"btn btn-primary\" type=\"submit\">Comment</button>\n        </footer>\n      </form>";
        this.avatarAnchor = this.element.firstElementChild;
        this.avatar = this.avatarAnchor.firstElementChild;
        this.form = this.avatarAnchor.nextElementSibling;
        this.textarea = this.form.firstElementChild.nextElementSibling.firstElementChild;
        this.submitButton = this.form.lastElementChild.lastElementChild;
        this.setUser(user);
        this.textarea.addEventListener('input', this.handleInput);
        this.form.addEventListener('submit', this.handleSubmit);
    }
    NewCommentComponent.prototype.setUser = function (user) {
        this.user = user;
        this.submitButton.textContent = user ? 'Comment' : 'Sign in to comment';
        this.submitButton.disabled = !!user;
        if (user) {
            this.avatarAnchor.href = user.html_url;
            this.avatar.alt = '@' + user.login;
            this.avatar.src = user.avatar_url + '?v=3&s=88';
        }
        else {
            this.avatarAnchor.removeAttribute('href');
            this.avatar.alt = '@anonymous';
            this.avatar.src = anonymousAvatarUrl$1;
            this.textarea.disabled = true;
        }
    };
    NewCommentComponent.prototype.clear = function () {
        this.textarea.value = '';
    };
    return NewCommentComponent;
}());

var FeedbackComponent = (function () {
    function FeedbackComponent(tabChanged, user) {
        this.tabChangedCallback = tabChanged;
        var openIssuesTabName = 'open';
        var closedIssuesTabName = 'closed';
        this.element = document.createElement('div');
        this.element.classList.add('feedback-container');
        this.element.innerHTML = "\n      <div class=\"new-issue-btn-container\">\n        <button type=\"button\" class=\"btn btn-primary\" id=\"newIssueBtn\">Submit new issue</button>\n      </div>\n      <div id=\"newIssueFormContainer\" hidden></div>\n      <div class=\"tabnav\">\n        <nav class=\"tabnav-tabs\">\n          <a id=\"openedTab\" link=\"#\" class=\"tabnav-tab selected\" tabname=\"" + openIssuesTabName + "\">Open</a>\n          <a id=\"closedTab\" link=\"#\" class=\"tabnav-tab\" tabname=\"" + closedIssuesTabName + "\">Closed</a>\n        </nav>\n      </div>\n      <div id=\"issuesBox\" class=\"Box issues-box\"></div>\n    ";
        var newIssueBtn = this.element.querySelector('#newIssueBtn');
        var newIssueFormContainer = this.element.querySelector('#newIssueFormContainer');
        var setIssuesFn = this.setIssues.bind(this);
        var newIssueSubmit = function (title, description) {
            if (user) {
                var commentPromise = void 0;
                commentPromise = createIssue(title, pageAttributes.url, title, pageAttributes.description).then(function (newIssue) {
                    return postComment(newIssue.number, description);
                });
                return commentPromise.then(function () {
                    newIssueComponent.clear();
                    newIssueFormContainer.setAttribute('hidden', '');
                    closedTab.classList.remove('selected');
                    openedTab.classList.add('selected');
                    loadIssuesByType("open").then(function (issues) {
                        setIssuesFn(issues);
                    });
                });
            }
            return login().then(function () { return loadUser(); }).then(function (u) {
                user = u;
                newIssueComponent.setUser(user);
            });
        };
        var newIssueComponent = new NewIssueComponent(user, newIssueSubmit);
        newIssueFormContainer.appendChild(newIssueComponent.element);
        newIssueBtn.addEventListener('click', function () {
            var hasAttr = newIssueFormContainer.hasAttribute('hidden');
            hasAttr ?
                newIssueFormContainer.removeAttribute('hidden') :
                newIssueFormContainer.setAttribute('hidden', '');
            publishResize();
        });
        this.issuesBox = this.element.querySelector('#issuesBox');
        var openedTab = this.openedTab = this.element.querySelector('#openedTab');
        var closedTab = this.closedTab = this.element.querySelector('#closedTab');
        this.openedTab.addEventListener('click', this.handleTabClick.bind(this));
        this.closedTab.addEventListener('click', this.handleTabClick.bind(this));
    }
    FeedbackComponent.prototype.handleTabClick = function (event) {
        var target = event.target;
        var prevSelected = target.parentElement.querySelector('.selected');
        prevSelected.classList.remove('selected');
        target.classList.add('selected');
        this.tabChangedCallback(target.getAttribute('tabname'));
    };
    FeedbackComponent.prototype.setIssues = function (issues) {
        var issuesBox = this.issuesBox;
        issuesBox.innerHTML = '';
        if (!issues) {
            issuesBox.innerHTML = "No issues";
            return;
        }
        var user = this.user;
        issues.forEach(function (issue) {
            var component = new IssueComponent(issue, user);
            issuesBox.appendChild(component.element);
        });
        publishResize();
    };
    return FeedbackComponent;
}());
var IssueComponent = (function () {
    function IssueComponent(issue, user) {
        var commentCount = this.commentCount = issue.comments;
        this.element = document.createElement('div');
        this.element.innerHTML = "\n      <div class=\"Box-row issue-box\">\n        <div class=\"arrow arrow-right\">&#707;</div>\n        <div class=\"arrow arrow-down\" hidden>&#709;</div>\n        <div class=\"issue-title\"><span class=\"issue-title-text\">" + issue.title + "</span></div>\n        <div class=\"issue-comment-count\">" + commentCount + " comments</div>\n      </div>\n    ";
        var rightArrow = this.rightArrow = this.element.firstElementChild.firstElementChild;
        var downArrow = this.downArrow = this.rightArrow.nextElementSibling;
        var commentCountElt = this.element.querySelector('.issue-comment-count');
        var issueTitleText = this.element.querySelector('.issue-title-text');
        rightArrow.addEventListener('click', function (event) {
            var target = event.target;
            target.setAttribute('hidden', '');
            downArrow.removeAttribute('hidden');
            timeline.element.removeAttribute('hidden');
            newCommentComponent.element.removeAttribute('hidden');
            publishResize();
        });
        downArrow.addEventListener('click', function (event) {
            var target = event.target;
            target.setAttribute('hidden', '');
            rightArrow.removeAttribute('hidden');
            timeline.element.setAttribute('hidden', '');
            newCommentComponent.element.setAttribute('hidden', '');
            publishResize();
        });
        var toggleHidden = function () {
            var isOpen = rightArrow.hasAttribute('hidden');
            if (isOpen) {
                rightArrow.removeAttribute('hidden');
                downArrow.setAttribute('hidden', '');
                timeline.element.setAttribute('hidden', '');
                newCommentComponent.element.setAttribute('hidden', '');
            }
            else {
                rightArrow.setAttribute('hidden', '');
                downArrow.removeAttribute('hidden');
                timeline.element.removeAttribute('hidden');
                newCommentComponent.element.removeAttribute('hidden');
            }
            publishResize();
        };
        commentCountElt.addEventListener('click', toggleHidden);
        issueTitleText.addEventListener('click', toggleHidden);
        if (issue && issue.comments > 0) {
            loadCommentsPage(issue.number, 1).then(function (_a) {
                var items = _a.items;
                return timeline.replaceComments(items);
            });
        }
        var timeline = this.timelineComponent = new TimelineComponent(user, issue);
        timeline.element.setAttribute('hidden', '');
        this.element.appendChild(this.timelineComponent.element);
        var submit = function (markdown) {
            if (user) {
                var commentPromise = void 0;
                if (issue) {
                    commentPromise = postComment(issue.number, markdown);
                }
                else {
                    commentPromise = createIssue(pageAttributes.issueTerm, pageAttributes.url, pageAttributes.title, pageAttributes.description).then(function (newIssue) {
                        issue = newIssue;
                        timeline.setIssue(issue);
                        return postComment(issue.number, markdown);
                    });
                }
                return commentPromise.then(function (comment) {
                    timeline.appendComment(comment);
                    ++commentCount;
                    commentCountElt.textContent = commentCount + " comments";
                    newCommentComponent.clear();
                });
            }
            return login().then(function () { return loadUser(); }).then(function (u) {
                user = u;
                timeline.setUser(user);
                newCommentComponent.setUser(user);
            });
        };
        var newCommentComponent = this.newCommentComponent = new NewCommentComponent(user, submit);
        newCommentComponent.element.setAttribute('hidden', '');
        this.element.appendChild(newCommentComponent.element);
    }
    return IssueComponent;
}());
var anonymousAvatar = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 14 16\" version=\"1.1\"><path fill=\"rgb(179,179,179)\" fill-rule=\"evenodd\" d=\"M8 10.5L9 14H5l1-3.5L5.25 9h3.5L8 10.5zM10 6H4L2 7h10l-2-1zM9 2L7 3 5 2 4 5h6L9 2zm4.03 7.75L10 9l1 2-2 3h3.22c.45 0 .86-.31.97-.75l.56-2.28c.14-.53-.19-1.08-.72-1.22zM4 9l-3.03.75c-.53.14-.86.69-.72 1.22l.56 2.28c.11.44.52.75.97.75H5l-2-3 1-2z\"></path></svg>";
var anonymousAvatarUrl = "data:image/svg+xml;base64," + btoa(anonymousAvatar);
var NewIssueComponent = (function () {
    function NewIssueComponent(user, submit) {
        var _this = this;
        this.user = user;
        this.submit = submit;
        this.submitting = false;
        this.handleInput = function () {
            _this.submitButton.disabled = /^\s*$/.test(_this.textarea.value);
            if (_this.textarea.scrollHeight < 450 && _this.textarea.offsetHeight < _this.textarea.scrollHeight) {
                _this.textarea.style.height = _this.textarea.scrollHeight + "px";
                publishResize();
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
            _this.submit(_this.input.value, _this.textarea.value).catch(function () { return 0; }).then(function () {
                _this.submitting = false;
                _this.textarea.disabled = !_this.user;
                _this.textarea.value = '';
                _this.submitButton.disabled = false;
            });
        };
        this.element = document.createElement('article');
        this.element.classList.add('timeline-comment');
        this.element.addEventListener('mousemove', publishResize);
        this.element.innerHTML = "\n      <a class=\"avatar\" target=\"_blank\">\n        <img height=\"44\" width=\"44\">\n      </a>\n      <form class=\"comment\" accept-charset=\"UTF-8\" action=\"javascript:\">\n        <header class=\"comment-header\">\n          <strong>Join the discussion</strong>\n        </header>\n        <div class=\"comment-body\">\n          <input class=\"form-control input-block\" placeholder=\"Title\"/>\n          <textarea placeholder=\"Leave a comment\" aria-label=\"comment\"></textarea>\n        </div>\n        <footer class=\"comment-footer\">\n          <a class=\"text-link markdown-info\" tabindex=\"-1\" target=\"_blank\"\n             href=\"https://guides.github.com/features/mastering-markdown/\">\n            Styling with Markdown is supported\n          </a>\n          <button class=\"btn btn-primary\" type=\"submit\">Comment</button>\n        </footer>\n      </form>";
        this.avatarAnchor = this.element.firstElementChild;
        this.avatar = this.avatarAnchor.firstElementChild;
        this.form = this.avatarAnchor.nextElementSibling;
        this.input = this.form.firstElementChild.nextElementSibling.firstElementChild;
        this.textarea = this.input.nextElementSibling;
        this.submitButton = this.form.lastElementChild.lastElementChild;
        this.setUser(user);
        this.textarea.addEventListener('input', this.handleInput);
        this.form.addEventListener('submit', this.handleSubmit);
    }
    NewIssueComponent.prototype.setUser = function (user) {
        this.user = user;
        this.submitButton.textContent = user ? 'Comment' : 'Sign in to comment';
        this.submitButton.disabled = !!user;
        if (user) {
            this.avatarAnchor.href = user.html_url;
            this.avatar.alt = '@' + user.login;
            this.avatar.src = user.avatar_url + '?v=3&s=88';
        }
        else {
            this.avatarAnchor.removeAttribute('href');
            this.avatar.alt = '@anonymous';
            this.avatar.src = anonymousAvatarUrl;
            this.textarea.disabled = true;
        }
    };
    NewIssueComponent.prototype.clear = function () {
        this.textarea.value = '';
        this.input.value = '';
    };
    return NewIssueComponent;
}());

function normalizeConfig(filename, rawConfig) {
    if (!Array.isArray(rawConfig.origins)) {
        throw new Error(filename + ": origins must be an array");
    }
    return rawConfig;
}
function loadRepoConfig(path) {
    return loadJsonFile(path)
        .then(function (config) { return normalizeConfig(path, config); });
}

setRepoContext(pageAttributes);
function loadIssues() {
    return loadIssuesByType("open");
}
Promise.all([loadRepoConfig(pageAttributes.configPath), loadIssues(), loadUser()])
    .then(function (_a) {
    var repoConfig = _a[0], issues = _a[1], user = _a[2];
    return bootstrap(repoConfig, issues, user);
});
function bootstrap(config, issues, user) {
    if (config.origins.indexOf(pageAttributes.origin) === -1) {
        throw new Error("The origins specified in " + pageAttributes.configPath + " do not include " + pageAttributes.origin);
    }
    setHostOrigin(pageAttributes.origin);
    if (!issues)
        return;
    var tabChanged = function (tabname) {
        if (!tabname)
            return;
        loadIssuesByType(tabname).then(function (issues) {
            feedback.setIssues(issues);
            publishResize();
        });
    };
    var feedback = new FeedbackComponent(tabChanged, user);
    document.body.appendChild(feedback.element);
    feedback.setIssues(issues);
    publishResize();
}

}());
