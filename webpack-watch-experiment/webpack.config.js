const path = require('path');
const WatchExternalFilesPlugin = require('webpack-watch-external-files-plugin');

module.exports = {
    entry: path.resolve(__dirname, './index.js'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    mode: 'development',
    devtool: false,
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                use: 'babel-loader',
                exclude: /node_modules/,
            },
            // {
            //     test: /\.css$/,
            //     use: ['css-loader', 'postcss-loader'],
            // },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    plugins: [
        new WatchExternalFilesPlugin({
            files: ['style.css'],
        }),
    ],
};
