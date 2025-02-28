"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Plus, Play, Pause } from "lucide-react"
import { formatTime } from "@/lib/utils"

interface Caption {
  id: string
  startTime: number
  endTime: number
  text: string
}

export default function VideoCaptionEditor() {
  const [videoUrl, setVideoUrl] = useState("")
  const [captions, setCaptions] = useState<Caption[]>([])
  const [currentCaption, setCurrentCaption] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [showUrlInput, setShowUrlInput] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Handle video time update
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
    }
  }, [])

  // Handle play/pause
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      setVideoError(null)
      const playPromise = video.play()

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Error playing video:", error.message)
          setIsPlaying(false)

          if (error.name === "NotSupportedError") {
            setVideoError("This video format is not supported by your browser. Try a different video or browser.")
          } else if (error.name === "NotAllowedError") {
            setVideoError("Autoplay is blocked. Please interact with the video player first.")
          } else {
            setVideoError("Could not play the video. Please check if the URL is correct and accessible.")
          }
        })
      }
    } else {
      video.pause()
    }
  }, [isPlaying])

  // Find current caption to display
  const currentDisplayCaption = captions.find(
    (caption) => currentTime >= caption.startTime && currentTime <= caption.endTime,
  )

  // Add a new caption
  const addCaption = () => {
    if (!currentCaption.trim()) return

    const newCaption: Caption = {
      id: Date.now().toString(),
      startTime: currentTime,
      endTime: currentTime + 5, // Default 5 seconds duration
      text: currentCaption,
    }

    setCaptions([...captions, newCaption])
    setCurrentCaption("")
  }

  // Delete a caption
  const deleteCaption = (id: string) => {
    setCaptions(captions.filter((caption) => caption.id !== id))
  }

  // Update caption start time
  const updateStartTime = (id: string, time: number) => {
    setCaptions(captions.map((caption) => (caption.id === id ? { ...caption, startTime: time } : caption)))
  }

  // Update caption end time
  const updateEndTime = (id: string, time: number) => {
    setCaptions(captions.map((caption) => (caption.id === id ? { ...caption, endTime: time } : caption)))
  }

  // Update caption text
  const updateCaptionText = (id: string, text: string) => {
    setCaptions(captions.map((caption) => (caption.id === id ? { ...caption, text } : caption)))
  }

  // Set current time to start time for a caption
  const setStartTimeToCurrentTime = (id: string) => {
    updateStartTime(id, currentTime)
  }

  // Set current time to end time for a caption
  const setEndTimeToCurrentTime = (id: string) => {
    updateEndTime(id, currentTime)
  }

  // Check if a URL is valid
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Video Preview Section */}
      <div className="space-y-4">
        {showUrlInput ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Enter Video URL</h2>
                <Input
                  type="url"
                  placeholder="https://example.com/video.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <div className="text-sm text-muted-foreground">
                  Try these sample videos:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>
                      <button
                        className="text-primary hover:underline"
                        onClick={() => {
                          setVideoUrl("https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4")
                          setVideoError(null)
                        }}
                      >
                        Big Buck Bunny
                      </button>
                    </li>
                    <li>
                      <button
                        className="text-primary hover:underline"
                        onClick={() => {
                          setVideoUrl("https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4")
                          setVideoError(null)
                        }}
                      >
                        Elephants Dream
                      </button>
                    </li>
                    <li>
                      <button
                        className="text-primary hover:underline"
                        onClick={() => {
                          setVideoUrl("https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4")
                          setVideoError(null)
                        }}
                      >
                        For Bigger Blazes
                      </button>
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={() => setShowUrlInput(false)}
                  disabled={!videoUrl || !isValidUrl(videoUrl)}
                  className="w-full"
                >
                  Load Video
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full"
                onEnded={() => setIsPlaying(false)}
                controls={false}
                crossOrigin="anonymous"
                onLoadStart={() => {
                  setIsLoading(true)
                  setVideoError(null)
                }}
                onLoadedData={() => {
                  setIsLoading(false)
                  setVideoError(null)
                }}
                onError={(e) => {
                  setIsLoading(false)
                  const video = e.currentTarget as HTMLVideoElement
                  let errorMessage = "Could not load the video. Please check the URL and try again."

                  if (video.error) {
                    switch (video.error.code) {
                      case 1:
                        errorMessage = "Video loading was aborted."
                        break
                      case 2:
                        errorMessage = "A network error occurred while loading the video."
                        break
                      case 3:
                        errorMessage = "The video format is not supported by your browser."
                        break
                      case 4:
                        errorMessage = "The video format or source is not supported."
                        break
                    }
                  }

                  setVideoError(errorMessage)
                  setIsPlaying(false)
                }}
              >
                <source src={videoUrl} type="video/mp4" />
                <source src={videoUrl} type="video/webm" />
                <source src={videoUrl} type="video/ogg" />
                Your browser does not support the video tag.
              </video>

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="bg-card p-4 rounded-md">
                    <p className="text-center">Loading video...</p>
                  </div>
                </div>
              )}

              {videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="bg-card p-4 rounded-md max-w-xs text-center">
                    <p className="text-destructive font-medium">{videoError}</p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => {
                        setShowUrlInput(true)
                        setVideoError(null)
                      }}
                    >
                      Try Another URL
                    </Button>
                  </div>
                </div>
              )}

              {!isLoading && !videoError && currentDisplayCaption && (
                <div className="absolute bottom-16 left-0 right-0 text-center">
                  <div className="inline-block bg-black/70 text-white px-4 py-2 rounded-md text-lg font-medium">
                    {currentDisplayCaption.text}
                  </div>
                </div>
              )}

              {!isLoading && !videoError && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">Current Time: {formatTime(currentTime)}</div>
              <Button variant="outline" size="sm" onClick={() => setShowUrlInput(true)}>
                Change Video
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Caption Editor Section */}
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Add New Caption</h2>
            <div className="space-y-4">
              <Textarea
                placeholder="Enter caption text"
                value={currentCaption}
                onChange={(e) => setCurrentCaption(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="text-sm">
                Caption will start at: <span className="font-medium">{formatTime(currentTime)}</span>
              </div>
              <Button onClick={addCaption} disabled={!currentCaption.trim() || !videoUrl} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Caption at Current Time
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Captions ({captions.length})</h2>
          {captions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No captions added yet. Add your first caption above.
            </p>
          ) : (
            captions.map((caption) => (
              <Card key={caption.id} className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Textarea
                      value={caption.text}
                      onChange={(e) => updateCaptionText(caption.id, e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-sm mb-1">Start Time</div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={caption.startTime.toFixed(1)}
                            onChange={(e) => updateStartTime(caption.id, Number.parseFloat(e.target.value))}
                          />
                          <Button variant="outline" size="sm" onClick={() => setStartTimeToCurrentTime(caption.id)}>
                            Set
                          </Button>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm mb-1">End Time</div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={caption.endTime.toFixed(1)}
                            onChange={(e) => updateEndTime(caption.id, Number.parseFloat(e.target.value))}
                          />
                          <Button variant="outline" size="sm" onClick={() => setEndTimeToCurrentTime(caption.id)}>
                            Set
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Duration: {(caption.endTime - caption.startTime).toFixed(1)}s
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => deleteCaption(caption.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

