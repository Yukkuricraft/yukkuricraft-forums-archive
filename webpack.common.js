const VueLoaderPlugin = require('vue-loader/lib/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (env, options) => {
  return {
    plugins: [new VueLoaderPlugin()],
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
        {
          test: /\.(scss)$/,
          use: [
            options.mode !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.(css)$/,
          use: [
            options.mode !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
          ],
        },
        {
          test: /\.(png|svg|jpe?g|gif|webp)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name]-[contenthash][ext]',
          },
        },
        {
          test: /\.(mp3)$/,
          type: 'asset/resource',
          generator: {
            filename: 'assets/sound/[name]-[contenthash][ext]',
          },
        },
        {
          test: /\.ya?ml$/,
          type: 'json', // Required by Webpack v4
          use: 'yaml-loader',
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          resourceQuery: /blockType=i18n/,
          type: 'javascript/auto',
          loader: '@intlify/vue-i18n-loader',
        },
      ],
    },
    resolve: {
      alias: {
        vue$: 'vue/dist/vue.runtime.esm.js',
      },
      extensions: ['*', '.js', '.vue', '.json'],
    },
  }
}
