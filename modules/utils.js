/***** BEGIN LICENSE BLOCK *****
Version: MPL 1.1/GPL 2.0/LGPL 2.1

The contents of this file are subject to the Mozilla Public License Version
1.1 (the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
for the specific language governing rights and limitations under the
License.

The Initial Developer of the Original Code is Shawn Betts.
Portions created by the Initial Developer are Copyright (C) 2004,2005
by the Initial Developer. All Rights Reserved.

Alternatively, the contents of this file may be used under the terms of
either the GNU General Public License Version 2 or later (the "GPL"), or
the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
in which case the provisions of the GPL or the LGPL are applicable instead
of those above. If you wish to allow use of your version of this file only
under the terms of either the GPL or the LGPL, and not to allow others to
use your version of this file under the terms of the MPL, indicate your
decision by deleting the provisions above and replace them with the notice
and other provisions required by the GPL or the LGPL. If you do not delete
the provisions above, a recipient may use your version of this file under
the terms of any one of the MPL, the GPL or the LGPL.
***** END LICENSE BLOCK *****/

/*
 * Utility functions for application scope.
 *
 */


function string_hashset() {
}

string_hashset.prototype = {
    constructor : string_hashset,

    add : function(s) {
        this["-" + s] = true;
    },
    
    contains : function(s) {
        return (("-" + s) in this);
    },

    remove : function (s) {
        delete this["-" + s];
    },

    for_each : function (f) {
        for (var i in this) {
            if (i[0] == "-")
                f(i.slice(1));
        }
    }
};

function string_hashmap() {
}

string_hashmap.prototype = {
    constructor : string_hashmap,

    put : function(s,value) {
        this["-" + s] = value;
    },
    
    contains : function(s) {
        return (("-" + s) in this);
    },

    get : function(s, default_value) {
        if (this.contains(s))
            return this["-" + s];
        return default_value;
    },

    get_put_default : function(s, default_value) {
        if (this.contains(s))
            return this["-" + s];
        return (this["-" + s] = default_value);
    },

    remove : function (s) {
        delete this["-" + s];
    },

    for_each : function (f) {
        for (var i in this) {
            if (i[0] == "-")
                f(i.slice(1), this[i]);
        }
    },

    for_each_value : function (f) {
        for (var i in this) {
            if (i[0] == "-")
                f(this[i]);
        }
    }
};

/// Window title formatting

/**
 * Default tile formatter.  The page url is ignored.  If there is a
 * page_title, returns: "Page title - Conkeror".  Otherwise, it
 * returns just: "Conkeror".
 */
function default_title_formatter (window)
{
    var page_title = window.buffers.current.title;

    if (page_title && page_title.length > 0)
        return page_title + " - Conkeror";
    else
        return "Conkeror";
}

var title_format_fn = null;

function set_window_title (window)
{
    window.document.title = title_format_fn(window);
}

function init_window_title ()
{
    title_format_fn = default_title_formatter;

    add_hook("window_initialize_late_hook", set_window_title);
    add_hook("current_content_buffer_location_change_hook",
             function (buffer) {
                 set_window_title(buffer.window);
             });
    add_hook("select_buffer_hook", function (buffer) { set_window_title(buffer.window); }, true);
    add_hook("current_buffer_title_change_hook",
             function (buffer) {
                 set_window_title(buffer.window);
             });
}
///


// Put the string on the clipboard
function writeToClipboard(str)
{
    const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
	.getService(Components.interfaces.nsIClipboardHelper);
    gClipboardHelper.copyString(str);
}


function makeURLAbsolute (base, url)
{
    // Construct nsIURL.
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
	.getService(Components.interfaces.nsIIOService);
    var baseURI  = ioService.newURI(base, null, null);

    return ioService.newURI (baseURI.resolve (url), null, null).spec;
}


function get_link_location (element)
{
    if (element && element.getAttribute("href")) {
        var loc = element.getAttribute("href");
        return makeURLAbsolute(element.baseURI, loc);
    }
    return null;
}


function makeURL(aURL)
{
    var ioService = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);
    return ioService.newURI(aURL, null, null);
}

function make_uri(uri) {
    if (uri instanceof Ci.nsIURI)
        return uri;
    var io_service = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    return io_service.newURI(uri, null, null);
}

function makeFileURL(aFile)
{
    var ioService = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);
    return ioService.newFileURI(aFile);
}


