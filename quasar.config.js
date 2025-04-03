const { configure } = require('@quasar/app-vite');

module.exports = configure(function (/* ctx */) {
    return {

        boot: [
            'pinia', // Добавляем наш boot-файл
            // 'i18n', // Пример, если используется i18n
            // 'axios', // Пример, если используется axios
        ],

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
        css: [
            'app.scss' // Указываем основной файл стилей Quasar
        ],

        // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
        extras: [
            'fontawesome-v6',
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

        },

        // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
        devServer: {
            // https: true
            port: 3030,
            open: false // Не открывать браузер автоматически, так как это Electron приложение
        },

        // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
        framework: {
            config: {},

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


        electron: {

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
