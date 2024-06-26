const path = require('path');

console.log('Webpack Config Path:', __dirname);

module.exports = {
    entry: './public/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public'),
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    resolve: {
        alias: {
            firebase: path.resolve(__dirname, 'node_modules/firebase')
        }
    },
    mode: 'production'
};