function get_document_content_disposition (document_o)
{
    var content_disposition = null;
    try {
        content_disposition =
            document_o.defaultView
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindowUtils)
            .getDocumentMetadata("content-disposition");
    } catch (e) { }
    return content_disposition;
}


function set_focus_no_scroll(window, element)
{
    window.document.commandDispatcher.suppressFocusScroll = true;
    element.focus();
    window.document.commandDispatcher.suppressFocusScroll = false;
}

function do_repeatedly_positive(func, n) {
    var args = Array.prototype.slice.call(arguments, 2);
    while (n-- > 0)
        func.apply(null, args);
}

function do_repeatedly(func, n, positive_args, negative_args) {
    if (n < 0)
        do func.apply(null, negative_args); while (++n < 0);
    else
        while (n-- > 0) func.apply(null, positive_args);
}

// remove whitespace from the beginning and end
function trim_whitespace (str)
{
    var tmp = new String (str);
    return tmp.replace (/^\s+/, "").replace (/\s+$/, "");
}

function abs_point (node)
{
    var orig = node;
    var pt = {};
    try {
        pt.x = node.offsetLeft;
        pt.y = node.offsetTop;
        // find imagemap's coordinates
        if (node.tagName == "AREA") {
            var coords = node.getAttribute("coords").split(",");
            pt.x += Number(coords[0]);
            pt.y += Number(coords[1]);
        }

        node = node.offsetParent;
        // Sometimes this fails, so just return what we got.

        while (node.tagName != "BODY") {
            pt.x += node.offsetLeft;
            pt.y += node.offsetTop;
            node = node.offsetParent;
        }
    } catch(e) {
// 	node = orig;
// 	while (node.tagName != "BODY") {
// 	    alert("okay: " + node + " " + node.tagName + " " + pt.x + " " + pt.y);
// 	    node = node.offsetParent;
// 	}
    }
    return pt;
}

var xul_app_info = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
var xul_runtime = Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULRuntime);


function get_os ()
{
    // possible return values: 'Darwin', 'Linux', 'WINNT', ...
    return xul_runtime.OS;
}

var default_directory = null;

var env = Cc['@mozilla.org/process/environment;1'].getService(Ci.nsIEnvironment);
function getenv (variable) {
    if (env.exists (variable))
        return env.get(variable);
    return null;
}

function set_default_directory(directory_s) {
    if (! directory_s)
    {
        if ( get_os() == "WINNT")
        {
            directory_s = getenv ('USERPROFILE') ||
                getenv ('HOMEDRIVE') + getenv ('HOMEPATH');
        }
        else {
            directory_s = getenv ('HOME');
        }
    }

    default_directory = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    default_directory.initWithPath (directory_s);
}

set_default_directory();

const XHTML_NS = "http://www.w3.org/1999/xhtml";
const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const MATHML_NS = "http://www.w3.org/1998/Math/MathML";
const XLINK_NS = "http://www.w3.org/1999/xlink";

function create_XUL(window, tag_name)
{
    return window.document.createElementNS(XUL_NS, tag_name);
}


/* Used in calls to XPath evaluate */
function xpath_lookup_namespace(prefix) {
    if (prefix == "xhtml")
        return XHTML_NS;
    if (prefix == "m")
        return MATHML_NS;
    if (prefix == "xul")
        return XUL_NS;
    return null;
}

function method_caller(obj, func) {
    return function () {
        func.apply(obj, arguments);
    }
}

function shell_quote(str) {
    var s = str.replace("\"", "\\\"", "g");
    s = s.replace("$", "\$", "g");
    return s;
}

function get_window_from_frame(frame) {
    try {
        var window = frame.QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIWebNavigation)
            .QueryInterface(Ci.nsIDocShellTreeItem)
            .rootTreeItem
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindow).wrappedJSObject;
        /* window is now an XPCSafeJSObjectWrapper */
        window.escape_wrapper(function (w) { window = w; });
        /* window is now completely unwrapped */
        return window;
    } catch (e) {
        return null;
    }
}

function get_buffer_from_frame(window, frame) {
    var count = window.buffers.count;
    for (var i = 0; i < count; ++i) {
        var b = window.buffers.get_buffer(i);
        if (b.top_frame == frame)
            return b;
    }
    return null;
}

var file_locator = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);

