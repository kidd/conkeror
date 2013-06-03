/* -*- Javascript -*- */

require ("jscl.js");

globalEval = evaluate;

interactive("lisp",
            "Evaluate a Lisp expr",
            function (I) {
                var input = I.minibuffer.read($prompt = "Lisp expression: ",
                                             $history = "lisp-eval");
                var result = lisp.evalString.apply(window, [yield input]);
                I.window.minibuffer.message(lisp.print(result));
            });

provide("jscl_loader")
