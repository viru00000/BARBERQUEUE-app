// App.jsx
import React, { useEffect, useState } from 'react'
import AppRoutes from './components/AppRoutes';
import Nav from'./components/Nav'
import Footer from './components/Footer'
import ToastProvider from './components/ToastProvider'

const App = () => {

  const [isLoggedIn , setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <ToastProvider>
      <div className="w-screen min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col transition-colors duration-300">
        <Nav isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        <main className='flex-1'>
          <AppRoutes  setIsLoggedIn={setIsLoggedIn}/>
        </main>
        <Footer/>
      </div>
    </ToastProvider>
  )
}

export default App
