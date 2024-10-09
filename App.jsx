import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const endpoint = "http://localhost:3000/api/v1/kerusakan"
  const [kerusakan, setKerusakan] = useState([])

  const fetchData = async () => {
    const response = await fetch(endpoint)
    const data = await response.json()
    // setKerusakan(data.payload)
    console.log(data.payload)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <>
      <h1>TESTING</h1>
      
    {/* {kerusakan.data.map((kerusakan) => {
          return (
            <div key={kerusakan.id}>
              <p>
                {kerusakan.gejala}
              </p>
            </div>
          )
        })}   */}
      
    </>
  )
}

export default App
