const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const rxPaths = require('rxjs/_esm5/path-mapping');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');


module.exports = {
  entry: [
    './src/index.jsx'
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'assets/js/bundle.[hash:7].js'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.join(__dirname, 'src/index.html')
    }),
    new LodashModuleReplacementPlugin(),
    new MiniCssExtractPlugin({
      filename: 'assets/css/all.min.[hash:7].css'
    })
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, 'src')
        ],
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: ['lodash'],
              presets: [['env', {'modules': false}], 'react', 'stage-2']
            }
          }
        ]
      },
      {
        test: /\.css$/,
        include: [
          path.resolve(__dirname, 'node_modules')
        ],
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: 'css-loader',
            options: {
              minimize: true
            }
          }
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf|png|svg)$/i,
        include: [
          path.resolve(__dirname, 'node_modules')
        ],
        use: [
          {
            loader: 'url-loader'
          }
        ]
      }
    ]
  },
  resolve: {
    alias: {
      ...rxPaths(),
      '@': path.resolve(__dirname, 'src/')
    }
  },
  devtool: 'source-maps'
};