function get_shortdoc_string(doc) {
    var shortdoc = null;
    if (doc != null) {
        var idx = doc.indexOf("\n");
        if (idx >= 0)
            shortdoc = doc.substring(0,idx);
        else
            shortdoc = doc;
    }
    return shortdoc;
}

var conkeror_source_code_path = null;

function source_code_reference(uri, line_number) {
    this.uri = uri;
    this.line_number = line_number;
}
source_code_reference.prototype = {
    get module_name () {
        if (this.uri.indexOf(module_uri_prefix) == 0)
            return this.uri.substring(module_uri_prefix.length);
        return null;
    },

    get file_name () {
        var file_uri_prefix = "file://";
        if (this.uri.indexOf(file_uri_prefix) == 0)
            return this.uri.substring(file_uri_prefix.length);
        return null;
    },

    get best_uri () {
        if (conkeror_source_code_path != null) {
            var module_name = this.module_name;
            if (module_name != null)
                return "file://" + conkeror_source_code_path + "/modules/" + module_name;
        }
        return this.uri;
    },

    open_in_editor : function() {
        yield open_with_external_editor(this.best_uri, $line = this.line_number);
    }
};

var get_caller_source_code_reference_ignored_functions = {};

function get_caller_source_code_reference(extra_frames_back) {
    /* Skip at least this function itself and whoever called it (and
     * more if the caller wants to be skipped). */
    var frames_to_skip = 2;
    if (extra_frames_back != null)
        frames_to_skip += extra_frames_back;

    for (let f = Components.stack; f != null; f = f.caller) {
        if (frames_to_skip > 0) {
            --frames_to_skip;
            continue;
        }
        if (get_caller_source_code_reference_ignored_functions[f.name])
            continue;
        return new source_code_reference(f.filename, f.lineNumber);
    }

    return null;
}

function ignore_function_for_get_caller_source_code_reference(func_name) {
    get_caller_source_code_reference_ignored_functions[func_name] = 1;
}

require_later("external-editor.js");

function dom_generator(document, ns) {
    this.document = document;
    this.ns = ns;
}
dom_generator.prototype = {
    element : function(tag, parent) {
        var node = this.document.createElementNS(this.ns, tag);
        var i = 1;
        if (parent != null && (parent instanceof Ci.nsIDOMNode)) {
            parent.appendChild(node);
            i = 2;
        }
        for (; i < arguments.length; i += 2)
            node.setAttribute(arguments[i], arguments[i+1]);
        return node;
    },

    text : function(str, parent) {
        var node = this.document.createTextNode(str);
        if (parent)
            parent.appendChild(node);
        return node;
    },


    stylesheet_link : function(href, parent) {
        var node = this.element("link");
        node.setAttribute("rel", "stylesheet");
        node.setAttribute("type", "text/css");
        node.setAttribute("href", href);
        if (parent)
            parent.appendChild(node);
        return node;
    },


    add_stylesheet : function (url) {
        var head = this.document.documentElement.firstChild;
        this.stylesheet_link(url, head);
    }
};

/**
 * Generates a QueryInterface function suitable for an implemenation
 * of an XPCOM interface.  Unlike XPCOMUtils, this uses the Function
 * constructor to generate a slightly more efficient version.  The
 * arguments can be either Strings or elements of
 * Components.interfaces.
 */
function generate_QI() {
    var args = Array.prototype.slice.call(arguments).map(String).concat(["nsISupports"]);
    var fstr = "if(" +
        Array.prototype.map.call(args,
                                 function (x)
                                     "iid.equals(Components.interfaces." + x + ")")
        .join("||") +
        ") return this; throw Components.results.NS_ERROR_NO_INTERFACE;";
    return new Function("iid", fstr);
}

function set_branch_pref(branch, name, value) {
    if (typeof(value) == "string") {
        branch.setCharPref(name, value);
    } else if (typeof(value) == "number") {
        branch.setIntPref(name, value);
    } else if (typeof(value) == "boolean") {
        branch.setBoolPref(name, value);
    }
}

function default_pref(name, value) {
    var branch = preferences.getDefaultBranch(null);
    set_branch_pref(branch, name, value);
}

function user_pref(name, value) {
    var branch = preferences.getBranch(null);
    set_branch_pref(branch, name, value);
}

