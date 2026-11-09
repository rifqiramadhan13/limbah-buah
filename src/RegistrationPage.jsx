import { useState } from 'react'
import {
  FRUIT_TYPES,
  PRODUCTION_FREQUENCIES,
  WASTE_CONDITIONS,
  WASTE_PRODUCER_TYPES,
} from '../shared/form-options.js'
import { postJson } from './api.js'
import './NewFeatures.css'

const initialForm = {
  fullName: '',
  businessName: '',
  whatsapp: '',
  email: '',
  producerType: '',
  province: '',
  city: '',
  district: '',
  village: '',
  address: '',
  fruitType: '',
  quantityKg: '',
  productionFrequency: '',
  wasteCondition: '',
  notes: '',
  consent: false,
}

function Field({ label, name, required = false, children }) {
  return (
    <label className="new-form-field">
      <span>{label}{required && <span className="required-mark"> *</span>}</span>
      {children || (
        <input autoComplete="on" name={name} required={required} />
      )}
    </label>
  )
}

function SelectField({ label, name, options, onChange, required = false }) {
  return (
    <Field label={label} name={name} required={required}>
      <select defaultValue="" name={name} onChange={onChange} required={required}>
        <option disabled value="">Pilih {label.toLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </Field>
  )
}

export default function RegistrationPage({ onHomeClick }) {
  const [form, setForm] = useState(initialForm)
  const [state, setState] = useState({ status: 'idle', message: '', registrationCode: '' })

  const updateField = (event) => {
    const { name, type, value, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const submitForm = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    setState({ status: 'submitting', message: '', registrationCode: '' })

    try {
      const result = await postJson(
        `${import.meta.env.VITE_API_BASE_URL || ''}/api/waste-registrations`,
        form,
      )

      setState({
        status: 'success',
        message: 'Data Anda tersimpan dan akan ditinjau oleh pengelola SIRKULIT.',
        registrationCode: result.registrationCode,
      })
      setForm(initialForm)
      formElement.reset()
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba kembali.',
        registrationCode: '',
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
        <div className="page-shell registration-form-shell">
          <p className="eyebrow"><span className="eyebrow-line" /> PENDAFTARAN PENYALURAN</p>
          <h1>Daftarkan Limbah Kulit Buah</h1>
          <p className="registration-intro">Lengkapi informasi berikut agar pengelola dapat meninjau dan menghubungkan Anda dengan mitra pengolah yang sesuai.</p>

          {state.status === 'success' && (
            <div className="form-feedback form-feedback-success" role="status" aria-live="polite">
              <strong>Pendaftaran berhasil dikirim.</strong>
              <span>{state.message}</span>
              <span>Kode registrasi: <b>{state.registrationCode}</b> · Status: Menunggu Peninjauan</span>
            </div>
          )}
          {state.status === 'error' && (
            <div className="form-feedback form-feedback-error" role="alert">{state.message}</div>
          )}

          <form className="new-form" onSubmit={submitForm}>
            <fieldset>
              <legend>Identitas Pendaftar</legend>
              <div className="new-form-grid">
                <Field label="Nama lengkap" name="fullName" required>
                  <input autoComplete="name" maxLength="120" name="fullName" onChange={updateField} required value={form.fullName} />
                </Field>
                <Field label="Nama usaha/instansi" name="businessName">
                  <input autoComplete="organization" maxLength="160" name="businessName" onChange={updateField} value={form.businessName} />
                </Field>
                <Field label="Nomor WhatsApp" name="whatsapp" required>
                  <input autoComplete="tel" inputMode="tel" maxLength="30" name="whatsapp" onChange={updateField} required value={form.whatsapp} />
                </Field>
                <Field label="Email (opsional)" name="email">
                  <input autoComplete="email" maxLength="254" name="email" onChange={updateField} type="email" value={form.email} />
                </Field>
                <SelectField label="Jenis penghasil limbah" name="producerType" onChange={updateField} options={WASTE_PRODUCER_TYPES} required />
              </div>
            </fieldset>

            <fieldset>
              <legend>Lokasi</legend>
              <div className="new-form-grid">
                <Field label="Provinsi" name="province" required>
                  <input autoComplete="address-level1" maxLength="100" name="province" onChange={updateField} required value={form.province} />
                </Field>
                <Field label="Kabupaten/Kota" name="city" required>
                  <input autoComplete="address-level2" maxLength="100" name="city" onChange={updateField} required value={form.city} />
                </Field>
                <Field label="Kecamatan" name="district" required>
                  <input maxLength="100" name="district" onChange={updateField} required value={form.district} />
                </Field>
                <Field label="Desa/Kelurahan" name="village" required>
                  <input maxLength="100" name="village" onChange={updateField} required value={form.village} />
                </Field>
                <Field label="Alamat lengkap" name="address" required>
                  <textarea autoComplete="street-address" maxLength="500" name="address" onChange={updateField} required rows="3" value={form.address} />
                </Field>
              </div>
            </fieldset>

            <fieldset>
              <legend>Informasi Limbah</legend>
              <div className="new-form-grid">
                <SelectField label="Jenis kulit buah" name="fruitType" onChange={updateField} options={FRUIT_TYPES} required />
                <Field label="Jumlah limbah (kg)" name="quantityKg" required>
                  <input inputMode="decimal" min="0.01" name="quantityKg" onChange={updateField} required step="0.01" type="number" value={form.quantityKg} />
                </Field>
                <SelectField label="Frekuensi produksi" name="productionFrequency" onChange={updateField} options={PRODUCTION_FREQUENCIES} required />
                <SelectField label="Kondisi limbah" name="wasteCondition" onChange={updateField} options={WASTE_CONDITIONS} required />
                <Field label="Keterangan tambahan (opsional)" name="notes">
                  <textarea maxLength="1000" name="notes" onChange={updateField} rows="3" value={form.notes} />
                </Field>
              </div>
            </fieldset>

            <label className="consent-field">
              <input checked={form.consent} name="consent" onChange={updateField} required type="checkbox" />
              <span>Saya menyetujui penggunaan data ini oleh pengelola SIRKULIT untuk meninjau pendaftaran dan menghubungi saya terkait penyaluran limbah.</span>
            </label>

            <button className="button button-dark form-submit" disabled={state.status === 'submitting'} type="submit">
              {state.status === 'submitting' ? 'Mengirim...' : 'Kirim Pendaftaran'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
