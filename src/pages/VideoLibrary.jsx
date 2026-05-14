// src/pages/VideoLibrary.jsx
// FIX: date crash, empty states, loading skeletons, category filter, toast feedback

import { useEffect, useState, useCallback } from 'react'
import { Play, CheckCircle2, Video, Loader2, X, UploadCloud } from 'lucide-react'
import { useAuth }     from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import {
  subscribeToVideos,
  subscribeToVideosByCategory,
  recordVideoProgress,
  getUserVideoProgress,
  deleteVideo,
  VIDEO_CATEGORIES,
} from '../firebase/firestore'
import VideoUploadForm from '../components/videos/VideoUploadForm'

// FIX: safe date formatting — handles Firestore Timestamp, seconds object, or string
function formatVideoDate(createdAt) {
  if (!createdAt) return ''
  try {
    const date = createdAt?.toDate
      ? createdAt.toDate()
      : new Date((createdAt.seconds || 0) * 1000)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return ''
  }
}

// Extract a YouTube/Vimeo embed URL from a share URL
function toEmbedUrl(url) {
  if (!url) return ''
  // Already an embed URL
  if (url.includes('/embed/')) return url
  // YouTube watch URL
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`
  return url
}

// Loading skeleton
function VideoSkeleton() {
  return (
    <div className="dash-card animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-56 h-36 rounded-xl flex-shrink-0" style={{ background: 'var(--bg-hover)' }} />
        <div className="flex-1 space-y-3 py-2">
          <div className="h-3 rounded-full w-20"  style={{ background: 'var(--bg-hover)' }} />
          <div className="h-4 rounded-full w-3/4" style={{ background: 'var(--bg-hover)' }} />
          <div className="h-3 rounded-full w-full"style={{ background: 'var(--bg-hover)' }} />
          <div className="h-3 rounded-full w-2/3" style={{ background: 'var(--bg-hover)' }} />
        </div>
      </div>
    </div>
  )
}

// Toast (inline, no library)
function Toast({ message, type }) {
  if (!message) return null
  return (
    <div
      className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium"
      style={{
        background: type === 'error' ? '#fee2e2' : 'color-mix(in srgb, var(--accent2) 15%, var(--bg-card))',
        color:      type === 'error' ? '#b91c1c' : 'var(--accent2)',
        border:     `1px solid ${type === 'error' ? '#fca5a5' : 'color-mix(in srgb, var(--accent2) 30%, transparent)'}`,
      }}
    >
      {message}
    </div>
  )
}

export default function VideoLibrary() {
  const { user, canUploadVideo, isAdmin } = useAuth()
  const { t } = useLanguage()

  const [videos,        setVideos]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [progressMap,   setProgressMap]   = useState({})
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [showUpload,    setShowUpload]    = useState(false)
  const [toastMsg,      setToastMsg]      = useState('')
  const [toastType,     setToastType]     = useState('success')

  const showToast = useCallback((msg, type = 'success') => {
    setToastMsg(msg); setToastType(type)
    setTimeout(() => setToastMsg(''), 3500)
  }, [])

  // Real-time video subscription, switches on category
  useEffect(() => {
    setLoading(true)
    let unsub
    if (activeCategory === 'All') {
      unsub = subscribeToVideos(data => { setVideos(data); setLoading(false) })
    } else {
      unsub = subscribeToVideosByCategory(activeCategory, data => { setVideos(data); setLoading(false) })
    }
    return unsub
  }, [activeCategory])

  // Load watch progress once
  useEffect(() => {
    if (!user) return
    getUserVideoProgress(user.uid).then(results => {
      setProgressMap(results.reduce((acc, item) => ({ ...acc, [item.videoId]: item }), {}))
    })
  }, [user])

  async function handleSelect(video) {
    setSelectedVideo(video)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (user && !progressMap[video.id]?.completed) {
      await recordVideoProgress(user.uid, video.id, 20, false)
      setProgressMap(prev => ({ ...prev, [video.id]: { ...prev[video.id], progress: 20, completed: false } }))
    }
  }

  async function handleMarkComplete(video) {
    if (!user) return
    await recordVideoProgress(user.uid, video.id, 100, true)
    setProgressMap(prev => ({ ...prev, [video.id]: { videoId: video.id, progress: 100, completed: true } }))
    showToast('Video marked as complete 🙌')
  }

  async function handleDelete(videoId) {
    if (!window.confirm('Delete this video?')) return
    try {
      await deleteVideo(videoId)
      if (selectedVideo?.id === videoId) setSelectedVideo(null)
      showToast('Video deleted.')
    } catch {
      showToast('Could not delete video.', 'error')
    }
  }

  const allCategories = ['All', ...VIDEO_CATEGORIES]

  return (
    <div className="space-y-6">
      <Toast message={toastMsg} type={toastType} />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-h)' }}>
            {t('videoLibrary')}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-m)' }}>
            {t('videoIntro')}
          </p>
        </div>
        {canUploadVideo && (
          <button onClick={() => setShowUpload(s => !s)} className="btn-primary flex-shrink-0">
            <UploadCloud size={15} />
            {showUpload ? 'Cancel' : t('uploadVideo')}
          </button>
        )}
      </div>

      {/* Upload form */}
      {showUpload && canUploadVideo && (
        <VideoUploadForm
          user={user}
          onUpload={video => {
            setVideos(v => [video, ...v])
            setShowUpload(false)
            showToast('Video added to library 🎬')
          }}
        />
      )}

      {/* Player */}
      {selectedVideo && (
        <div className="dash-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                {t('nowPlaying')}
              </p>
              <h3 className="font-display font-bold text-xl mt-0.5" style={{ color: 'var(--text-h)' }}>
                {selectedVideo.title}
              </h3>
            </div>
            <button
              onClick={() => setSelectedVideo(null)}
              className="p-2 rounded-xl"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-m)' }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="aspect-video overflow-hidden rounded-xl" style={{ background: '#000' }}>
            <iframe
              className="w-full h-full"
              src={toEmbedUrl(selectedVideo.videoUrl)}
              title={selectedVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            {progressMap[selectedVideo.id]?.completed ? (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--accent2)' }}>
                <CheckCircle2 size={16} /> {t('completed')}
              </div>
            ) : (
              <button onClick={() => handleMarkComplete(selectedVideo)} className="btn-primary">
                <CheckCircle2 size={15} /> {t('markComplete')}
              </button>
            )}
            <p className="text-sm self-center" style={{ color: 'var(--text-m)' }}>
              {selectedVideo.description}
            </p>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {allCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: activeCategory === cat ? 'var(--accent)' : 'var(--bg-hover)',
              color:      activeCategory === cat ? '#fff'          : 'var(--text-b)',
              border:     `1px solid ${activeCategory === cat ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Video list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <VideoSkeleton key={i} />)}
        </div>
      ) : videos.length === 0 ? (
        <div className="dash-card flex flex-col items-center justify-center py-16 text-center gap-3">
          <Video size={40} style={{ color: 'var(--text-m)', opacity: 0.4 }} />
          <div>
            <p className="font-display font-semibold text-lg" style={{ color: 'var(--text-h)' }}>
              No videos yet
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-m)' }}>
              {activeCategory !== 'All'
                ? `No ${activeCategory} videos yet.`
                : 'Video content will appear here once added.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map(video => {
            const progress   = progressMap[video.id]
            const isSelected = selectedVideo?.id === video.id

            return (
              <div
                key={video.id}
                className="dash-card"
                style={isSelected ? { border: '1px solid var(--accent)' } : {}}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Thumbnail */}
                  <div
                    className="relative flex-shrink-0 w-full sm:w-56 h-36 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group"
                    style={{ background: 'var(--bg-hover)' }}
                    onClick={() => handleSelect(video)}
                  >
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <Video size={32} style={{ color: 'var(--text-m)', opacity: 0.4 }} />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                        <Play size={16} style={{ color: '#000', marginLeft: 2 }} />
                      </div>
                    </div>
                    {progress?.completed && (
                      <div
                        className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1"
                        style={{ background: 'var(--accent2)', color: '#fff' }}
                      >
                        <CheckCircle2 size={10} /> Done
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                          color:      'var(--accent)',
                        }}
                      >
                        {video.category}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-m)' }}>
                        {formatVideoDate(video.createdAt)}
                      </span>
                    </div>

                    <h3 className="font-display font-semibold text-lg leading-tight" style={{ color: 'var(--text-h)' }}>
                      {video.title}
                    </h3>
                    <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--text-b)' }}>
                      {video.description}
                    </p>

                    {/* Progress bar */}
                    {progress && !progress.completed && (
                      <div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${progress.progress || 0}%` }} />
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-m)' }}>
                          {progress.progress || 0}% watched
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button onClick={() => handleSelect(video)} className="btn-primary text-xs py-2 px-4">
                        <Play size={13} /> {t('watchNow')}
                      </button>
                      {!progress?.completed && (
                        <button onClick={() => handleMarkComplete(video)} className="btn-secondary text-xs py-2 px-4">
                          <CheckCircle2 size={13} /> {t('markComplete')}
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="text-xs py-2 px-3 rounded-xl transition-all"
                          style={{ color: 'var(--text-m)', background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-m)' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
