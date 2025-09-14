// App.jsx
import React, { useState } from 'react'
import AppRoutes from './components/AppRoutes';
import Nav from'./components/Nav'
import Footer from './components/Footer'

const App = () => {

  const [isLoggedIn , setIsLoggedIn] = useState(false)
  return (
     <div className="w-screen min-h-screen bg-gray-950 text-white flex flex-col">
      <Nav isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

      <main className='flex-1'>
           <AppRoutes  setIsLoggedIn={setIsLoggedIn}/>
      </main>

      <Footer/>
    </div>
  )
}

export default App
