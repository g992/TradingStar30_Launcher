const { configure } = require('@quasar/app-vite');

module.exports = configure(function (/* ctx */) {
    return {
        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js

        // Необходимые флаги для интеграции с внешними инструментами сборки
        // Указываем Quasar, что мы не используем его собственный CLI для сборки
        // build: {
        //   // Вместо использования Quasar CLI для сборки, мы будем использовать Electron Forge
        //   // Поэтому здесь не нужно указывать параметры сборки Quasar
        // },

        // // Не нужно, так как Electron Forge управляет режимом разработки
        // devServer: {},

        // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
        // preFetch: true,

        // app boot file (/src/boot)
        // --> смотри https://v2.quasar.dev/quasar-cli-vite/boot-files
        boot: [
            // 'i18n', // Пример, если используется i18n
            // 'axios', // Пример, если используется axios
        ],

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
        css: [
            'app.scss' // Указываем основной файл стилей Quasar
        ],

        // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
        extras: [
            // 'ionicons-v4',
            // 'mdi-v5',
            'fontawesome-v6',
            // 'eva-icons',
            // 'themify',
            // 'line-awesome',
            // 'roboto-font-latin-ext', // Расширение шрифта Roboto для латиницы

            'roboto-font', // Основной шрифт Roboto
            'material-icons', // Набор иконок Material Design
        ],

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
        build: {
            target: {
                browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
                node: 'node20' // Используем Node.js 20
            },

            vueRouterMode: 'hash', // Используем hash режим для роутера в Electron

            // // Vite plugin options -> https://vitejs.dev/config/#plugins-options
            // vitePlugins: [
            //   // Здесь можно добавить плагины Vite, если необходимо
            // ]
        },

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
        devServer: {
            // https: true
            open: false // Не открывать браузер автоматически, так как это Electron приложение
        },

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
        framework: {
            config: {},

            // iconSet: 'material-icons', // Quasar icon set
            // lang: 'en-US', // Quasar language pack

            // For special cases outside of where the auto-import strategy can have an impact
            // (like functional components as one of the examples),
            // you can manually specify Quasar components/directives to be available everywhere:
            //
            // components: [],
            // directives: [],

            // Quasar plugins
            plugins: [
                'Notify', // Пример подключения плагина Notify
                'Dialog', // Пример подключения плагина Dialog
                'Loading' // Пример подключения плагина Loading
            ]
        },

        // animations: 'all', // --- includes all animations
        // https://v2.quasar.dev/options/animations
        animations: [],

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#sourcefiles
        // sourceFiles: {
        //   rootComponent: 'src/App.vue',
        //   router: 'src/router/index',
        //   store: 'src/store/index', // Если используется Vuex/Pinia
        //   registerServiceWorker: 'src-pwa/register-service-worker',
        //   serviceWorker: 'src-pwa/custom-service-worker',
        //   pwaManifestFile: 'src-pwa/manifest.json',
        //   electronMain: 'src-electron/electron-main',
        //   electronPreload: 'src-electron/electron-preload'
        // },

        // https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
        // Не используем встроенную конфигурацию Electron Quasar CLI,
        // так как мы используем Electron Forge. Настройка будет в forge.config.ts
        electron: {
            // bundler: 'packager', // 'packager' или 'builder'

            // packager: {
            //   // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
            //
            //   // OS X / Mac App Store
            //   // appBundleId: '',
            //   // appCategoryType: '',
            //   // osxSign: '',
            //   // protocol: 'myapp://path',
            //
            //   // Windows only
            //   // win32metadata: { ... }
            // },

            // builder: {
            //   // https://www.electron.build/configuration/configuration
            //
            //   appId: 'tradingstar30_launcher'
            // },

            // Electron Main process configuration
            // extendElectronMainConf (cfg) {
            //   // do something with Electron main process Webpack cfg
            //   // chainWebpackMain (chain) {}
            //   // extendWebpackMain (cfg) {}
            // },

            // Electron Preload scripts configuration
            // extendElectronPreloadConf (cfg) {
            //   // do something with Electron preload scripts Webpack cfg
            //   // chainWebpackPreload (chain) {}
            //   // extendWebpackPreload (cfg) {}
            // }
        },

        // https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
        bex: {
            contentScripts: [
                'my-content-script'
            ],

            // extendBexScriptsConf (cfg) {}
            // extendBexManifestJson (json) {}
        }
    }
}); 