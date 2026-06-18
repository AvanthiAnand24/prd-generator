import { useState } from 'react'
import './App.css'
import ReactMarkdown from 'react-markdown'

function App() {
  const [idea, setIdea] = useState('')
  const [prd, setPrd] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [notionUrl, setNotionUrl] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)


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
        // Server responded with an error status (400, 429, 500 etc)
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setPrd(data.prd)
      setTitle(data.title)
    } catch (err) {
      // This catches network failures - server not running, no internet, etc
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
    <div className="container">
      <h1>PRD Generator</h1>
      <p className="subtitle">Turn a messy idea into a full PRD in seconds</p>

      <textarea
        placeholder="Paste your rough idea here... bullet points, voice note transcript, anything."
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
      />

      <button onClick={generatePRD} disabled={loading || !idea.trim()}>
        {loading ? 'Generating...' : 'Generate PRD →'}
      </button>

      {/* {loading && <p className="loading">⏳ AI is writing your PRD...</p>} */}
      {loading && (
        <div className="loading">
          <span className="spinner"></span>
          AI is writing your PRD...
        </div>
      )}

      {error && <p className="error-message">⚠️ {error}</p>}



      {prd && (
        <div>
          {/* <h2 className="prd-title">{title}</h2> */}
          <div className="export-buttons">
            <button onClick={copyToClipboard} className="copy-btn">
              {copied ? '✓ Copied!' : '📋 Copy Text'}
            </button>

            <button 
              onClick={exportToNotion} 
              disabled={exporting}
              className="notion-btn"
            >
              {exporting ? 'Exporting...' : '📤 Export to Notion'}
            </button>

            {notionUrl && (
              <a href={notionUrl} target="_blank" rel="noreferrer" className="notion-link">
                ✅ Open in Notion →
              </a>
            )}
          </div>

          <div className="prd-output">
            <h2 className="prd-title">{title}</h2>
            <ReactMarkdown>{prd}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}

export default App