import React from 'react'
import './App.css'
import VideoPlayer from './components/VideoPlayer'

export default function App() {
  return (
    <div id="root">
      <h1>Learning Portal — Video Player</h1>
      <p>Student-friendly demo with bookmark support and screenshot deterrents.</p>

      <VideoPlayer
        id="bigbuck"
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        poster="https://peach.blender.org/wp-content/uploads/title_anouncement.jpg?x11217"
      />
    </div>
  )
}
