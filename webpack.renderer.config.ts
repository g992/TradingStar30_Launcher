import type { Configuration } from 'webpack';
import path from 'path';

import { rules, vueLoaderPlugin } from './webpack.rules';
import { plugins } from './webpack.plugins';

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins: [
    ...plugins,
    vueLoaderPlugin
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.vue', '.scss', '.sass'],
    alias: {
      'vue$': 'vue/dist/vue.esm-bundler.js',
      'quasar': path.resolve(__dirname, 'node_modules/quasar'),
      'src': path.resolve(__dirname, 'src'),
      'quasar/dist/quasar.sass': path.resolve(__dirname, 'node_modules/quasar/dist/quasar.sass'),
      'quasar/lang': path.resolve(__dirname, 'node_modules/quasar/lang/'),
      'quasar/icon-set': path.resolve(__dirname, 'node_modules/quasar/icon-set/'),
    }
  },
};
