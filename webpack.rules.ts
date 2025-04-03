import type { ModuleOptions } from 'webpack';
import { VueLoaderPlugin } from 'vue-loader';

export const rules: Required<ModuleOptions>['rules'] = [
  // Правило для Vue компонентов
  {
    test: /\.vue$/,
    loader: 'vue-loader',
  },
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: /native_modules[/\\].+\.node$/,
    use: 'node-loader',
  },
  {
    test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
        appendTsSuffixTo: [/\.vue$/],
      },
    },
  },
  // Правило для CSS файлов (уже есть в rendererConfig, но лучше определить здесь)
  {
    test: /\.css$/,
    use: ['style-loader', 'css-loader', 'postcss-loader'],
  },
  // Правило для SCSS файлов (для стилей Quasar)
  {
    test: /\.s(c|a)ss$/,
    use: [
      'style-loader',
      'css-loader',
      'postcss-loader',
      'sass-loader'
    ],
  },
  // Правила для шрифтов и изображений (Quasar их использует)
  {
    test: /\.(png|jpe?g|gif|svg|ico|woff|woff2|eot|ttf|otf)(\?.*)?$/,
    type: 'asset/resource',
    generator: {
      filename: 'assets/[hash][ext][query]'
    }
  }
];

// Экспортируем VueLoaderPlugin, чтобы добавить его в plugins в webpack.renderer.config.ts
export const vueLoaderPlugin = new VueLoaderPlugin();