function pref_is_locked(name, value) {
    var branch = preferences.getBranch(null);
    return branch.prefIsLocked(name);
}

function lock_pref(name, value) {
    var branch = preferences.getBranch(null);
    if (branch.prefIsLocked(name))
        branch.unlockPref(name);
    default_pref(name, value);
    branch.lockPref(name);
}

function unlock_pref(name) {
    var branch = preferences.getBranch(null);
    branch.unlockPref(name);
}

function get_branch_pref(branch, name) {
    switch (branch.getPrefType(name)) {
    case branch.PREF_STRING:
        return branch.getCharPref(name);
    case branch.PREF_INT:
        return branch.getIntPref(name);
    case branch.PREF_BOOL:
        return branch.getBoolPref(name);
    default:
        return null;
    }
}

function get_pref(name) {
    var branch = preferences.getBranch(null);
    return get_branch_pref(branch, name);
}

function get_default_pref(name) {
    var branch = preferences.getDefaultBranch(null);
    return get_branch_pref(branch, name);
}

function clear_pref(name) {
    var branch = preferences.getBranch(null);
    return branch.clearUserPref(name);
}

function clear_default_pref(name) {
    var branch = preferences.getDefaultBranch(null);
    return branch.clearUserPref(name);
}

function pref_has_user_value(name) {
    var branch = preferences.getBranch(null);
    return branch.prefHasUserValue(name);
}

function pref_has_default_value(name) {
    var branch = preferences.getDefaultBranch(null);
    return branch.prefHasUserValue(name);
}

function session_pref (name, value) {
    try { clear_pref (name); }
    catch (e) {}
    return default_pref (name, value);
}

const USER_AGENT_OVERRIDE_PREF = "general.useragent.override";

function set_user_agent(str) {
    lock_pref(USER_AGENT_OVERRIDE_PREF, str);
}

