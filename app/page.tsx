"use client"
import VideoCaptionEditor from "@/components/video-caption-editor"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Video Caption Editor</h1>
      <VideoCaptionEditor />
    </main>
  )
}

