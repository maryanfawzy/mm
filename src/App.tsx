import React, { useState, useEffect, useRef } from 'react'

interface ImageData {
  id: string
  name: string
  src: string
  size: number
  uploadDate: string
}

const App: React.FC = () => {
  const [images, setImages] = useState<ImageData[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  const [dragActive, setDragActive] = useState<boolean>(false)
  const [uploading, setUploading] = useState<boolean>(false)
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedImages = localStorage.getItem('gallery-images')
    if (savedImages) {
      try {
        setImages(JSON.parse(savedImages))
      } catch (error) {
        console.error('Error loading images:', error)
      }
    }
    
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('gallery-images', JSON.stringify(images))
  }, [images])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light')
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    
    try {
      const fileArray = Array.from(files)
      const newImages: ImageData[] = []
      
      for (const file of fileArray) {
        if (file.type.startsWith('image/')) {
          const base64 = await fileToBase64(file)
          const imageData: ImageData = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            name: file.name.replace(/\.[^/.]+$/, ""),
            src: base64,
            size: file.size,
            uploadDate: new Date().toISOString()
          }
          newImages.push(imageData)
        }
      }
      
      setImages(prev => [...prev, ...newImages])
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const deleteImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
    setShowDeleteConfirm(null)
  }

  const filteredImages = images.filter(image =>
    image.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'dark' : ''}`}>
      {/* Background */}
      <div className="fixed inset-0 gradient-bg -z-10" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-0 border-b border-white/20 rounded-none backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">📷</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Clean Gallery</h1>
            </div>
            
            <button
              onClick={toggleTheme}
              className="glass-card p-3 text-white hover:text-blue-300 rounded-lg transition-all hover:scale-110"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center py-12">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Welcome to Clean Gallery
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            A simple, beautiful image gallery built with React and TypeScript.
          </p>
        </section>

        {/* Search Bar */}
        <section className="max-w-2xl mx-auto">
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">🔍</span>
            <input
              type="text"
              placeholder="Search your images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass-card text-white placeholder:text-white/60 border-0 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </section>

        {/* Upload Section */}
        <section className="glass-card p-8">
          <h3 className="text-2xl font-semibold text-white mb-6 text-center">Upload Your Images</h3>
          
          <div
            className={`relative p-12 rounded-2xl text-center transition-all duration-300 border-2 border-dashed ${
              dragActive ? 'border-white/50 bg-white/10' : 'border-white/30 bg-white/5'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            
            {uploading ? (
              <div className="space-y-4">
                <div className="loading-spinner mx-auto" />
                <p className="text-white/80">Uploading images...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-2xl">
                  📤
                </div>
                <div>
                  <p className="text-xl text-white mb-2">Drag & drop your images here</p>
                  <p className="text-white/60 mb-4">or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="glass-card px-8 py-3 text-white font-medium rounded-lg hover:bg-white/20 transition-all"
                  >
                    Choose Files
                  </button>
                </div>
                <p className="text-sm text-white/50">
                  Supports: JPG, PNG, GIF, WebP
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Image Gallery */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-white">
              Your Gallery {filteredImages.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-sm">
                  {filteredImages.length}
                </span>
              )}
            </h3>
          </div>

          {filteredImages.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-6 text-4xl">
                🖼️
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? 'No images found' : 'No images yet'}
              </h4>
              <p className="text-white/60">
                {searchTerm 
                  ? `No images match "${searchTerm}"`
                  : 'Upload your first image to get started!'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredImages.map((image) => (
                <div key={image.id} className="image-card glass-card overflow-hidden">
                  <div className="relative group">
                    <img
                      src={image.src}
                      alt={image.name}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                    
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setSelectedImage(image)}
                        className="glass-card p-2 text-white hover:text-blue-300 rounded"
                        title="View"
                      >
                        👁️
                      </button>
                      
                      <button
                        onClick={() => setShowDeleteConfirm(image.id)}
                        className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded transition-colors"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="text-white font-medium truncate">{image.name}</h4>
                    <p className="text-white/70 text-sm">{formatFileSize(image.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="glass-card max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">{selectedImage.name}</h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="glass-card p-2 text-white hover:text-red-300 rounded"
                >
                  ❌
                </button>
              </div>
              <img
                src={selectedImage.src}
                alt={selectedImage.name}
                className="max-w-full max-h-[60vh] object-contain mx-auto mb-4"
              />
              <div className="grid grid-cols-2 gap-4 text-sm text-white/80">
                <div><span className="font-medium">Size:</span> {formatFileSize(selectedImage.size)}</div>
                <div><span className="font-medium">Uploaded:</span> {new Date(selectedImage.uploadDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="glass-card max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white mb-2">Delete Image</h3>
            <p className="text-white/80 mb-6">
              Are you sure you want to delete this image? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="glass-card px-4 py-2 text-white rounded flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteImage(showDeleteConfirm)}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 text-white rounded flex-1 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

