import { createApp } from 'vue'
import Vant from 'vant'
import 'vant/lib/index.css'
import App from './App.vue'
import './theme.css'

createApp(App).use(Vant).mount('#app')