function define_builtin_commands(prefix, do_command_function, toggle_mark, mark_active_predicate) {

    // Specify a docstring
    function D(cmd, docstring) {
        var o = new String(cmd);
        o.doc = docstring;
        return o;
    }

    // Specify a forward/reverse pair
    function R(a, b) {
        var o = [a,b];
        o.is_reverse_pair = true;
        return o;
    }

    // Specify a movement/select command pair.
    function S(command, movement, select) {
        var o = [movement, select];
        o.command = command;
        o.is_move_select_pair = true;
        return o;
    }

    var builtin_commands = [
        S(D("beginning-of-line", "Move or extend the selection to the beginning of the current line."),
          D("cmd_beginLine", "Move point to the beginning of the current line."),
          D("cmd_selectBeginLine", "Extend selection to the beginning of the current line.")),
        S(D("end-of-line", "Move or extend the selection to the end of the current line."),
          D("cmd_endLine", "Move point to the end of the current line."),
          D("cmd_selectEndLine", "Extend selection to the end of the current line.")),
        D("cmd_copy", "Copy the selection into the clipboard."),
        "cmd_copyOrDelete",
        D("cmd_cut", "Cut the selection into the clipboard."),
        "cmd_cutOrDelete",
        D("cmd_deleteToBeginningOfLine", "Delete to the beginning of the current line."),
        D("cmd_deleteToEndOfLine", "Delete to the end of the current line."),
        S(D("beginning-of-first-line", "Move or extend the selection to the beginning of the first line."),
          D("cmd_moveTop", "Move point to the beginning of the first line."),
          D("cmd_selectTop", "Extend selection to the beginning of the first line.")),
        S(D("end-of-last-line", "Move or extend the selection to the end of the last line."),
          D("cmd_moveBottom", "Move point to the end of the last line."),
          D("cmd_selectBottom", "Extend selection to the end of the last line.")),
        D("cmd_selectAll", "Select all."),
        "cmd_scrollBeginLine",
        "cmd_scrollEndLine",
        D("cmd_scrollTop", "Scroll to the top of the buffer."),
        D("cmd_scrollBottom", "Scroll to the bottom of the buffer.")];

    var builtin_commands_with_count = [
        R(S(D("forward-char", "Move or extend the selection forward one character."),
            D("cmd_charNext", "Move point forward one character."),
            D("cmd_selectCharNext", "Extend selection forward one character.")),
          S(D("backward-char", "Move or extend the selection backward one character."),
            D("cmd_charPrevious", "Move point backward one character."),
            D("cmd_selectCharPrevious", "Extend selection backward one character."))),
        R(D("cmd_deleteCharForward", "Delete the following character."),
          D("cmd_deleteCharBackward", "Delete the previous character.")),
        R(D("cmd_deleteWordForward", "Delete the following word."),
          D("cmd_deleteWordBackward", "Delete the previous word.")),
        R(S(D("forward-line", "Move or extend the selection forward one line."),
            D("cmd_lineNext", "Move point forward one line."),
            "cmd_selectLineNext", "Extend selection forward one line."),
          S(D("backward-line", "Move or extend the selection backward one line."),
            D("cmd_linePrevious", "Move point backward one line."),
            D("cmd_selectLinePrevious", "Extend selection backward one line."))),
        R(S(D("forward-page", "Move or extend the selection forward one page."),
            D("cmd_movePageDown", "Move point forward one page."),
            D("cmd_selectPageDown", "Extend selection forward one page.")),
          S(D("backward-page", "Move or extend the selection backward one page."),
            D("cmd_movePageUp", "Move point backward one page."),
            D("cmd_selectPageUp", "Extend selection backward one page."))),
        R(D("cmd_undo", "Undo last editing action."),
          D("cmd_redo", "Redo last editing action.")),
        R(S(D("forward-word", "Move or extend the selection forward one word."),
            D("cmd_wordNext", "Move point forward one word."),
            D("cmd_selectWordNext", "Extend selection forward one word.")),
          S(D("backward-word", "Move or extend the selection backward one word."),
            D("cmd_wordPrevious", "Move point backward one word."),
            D("cmd_selectWordPrevious", "Extend selection backward one word."))),
        R(D("cmd_scrollPageUp", "Scroll up one page."),
          D("cmd_scrollPageDown", "Scroll down one page.")),
        R(D("cmd_scrollLineUp", "Scroll up one line."),
          D("cmd_scrollLineDown", "Scroll down one line.")),
        R(D("cmd_scrollLeft", "Scroll left."),
          D("cmd_scrollRight", "Scroll right.")),
        D("cmd_paste", "Insert the contents of the clipboard.")];

    interactive(prefix + "set-mark",
                "Toggle whether the mark is active.\n" +
                "When the mark is active, movement commands affect the selection.",
                toggle_mark);

    function doc_for_builtin(c) {
        var s = "";
        if (c.doc != null)
            s += c.doc + "\n";
        return s + "Run the built-in command " + c + ".";
    }

    function define_simple_command(c) {
        interactive(prefix + c, doc_for_builtin(c), function (I) { do_command_function(I, c); });
    }

    function get_move_select_doc_string(c) {
        return c.command.doc +
            "\nSpecifically, if the mark is inactive, runs `" + prefix + c[0] + "'.  " +
            "Otherwise, runs `" + prefix + c[1] + "'.\n" +
            "To toggle whether the mark is active, use `" + prefix + "set-mark'.";
    }

    for each (let c_temp in builtin_commands)  {
        let c = c_temp;
        if (c.is_move_select_pair) {
            interactive(prefix + c.command, get_move_select_doc_string(c), function (I) {
                do_command_function(I, mark_active_predicate(I) ? c[1] : c[0]);
            });
            define_simple_command(c[0]);
            define_simple_command(c[1]);
        }
        else
            define_simple_command(c);
    }

    function get_reverse_pair_doc_string(main_doc, alt_command) {
        return main_doc + "\n" +
            "The prefix argument specifies a repeat count for this command.  " +
            "If the count is negative, `" + prefix + alt_command + "' is performed instead with " +
            "a corresponding positive repeat count.";
    }

    function define_simple_reverse_pair(a, b) {
        interactive(prefix + a, get_reverse_pair_doc_string(doc_for_builtin(a), b),
                    function (I) {
                        do_repeatedly(do_command_function, I.p, [I, a], [I, b]);
                    });
        interactive(prefix + b, get_reverse_pair_doc_string(doc_for_builtin(b), a),
                    function (I) {
                        do_repeatedly(do_command_function, I.p, [I, b], [I, a]);
                    });
    }

    for each (let c_temp in builtin_commands_with_count)
    {
        let c = c_temp;
        if (c.is_reverse_pair) {
            if (c[0].is_move_select_pair) {
                interactive(prefix + c[0].command, get_reverse_pair_doc_string(get_move_select_doc_string(c[0]),
                                                                               c[1].command),
                            function (I) {
                                var idx = mark_active_predicate(I) ? 1 : 0;
                                do_repeatedly(do_command_function, I.p, [I, c[0][idx]], [I, c[1][idx]]);
                            });
                interactive(prefix + c[1].command, get_reverse_pair_doc_string(get_move_select_doc_string(c[1]),
                                                                               c[0].command),
                            function (I) {
                                var idx = mark_active_predicate(I) ? 1 : 0;
                                do_repeatedly(do_command_function, I.p, [I, c[1][idx]], [I, c[0][idx]]);
                            });
                define_simple_reverse_pair(c[0][0], c[1][0]);
                define_simple_reverse_pair(c[0][1], c[1][1]);
            } else
                define_simple_reverse_pair(c[0], c[1]);
        } else {
            let doc = doc_for_builtin(c) +
                "\nThe prefix argument specifies a positive repeat count for this command.";
            interactive(prefix + c, doc, function (I) {
                do_repeatedly_positive(do_command_function, I.p, I, c);
            });
        }
    }
}

