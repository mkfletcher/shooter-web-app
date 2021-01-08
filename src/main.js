import './plugins/bootstrap-vue'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import FullScreenLoader from './components/FullscreenLoader.vue';
import LobbyCard from './components/LobbyCard.vue';

Vue.config.productionTip = false

Vue.component('full-screen-loader', FullScreenLoader);
Vue.component('lobby-card', LobbyCard);

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
