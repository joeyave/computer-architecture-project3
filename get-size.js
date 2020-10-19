const getSize = require('./index');
const argv = require('gar')(process.argv.slice(2));
const path = require('path');

const usageString = `
Usage:
get-size --folder=/home/myFolder
`;

const optionsString = `Options:
-i, --ignore REGEX\t - ignore files that correspond to the given regex
-h, --help\t\t - get help
`;

if (argv['help'] || argv['h']) {
    console.log(usageString);
    console.log(optionsString);

    process.exit(0);
}

// --folder or -f or last argument passed
const folder = argv['folder'] || argv['f'] || argv._[argv._.length - 1];

if (!folder) {
    console.error('missing folder argument');
    console.error(usageString);
    process.exit(1);
}

const args = {
    ignoreHidden: argv['ignore-hidden'] ? true : null,
    ignoreReadOnly: argv['ignore-readonly'] ? true : null,
    ignoreRegex: argv['ignore'] ? new RegExp(argv['ignore']) : null
};

getSize(path.resolve(folder), args, (err, bytes) => {
    if (err) {
        throw err;
    }

    console.log((bytes / 1024 / 1024).toFixed(2) + ' Mb');
});

