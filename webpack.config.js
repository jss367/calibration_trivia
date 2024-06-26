const webpack = require('webpack');
const path = require('path');
const package = require('./package.json');

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
    plugins: [
        new webpack.DefinePlugin({
            'process.env.APP_VERSION': JSON.stringify(package.version)
        })
    ],
    mode: 'production'
};
