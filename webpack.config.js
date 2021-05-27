const path = require('path');
const webpack = require('webpack');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

require('dotenv').config();

const isDev = (process.env.ENV === 'development');
const entry = ['./src/frontend/index.js'];

if(isDev){
    entry.push('webpack-hot-middleware/client?path=/__webpack_hmr&timeout=2000&reload=true');
}


module.exports = {
    entry,
    mode: process.env.ENV,
    output: {
        path: path.resolve(__dirname, 'src/server/public'),
        filename: isDev ?'assets/app.js' : 'assets/app-[hash].js',
        publicPath: '/',
    },
    devServer: {
        open: true,
        hot: true,
        port: 8081
    },
    mode: 'development',
    resolve: {
        extensions: ['.js', '.jsx']
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
        splitChunks: {
            chunks: 'async',
            cacheGroups: {
                vendors: {
                    name: 'vendors',
                    chunks: 'all',
                    reuseExistingChunk: true,
                    priority:1,
                    filename: isDev ? 'assests/vendor.js' : 'assets/vendor-[hash].js',
                    enforce: true,
                    test(module, chunks) {
                        const name = module.nameForCondition && module.nameForCondition();
                        return (chunk) => chunk.name !== 'vendors' && /[\\/]node_modules[\\/]/.test(name);
                      },
                },
            },
        },
    },
    module: { 
        rules: [
            {
                enforce: 'pre',
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: 'eslint-loader',
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            },
            {
                test: /\.html$/,
                use: 'html-loader'
            },
            {
                test: /\.(s*)css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.(png|jpe?g|gif)$/,
                use: [
                    {
                        'loader': 'file-loader',
                        options: {
                            name: 'assets/[hash].[ext]'
                        }
                    }
                ]
            }
        ]
    },
    devServer: {
        historyApiFallback : true
    },
    plugins: [ 
        isDev ? new webpack.HotModuleReplacementPlugin():
        () => {},
        isDev ? () => {}:
            new CompressionWebpackPlugin({
                test: /\.js$|\.css$/,
                filename: '[path][base].gz'
            }),
        isDev ? () => {} :
            new WebpackManifestPlugin(),
        new MiniCssExtractPlugin({
            filename: isDev ? 'assets/app.css' : 'assets/app-[hash].css',
        })
    ],
};

