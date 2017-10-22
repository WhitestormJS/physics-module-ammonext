var fs = require('fs'),
    path = require('path'),
    paths = new Map();

export default function () {
    return {
        resolveId: function (importee, importer) {
            if (importee === 'rollup-plugin-bundle-worker') {
                return path.resolve(__dirname, './bundle-worker/workerhelper.js');
            }
            else if (importee.indexOf('worker!') === 0) {
                var name = importee.split('!')[1],
                    target = path.resolve(path.dirname(importer), name);

                paths.set(target, name);
                return target;
            }
        },

        /**
         * Do everything in load so that code loaded by the plugin can still be transformed by the
         * rollup configuration
         */
        load: function (id) {
            if (!paths.has(id)) {
                return;
            }

            var code = [
                    `import shimWorker from 'rollup-plugin-bundle-worker';`,
                    `export default new shimWorker(${JSON.stringify(paths.get(id))}, function (window, document) {`,
                    `var self = this;`,
                    fs.readFileSync(id, 'utf-8').replace('export default self;', ''),
                    `\n});`
                ].join('\n');

            // console.log(code);

            return code;
        }
    };
}
