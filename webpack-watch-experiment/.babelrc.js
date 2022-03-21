module.exports = {
    presets: [],
    plugins: [
        [
            'babel-plugin-postcss',
            {
                test: /\.css$/,
                postcss: true,
                tagged: ['css', 'lit-element'],
                externalDependencies: ['style.css'],
            },
        ],
    ],
};