var observer_service = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);

function abort(str) {
    var e = new Error(str);
    e.__proto__ = abort.prototype;
    return e;
}
abort.prototype.__proto__ = Error.prototype;


function get_temporary_file(name) {
    if (name == null)
        name = "temp.txt";
    var file = file_locator.get("TmpD", Ci.nsIFile);
    file.append(name);
    // Create the file now to ensure that no exploits are possible
    file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0600);
    return file;
}


/* FIXME: This should be moved somewhere else, perhaps. */
function create_info_panel(window, panel_class, row_arr) {
    /* Show information panel above minibuffer */

    var g = new dom_generator(window.document, XUL_NS);

    var p = g.element("vbox", "class", "panel " + panel_class, "flex", "0");
    var grid = g.element("grid", p);
    var cols = g.element("columns", grid);
    g.element("column", cols, "flex", "0");
    g.element("column", cols, "flex", "1");

    var rows = g.element("rows", grid);
    var row;

    for each (let [row_class, row_label, row_value] in row_arr) {
        row = g.element("row", rows, "class", row_class);
        g.element("label", row,
                  "value", row_label,
                  "class", "panel-row-label");
        g.element("label", row,
                  "value", row_value,
                  "class", "panel-row-value");
    }
    window.minibuffer.insert_before(p);

    p.destroy = function () {
        this.parentNode.removeChild(this);
    };

    return p;
}


// read_from_x_primary_selection favors the X PRIMARY SELECTION, when
// it exists.  The builtin cmd_paste always uses X CLIPBOARD.  So this
// is an auxiliary utility, in case you need to work with the primary
// selection.
//
function read_from_x_primary_selection ()
{
    // Get clipboard.
    var clipboard = Components.classes["@mozilla.org/widget/clipboard;1"]
        .getService(Components.interfaces.nsIClipboard);

    // Create tranferable that will transfer the text.
    var trans = Components.classes["@mozilla.org/widget/transferable;1"]
        .createInstance(Components.interfaces.nsITransferable);

    trans.addDataFlavor("text/unicode");
    // If available, use selection clipboard, otherwise global one
    if (clipboard.supportsSelectionClipboard())
        clipboard.getData(trans, clipboard.kSelectionClipboard);
    else
        clipboard.getData(trans, clipboard.kGlobalClipboard);

    var data = {};
    var dataLen = {};
    trans.getTransferData("text/unicode", data, dataLen);

    if (data) {
        data = data.value.QueryInterface(Components.interfaces.nsISupportsString);
        return data.data.substring(0, dataLen.value / 2);
    } else {
        return "";
    }
}

var user_variables = new string_hashmap();

function define_variable(name, default_value, doc) {
    conkeror[name] = default_value;
    user_variables.put(name, {
        default_value: default_value,
        doc: doc,
        shortdoc: get_shortdoc_string(doc),
        source_code_reference: get_caller_source_code_reference() });
}


function register_user_stylesheet(url)
{
    var uri = makeURL(url);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
}

function unregister_user_stylesheet(url)
{
    var uri = makeURL(url);
    var sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    if (sss.sheetRegistered(uri, sss.USER_SHEET))
        ss.unregisterSheet(uri, sss.USER_SHEET);
}
