import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
      fullScreenLoaderShowing: false,
      fullScreenLoaderText: "Loading...",
      user: null,
  },
  mutations: {
      showLoader (state, payload) {
        state.fullScreenLoaderShowing = true;
        state.fullScreenLoaderText = payload;
      },
      hideLoader (state) {
          state.fullScreenLoaderShowing = false;
      },
      setUser (state, payload) {
          state.user = payload;
      }
  },
  actions: {
  },
  modules: {
  }
})
