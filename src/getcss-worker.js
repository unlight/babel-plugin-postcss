const postcss = require('postcss');
const postcssrc = require('postcss-load-config');

module.exports = function getCssWorker(connection) {
    let processor;
    // You can setup any connections you need here
    return ({ input, from }) => {
        processor = processor || postcssrc();
        // Note how even though we return a promise, the resulting rpc client will be synchronous
        return processor.then(({ plugins, options }) => {
            return postcss(plugins)
                .process(input, { from })
                .then(result => result.css);
        });
    };
};
