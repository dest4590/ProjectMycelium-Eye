import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.config.errorHandler = (err, _instance, info) => {
    console.error('Global error:', err, info)
}

app.mount('#app')
