import { useState } from 'react'
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

        <p className="input-label">Your idea</p>

        <div className="textarea-wrapper">
          <textarea
            placeholder="Paste your rough idea here — bullet points, voice note transcript, anything."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
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
