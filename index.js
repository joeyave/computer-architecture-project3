'use strict';

const fs = require('fs');
const path = require('path');
const eachAsync = require('tiny-each-async');
const winattr = require('winattr')

function readSizeRecursive(seen, item, args, callback) {
    let cb;
    let _args = {};

    if (!callback) {
        cb = args;
        _args.ignoreRegex = null;
        _args.ignoreHidden = null;
        _args.ignoreReadOnly = null;
    } else {
        cb = callback;
        _args.ignoreRegex = args.ignoreRegex;
        _args.ignoreHidden = args.ignoreHidden;
        _args.ignoreReadOnly = args.ignoreReadOnly;
    }

    fs.lstat(item, function lstat(e, stats) {
        let total = !e ? (stats.size || 0) : 0;

        if (stats) {
            if (seen.has(stats.ino)) {
                return cb(null, 0);
            }

            seen.add(stats.ino);
        }

        if (!e && stats.isDirectory()) {
            fs.readdir(item, (err, list) => {
                if (err) {
                    return cb(err);
                }

                eachAsync(
                    list,
                    5000,
                    (dirItem, next) => {
                        readSizeRecursive(
                            seen,
                            path.join(item, dirItem),
                            _args,
                            (error, size) => {
                                if (!error) {
                                    total += size;
                                }

                                next(error);
                            }
                        );
                    },
                    (finalErr) => {
                        cb(finalErr, total);
                    }
                );
            });
        } else {
            let attrs = winattr.getSync(item);

            if (_args.ignoreRegex && _args.ignoreRegex.test(item)) {
                total = 0;
            } else if (args.ignoreHidden && attrs.hidden === true) {
                total = 0;
            } else if (args.ignoreReadOnly && attrs.readonly === true) {
                total = 0;
            }

            cb(e, total);
        }
    });
}

module.exports = (...args) => {
    args.unshift(new Set());

    return readSizeRecursive(...args);
};