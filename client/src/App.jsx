import { useState, useRef } from 'react'
import './App.css'
import ReactMarkdown from 'react-markdown'

const exampleIdeas = [
  {
    label: 'AI note-taking app',
    text: 'An AI-powered note-taking app that automatically organizes notes by topic, extracts action items, and surfaces relevant past notes when you start a new meeting.'
  },
  {
    label: 'Smart calendar',
    text: 'A calendar that detects scheduling conflicts, suggests reschedule times based on everyone\'s availability, and sends Slack messages when a meeting moves.'
  },
  {
    label: 'Freelancer marketplace',
    text: 'A marketplace connecting freelance designers and developers with early-stage startups. Features portfolio showcases, milestone-based payments, and a matching algorithm.'
  }
]

function App() {
  const [idea, setIdea] = useState('')
  const [prd, setPrd] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [notionUrl, setNotionUrl] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/extract`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to process the file.')
        return
      }
      setIdea(data.text)
      setUploadedFile(file.name)
      setPrd('')
      setNotionUrl('')
    } catch (err) {
      setError('Could not reach the server. Please check your connection.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function removeUploadedFile() {
    setUploadedFile(null)
    setIdea('')
  }

  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition
    transcriptRef.current = ''

    recognition.onresult = (event) => {
      let final = ''
      let interim = ''
      for (let i = 0; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        event.results[i].isFinal ? (final += text + ' ') : (interim += text)
      }
      transcriptRef.current = final
      setIdea((final + interim).trim())
      setUploadedFile(null)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        setError(`Microphone error: ${event.error}. Please allow microphone access and try again.`)
      }
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
      if (transcriptRef.current.trim()) {
        setIdea(transcriptRef.current.trim())
      }
    }

    recognition.start()
    setIsRecording(true)
    setError('')
  }

  async function generatePRD() {
    if (!idea.trim()) return
    setLoading(true)
    setPrd('')
    setError('')
    setNotionUrl('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setPrd(data.prd)
      setTitle(data.title)
    } catch (err) {
      setError('Could not reach the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function exportToNotion() {
    setExporting(true)
    setError('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/export-notion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prd,
          title: title || 'Generated PRD'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to export to Notion.')
        return
      }

      setNotionUrl(data.url)
    } catch (err) {
      setError('Could not reach the server to export. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  function fillExample(text) {
    setIdea(text)
    setError('')
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(prd)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError('Could not copy to clipboard.')
    }
  }

  return (
    <div className="app-layout">

      {/* ── Left Panel ── */}
      <div className="left-panel">

        <div className="wordmark">
          <span className="wordmark-dot"></span>
          <span className="wordmark-text">PRD Generator</span>
        </div>
        <p className="tagline">Turn rough ideas into structured specs</p>

        <hr className="panel-divider" />

        <div className="input-label-row">
          <p className="input-label">Your idea</p>

          {uploading ? (
            <span className="upload-status"><span className="spinner upload-spinner"></span>Extracting…</span>
          ) : isRecording ? (
            <button className="recording-stop" onClick={toggleRecording}>
              <span className="recording-dot"></span>Stop
            </button>
          ) : uploadedFile ? (
            <span className="file-badge">
              <span className="file-badge-name">{uploadedFile}</span>
              <button className="file-remove" onClick={removeUploadedFile}>×</button>
            </span>
          ) : (
            <div className="input-label-actions">
              <button className="mic-trigger" onClick={toggleRecording}>Voice</button>
              <span className="input-action-divider"></span>
              <button className="upload-trigger" onClick={() => fileInputRef.current?.click()}>Upload file</button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.docx,.mp3,.wav,.m4a,.ogg,.flac,.webm"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>

        <div className="textarea-wrapper">
          <textarea
            placeholder="Paste your rough idea here — bullet points, voice note transcript, anything."
            value={idea}
            onChange={(e) => { setIdea(e.target.value); if (uploadedFile) setUploadedFile(null) }}
            maxLength={5000}
          />
          <p className={`char-count${idea.length > 4500 ? ' near-limit' : ''}`}>
            {idea.length} / 5000
          </p>
        </div>

        <button
          className="generate-btn"
          onClick={generatePRD}
          disabled={loading || !idea.trim()}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Generating…
            </>
          ) : (
            'Generate PRD'
          )}
        </button>

        {error && <p className="error-message">{error}</p>}

      </div>

      {/* ── Right Panel ── */}
      <div className="right-panel">

        {!prd ? (
          <div className="empty-state">
            <div className="empty-state-inner">

              <div>
                <p className="how-label">How it works</p>
                <div className="steps">
                  <div className="step">
                    <span className="step-num">1</span>
                    <div>
                      <p className="step-title">Describe your idea</p>
                      <p className="step-desc">Rough notes, bullet points, or a voice transcript — anything works</p>
                    </div>
                  </div>
                  <div className="step">
                    <span className="step-num">2</span>
                    <div>
                      <p className="step-title">Generate your PRD</p>
                      <p className="step-desc">AI structures it into a 9-section product requirements document</p>
                    </div>
                  </div>
                  <div className="step">
                    <span className="step-num">3</span>
                    <div>
                      <p className="step-title">Export to Notion</p>
                      <p className="step-desc">Push the formatted PRD to your workspace in one click</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="examples-label">Or try an example</p>
                <div className="example-chips">
                  {exampleIdeas.map((ex, i) => (
                    <button key={i} className="example-chip" onClick={() => fillExample(ex.text)}>
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="prd-panel-content">
            <div className="prd-output">

              <div className="card-actions">
                <button
                  onClick={copyToClipboard}
                  className={`copy-btn${copied ? ' copied' : ''}`}
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>

                {!notionUrl ? (
                  <button
                    onClick={exportToNotion}
                    disabled={exporting}
                    className="notion-btn"
                  >
                    {exporting ? 'Exporting…' : 'Export to Notion'}
                  </button>
                ) : (
                  <a href={notionUrl} target="_blank" rel="noreferrer" className="notion-link">
                    Open in Notion
                  </a>
                )}
              </div>

              <h2 className="prd-title">{title}</h2>
              <ReactMarkdown>{prd}</ReactMarkdown>

            </div>
          </div>
        )}

      </div>

    </div>
  )
}

export default App
