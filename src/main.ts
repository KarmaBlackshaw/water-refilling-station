import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Toast, { type PluginOptions, POSITION } from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import '@vuepic/vue-datepicker/dist/main.css';
import './assets/main.css';
import App from './App.vue';
import { router } from './router';
import { useAuthStore } from './stores/auth';

const toastOptions: PluginOptions = {
  position: POSITION.TOP_RIGHT,
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
};

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(Toast, toastOptions);

const initApp = async () => {
  const auth = useAuthStore();

  await auth.initialize();
  app.mount('#app');
};

initApp();
