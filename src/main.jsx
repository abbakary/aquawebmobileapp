import React from 'react'
import { createRoot } from 'react-dom/client'
import { DeviceProvider } from './device'
import { Store } from './store'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <DeviceProvider>
    <Store>
      <App />
    </Store>
  </DeviceProvider>
)
