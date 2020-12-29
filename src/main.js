import './plugins/bootstrap-vue'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import FullScreenLoader from './components/FullScreenLoader.vue';

Vue.config.productionTip = false

Vue.component('full-screen-loader', FullScreenLoader);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
