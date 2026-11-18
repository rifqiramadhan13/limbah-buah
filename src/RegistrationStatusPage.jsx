import { useState } from 'react'
import { postJson } from './api.js'
import './NewFeatures.css'

function formatSubmittedDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

export default function RegistrationStatusPage({ onHomeClick }) {
  const [registrationCode, setRegistrationCode] = useState(
    new URLSearchParams(window.location.search).get('code') || '',
  )
  const [whatsapp, setWhatsapp] = useState('')
  const [state, setState] = useState({ status: 'idle', error: '', result: null })

  const checkStatus = async (event) => {
    event.preventDefault()
    setState({ status: 'loading', error: '', result: null })
    try {
      const result = await postJson('/api/registration-status', {
        registrationCode,
        whatsapp,
      })
      setState({ status: 'success', error: '', result })
    } catch (error) {
      setState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Status pendaftaran tidak dapat dimuat.',
        result: null,
      })
    }
  }

  return (
    <main className="new-page">
      <header className="new-page-header">
        <div className="page-shell new-page-header-inner">
          <a className="brand" href="/" onClick={onHomeClick} aria-label="Sirkulit, beranda">
            <span className="brand-mark" aria-hidden="true">
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-5V2" />
                <path d="M4 17h5v5" />
                <path d="M5.6 9a7 7 0 0 1 11.7-2L20 9" />
                <path d="M18.4 15a7 7 0 0 1-11.7 2L4 15" />
              </svg>
            </span>
            <span className="brand-name">sir<span>kulit</span><small>EKONOMI SIRKULAR</small></span>
          </a>
          <a className="text-link" href="/" onClick={onHomeClick}>← Kembali ke Beranda</a>
        </div>
      </header>

      <section className="registration-page-section section-pad">
        <div className="page-shell registration-form-shell registration-status-shell">
          <p className="eyebrow"><span className="eyebrow-line" /> LACAK PENDAFTARAN</p>
          <h1>Cek status pendaftaran</h1>
          <p className="registration-intro">
            Masukkan kode registrasi dan nomor WhatsApp yang digunakan saat mendaftar. Kami hanya menampilkan status dan waktu pengajuan.
          </p>

          <form className="new-form" onSubmit={checkStatus}>
            <label className="new-form-field" htmlFor="registration-status-code">
              Kode registrasi
              <input
                autoCapitalize="characters"
                autoComplete="off"
                id="registration-status-code"
                maxLength="20"
                onChange={(event) => setRegistrationCode(event.target.value)}
                required
                spellCheck="false"
                value={registrationCode}
              />
            </label>
            <label className="new-form-field" htmlFor="registration-status-whatsapp">
              Nomor WhatsApp saat mendaftar
              <input
                autoComplete="tel"
                id="registration-status-whatsapp"
                inputMode="tel"
                maxLength="30"
                onChange={(event) => setWhatsapp(event.target.value)}
                required
                type="tel"
                value={whatsapp}
              />
            </label>
            <button className="button button-dark form-submit" disabled={state.status === 'loading'} type="submit">
              {state.status === 'loading' ? 'Memeriksa...' : 'Cek Status'}
            </button>
          </form>

          {state.status === 'error' && (
            <div className="form-feedback form-feedback-error" role="alert">{state.error}</div>
          )}
          {state.result && (
            <section
              aria-live="polite"
              className={`registration-status-result registration-status-${state.result.status}`}
              role="status"
            >
              <p className="eyebrow"><span className="eyebrow-line" /> STATUS PENDAFTARAN</p>
              <h2>{state.result.statusLabel}</h2>
              <p>{state.result.statusMessage}</p>
              <dl>
                <div><dt>Kode registrasi</dt><dd>{state.result.registrationCode}</dd></div>
                {formatSubmittedDate(state.result.createdAt) && (
                  <div><dt>Tanggal pengajuan</dt><dd>{formatSubmittedDate(state.result.createdAt)}</dd></div>
                )}
              </dl>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}
