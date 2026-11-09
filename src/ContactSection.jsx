import { useState } from 'react'
import { CONTACT_CATEGORIES } from '../shared/form-options.js'
import { postJson } from './api.js'
import './NewFeatures.css'

const contactInfo = {
  whatsappNumber: '',
  email: '',
  address: '',
  mapUrl: '',
  instagramUrl: '',
}

function formatWhatsapp(number) {
  return `https://wa.me/${number.replace(/\D/g, '')}`
}

export default function ContactSection() {
  const [state, setState] = useState({ status: 'idle', message: '' })

  const submitMessage = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const formElement = event.currentTarget
    const values = Object.fromEntries(formData.entries())
    setState({ status: 'submitting', message: '' })

    try {
      const result = await postJson(
        `${import.meta.env.VITE_API_BASE_URL || ''}/api/contact-messages`,
        values,
      )

      formElement.reset()
      setState({
        status: 'success',
        message: `Pesan tersimpan. Kode pesan: ${result.messageCode}.`,
      })
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba kembali.',
      })
    }
  }

  return (
    <section className="contact-section section-pad" id="kontak">
      <div className="page-shell">
        <div className="contact-layout">
          <div className="contact-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> KONTAK SIRKULIT</p>
            <h2>Ada Pertanyaan? <em>Hubungi Kami.</em></h2>
            <p>Hubungi pengelola SIRKULIT untuk mendapatkan informasi mengenai pendaftaran limbah, kemitraan pengolahan, maupun penggunaan platform.</p>
            <div className="contact-details">
              <h3>Informasi pengelola</h3>
              {contactInfo.whatsappNumber
                ? <a href={formatWhatsapp(contactInfo.whatsappNumber)} rel="noreferrer" target="_blank">WhatsApp · {contactInfo.whatsappNumber}</a>
                : <span>WhatsApp resmi belum tersedia.</span>}
              {contactInfo.email
                ? <a href={`mailto:${contactInfo.email}`}>Email · {contactInfo.email}</a>
                : <span>Email resmi belum tersedia.</span>}
              {contactInfo.address
                ? contactInfo.mapUrl
                  ? <a href={contactInfo.mapUrl} rel="noreferrer" target="_blank">Alamat pengelola · {contactInfo.address}</a>
                  : <span>Alamat pengelola · {contactInfo.address}</span>
                : <span>Alamat pengelola belum tersedia.</span>}
              {contactInfo.instagramUrl && (
                <a href={contactInfo.instagramUrl} rel="noreferrer" target="_blank">Instagram resmi SIRKULIT</a>
              )}
            </div>
          </div>

          <div className="contact-form-card">
            <h3>Kirim pesan kepada pengelola</h3>
            {state.status === 'success' && <div className="form-feedback form-feedback-success" role="status" aria-live="polite">{state.message}</div>}
            {state.status === 'error' && <div className="form-feedback form-feedback-error" role="alert">{state.message}</div>}
            <form className="new-form contact-form" onSubmit={submitMessage}>
              <label className="new-form-field">
                <span>Nama <span className="required-mark">*</span></span>
                <input autoComplete="name" maxLength="120" name="name" required />
              </label>
              <div className="new-form-grid">
                <label className="new-form-field">
                  <span>Email (opsional)</span>
                  <input autoComplete="email" maxLength="254" name="email" type="email" />
                </label>
                <label className="new-form-field">
                  <span>Nomor WhatsApp (opsional)</span>
                  <input autoComplete="tel" inputMode="tel" maxLength="30" name="whatsapp" />
                </label>
              </div>
              <p className="form-hint">Isi setidaknya email atau nomor WhatsApp agar pengelola dapat membalas.</p>
              <label className="new-form-field">
                <span>Kategori pertanyaan <span className="required-mark">*</span></span>
                <select defaultValue="" name="category" required>
                  <option disabled value="">Pilih kategori</option>
                  {CONTACT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="new-form-field">
                <span>Pesan <span className="required-mark">*</span></span>
                <textarea maxLength="3000" name="message" required rows="4" />
              </label>
              <button className="button button-dark form-submit" disabled={state.status === 'submitting'} type="submit">
                {state.status === 'submitting' ? 'Mengirim...' : 'Kirim Pesan'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
