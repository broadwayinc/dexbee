const path = require('path');

module.exports = (env) => {
    return {
        mode: env.mode || 'development',
        entry: ['babel-polyfill', path.resolve(__dirname, './lib/dexbee.js')],
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: './dexbee.js',
            libraryTarget: 'window'
        },
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                }
            ]
        },
        optimization: {
            usedExports: true,
        }
    };
};