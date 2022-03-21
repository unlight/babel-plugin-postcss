const { default: babelPluginPostcss } = require(__dirname + '/../src');

module.exports = {
    presets: [],
    plugins: [
        [
            babelPluginPostcss,
            {
                test: /\.css$/,
                postcss: true,
                tagged: ['css', 'lit-element'],
                externalDependencies: ['webpack-watch-experiment/style.css'],
            },
        ],
    ],
};
