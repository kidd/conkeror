const PERM_IWOTH = 00002;  /* write permission, others */
const PERM_IWGRP = 00020;  /* write permission, group */

const MODE_RDONLY   = 0x01;
const MODE_WRONLY   = 0x02;
const MODE_RDWR     = 0x04;
const MODE_CREATE   = 0x08;
const MODE_APPEND   = 0x10;
const MODE_TRUNCATE = 0x20;
const MODE_SYNC     = 0x40;
const MODE_EXCL     = 0x80;
const MODE_OUTPUT = MODE_WRONLY | MODE_CREATE | MODE_TRUNCATE;
const MODE_OUTPUT_APPEND = MODE_WRONLY | MODE_CREATE | MODE_APPEND;
const MODE_INPUT = MODE_RDONLY;

define_keywords("$charset");
function read_text_file(file)
{
    keywords(arguments, $charset = "UTF-8");

    var ifstream = null, icstream = null;

    try {
        ifstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        icstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);

        ifstream.init(file, -1, 0, 0);
        const replacementChar = Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER;
        icstream.init(ifstream, arguments.$charset, 4096, replacementChar); // 4096 bytes buffering

        var buffer = "";
        var str = {};
        while (icstream.readString(4096, str) != 0)
            buffer += str.value;
        return buffer;
    } finally  {
        if (icstream)
            icstream.close();
        if (ifstream)
            ifstream.close();
    }
}

define_keywords("$mode", "$perms", "$charset");
function write_text_file(file, buf)
{
    keywords(arguments, $charset = "UTF-8", $perms = 0644, $mode = MODE_WRONLY | MODE_CREATE | MODE_TRUNCATE);

    var ofstream, ocstream;
    try {
        ofstream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
        ocstream = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);

        ofstream.init(file, arguments.$mode, arguments.$perms, 0);
        ocstream.init(ofstream, arguments.$charset, 0, 0x0000);
        ocstream.writeString(buf);
    } finally {
        if (ocstream)
            ocstream.close();
        if (ofstream)
            ofstream.close();
    }
}

define_keywords("$mode", "$perms");
function write_binary_file(file, buf)
{
    keywords(arguments, $perms = 0644, $mode = MODE_WRONLY | MODE_CREATE | MODE_TRUNCATE);
    var stream = null, bstream = null;

    try {
        stream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
        stream.init(file, arguments.$mode, arguments.$perms, 0);

        bstream = binary_output_stream(stream);
        bstream.writeBytes(buf, buf.length);
    } finally {
        if (bstream)
            bstream.close();
        if (stream)
            stream.close();
    }
}

function get_file(path) {
    var f = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    f.initWithPath(path);
    return f;
}

function input_stream_async_wait(stream, callback, requested_count) {
    stream = stream.QueryInterface(Ci.nsIAsyncInputStream);
    var flags = (requested_count === false) ? Ci.nsIAsyncInputStream.WAIT_CLOSURE_ONLY : 0;
    if (requested_count == null || requested_count == false)
        requested_count = 0;
    stream.asyncWait({onInputStreamReady: callback}, flags, requested_count, null);
}

function output_stream_async_wait(stream, callback, requested_count) {
    stream = stream.QueryInterface(Ci.nsIAsyncOutputStream);
    var flags = (requested_count === false) ? Ci.nsIAsyncOutputStream.WAIT_CLOSURE_ONLY : 0;
    if (requested_count == null || requested_count == false)
        requested_count = 0;
    stream.asyncWait({onOutputStreamReady: callback}, flags, requested_count, null);
}

function binary_output_stream(stream) {
    var s = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);
    s.setOutputStream(stream);
    return s;
}

function binary_input_stream(stream) {
    var s = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
    s.setInputStream(stream);
    return s;
}

//  callback is called with a single argument, either true if the write succeeded, or false otherwise
function async_binary_write(stream, data, callback) {
    function attempt_write() {
        try {
            while (true) {
                if (data.length == 0) {
                    stream.flush();
                    callback(true);
                    return;
                }
                var len = stream.write(data, data.length);
                if (len == 0)
                    break;
                data = data.substring(len);
            }
        }
        catch (e if (e instanceof Components.Exception) && e.result == Cr.NS_BASE_STREAM_WOULD_BLOCK) {}
        catch (e) {
            callback(false);
            return;
        }
        output_stream_async_wait(stream, attempt_write, data.length);
    }
    attempt_write();
}

/**
 * The `str' parameter should be a normal JavaScript string whose char codes specify Unicode code points.
 * The return value is a byte string (all char codes are from 0 to 255) equal to the `str' encoded in the specified charset.
 * If charset is not specified, it defaults to UTF-8.
 */
function encode_string(str, charset) {
    var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = charset || "UTF-8";
    var output = converter.ConvertFromUnicode(str);
    output += converter.Finish();
    return output;
}



/**
 * The `bstr' parameter should be a byte string (all char codes are from 0 to 255).
 * The return value is a normal JavaScript unicode sring equal to `bstr' decoded using the specified charset.
 * If charset is not specified, it defaults to UTF-8.
 */
function decode_string(bstr, charset) {
    var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = charset  || "UTF-8";
    return converter.ConvertToUnicode(bstr);
}

function async_binary_string_writer(bstr) {
    return function (stream) {
        async_binary_write(stream, bstr);
    };
}

function async_binary_reader(callback) {
    return function (stream) {
        var bstream = binary_input_stream(stream);
        function handler() {
            try {
                let avail = stream.available();
                if (avail > 0) {
                    callback(bstream.readBytes(avail));
                }
                input_stream_async_wait(stream, handler);
            } catch (e) {
                callback(null);
            }
        }
        input_stream_async_wait(stream, handler);
    };
}
