import { useState } from 'react'
import {
  ECOSYSTEM_ROLES,
  FRUIT_TYPES,
  ORGANIC_PRODUCTS,
  PRODUCTION_FREQUENCIES,
  WASTE_CONDITIONS,
  WASTE_PRODUCER_TYPES,
} from '../shared/form-options.js'
import { postJson } from './api.js'
import LocationPicker from './LocationPicker.jsx'
import './NewFeatures.css'

const initialForm = {
  role: 'supplier',
  fullName: '',
  businessName: '',
  whatsapp: '',
  email: '',
  producerType: '',
  processingType: '',
  province: '',
  city: '',
  district: '',
  village: '',
  address: '',
  latitude: null,
  longitude: null,
  locationConfirmed: false,
  mapConsent: false,
  wasteTypes: [],
  productTypes: [],
  productType: '',
  quantityKg: '',
  capacityKg: '',
  frequency: '',
  wasteCondition: '',
  notes: '',
  consent: false,
  directoryConsent: false,
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

function SelectField({ label, name, options, onChange, value, required = false }) {
  return (
    <Field label={label} name={name} required={required}>
      <select name={name} onChange={onChange} required={required} value={value}>
        <option disabled value="">Pilih {label.toLowerCase()}</option>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.role
          const optionLabel = typeof option === 'string' ? option : option.label
          return <option key={optionValue} value={optionValue}>{optionLabel}</option>
        })}
      </select>
    </Field>
  )
}

function MultiSelectField({ label, name, options, onChange, selected }) {
  return (
    <fieldset className="multi-option-field">
      <legend>{label} <span className="required-mark">*</span></legend>
      <div className="multi-option-grid">
        {options.map((option) => (
          <label className="multi-option" key={option}>
            <input
              checked={selected.includes(option)}
              name={name}
              onChange={onChange}
              type="checkbox"
              value={option}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function RegistrationPage({ onHomeClick }) {
  const searchRole = new URLSearchParams(window.location.search).get('role')
  const [form, setForm] = useState({
    ...initialForm,
    role: Object.hasOwn(ECOSYSTEM_ROLES, searchRole) ? searchRole : initialForm.role,
  })
  const [state, setState] = useState({ status: 'idle', message: '', registrationCode: '' })
  const [locationState, setLocationState] = useState({ status: 'idle', message: '', formattedAddress: '' })

  const updateField = (event) => {
    const { name, type, value, checked } = event.target
    const addressFields = ['province', 'city', 'district', 'village', 'address']
    setForm((current) => {
      const updated = { ...current, [name]: type === 'checkbox' ? checked : value }
      if (addressFields.includes(name)) {
        updated.latitude = null
        updated.longitude = null
        updated.locationConfirmed = false
      }
      if (type === 'checkbox' && Array.isArray(current[name])) {
        return {
          ...current,
          [name]: checked
            ? [...current[name], value]
            : current[name].filter((item) => item !== value),
        }
      }
      return updated
    })
    if (addressFields.includes(name)) {
      setLocationState({ status: 'idle', message: '', formattedAddress: '' })
    }
  }

  const completeAddress = [
    form.address,
    form.village,
    form.district,
    form.city,
    form.province,
    'Indonesia',
  ].filter(Boolean).join(', ')

  const verifyAddress = async () => {
    if (!form.address || !form.village || !form.district || !form.city || !form.province) {
      setLocationState({
        status: 'error',
        message: 'Lengkapi alamat, desa/kelurahan, kecamatan, kota/kabupaten, dan provinsi terlebih dahulu.',
        formattedAddress: '',
      })
      return
    }

    setLocationState({ status: 'loading', message: 'Memverifikasi alamat dengan Google Maps...', formattedAddress: '' })
    try {
      const result = await postJson('/api/ecosystem/geocode', { address: completeAddress })
      setForm((current) => ({
        ...current,
        latitude: result.latitude,
        longitude: result.longitude,
        locationConfirmed: true,
      }))
      setLocationState({
        status: 'success',
        message: 'Alamat terverifikasi Google Maps. Periksa titik pada peta sebelum menyimpan.',
        formattedAddress: result.formattedAddress,
      })
    } catch (error) {
      setLocationState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Alamat tidak dapat diverifikasi. Pilih titik secara manual pada peta.',
        formattedAddress: '',
      })
    }
  }

  const selectLocation = (latitude, longitude, source) => {
    setForm((current) => ({
      ...current,
      latitude,
      longitude,
      locationConfirmed: true,
    }))
    setLocationState({
      status: 'success',
      message: source === 'google_verified'
        ? 'Titik alamat terverifikasi oleh Google Maps.'
        : 'Titik pilihan Anda tercatat. Pastikan penanda tepat berada di lokasi usaha.',
      formattedAddress: '',
    })
  }

  const clearLocation = () => {
    setForm((current) => ({
      ...current,
      latitude: null,
      longitude: null,
      locationConfirmed: false,
    }))
    setLocationState({ status: 'idle', message: '', formattedAddress: '' })
  }

  const submitForm = async (event) => {
    event.preventDefault()
    if (form.mapConsent && !form.locationConfirmed) {
      setLocationState({
        status: 'error',
        message: 'Pilih dan konfirmasi titik lokasi sebelum mengizinkan lokasi tampil di peta.',
        formattedAddress: '',
      })
      return
    }
    const formElement = event.currentTarget
    setState({ status: 'submitting', message: '', registrationCode: '' })

    const commonFields = {
      role: form.role,
      fullName: form.fullName,
      businessName: form.businessName,
      whatsapp: form.whatsapp,
      email: form.email,
      province: form.province,
      city: form.city,
      district: form.district,
      village: form.village,
      address: form.address,
      latitude: form.latitude,
      longitude: form.longitude,
      locationConfirmed: form.locationConfirmed,
      mapConsent: form.mapConsent,
      frequency: form.frequency,
      notes: form.notes,
      consent: form.consent,
      directoryConsent: form.directoryConsent,
    }
    const roleFields = form.role === 'supplier'
      ? {
          producerType: form.producerType,
          wasteTypes: form.wasteTypes,
          quantityKg: form.quantityKg,
          wasteCondition: form.wasteCondition,
        }
      : form.role === 'processor'
        ? {
            wasteTypes: form.wasteTypes,
            productTypes: form.productTypes,
            processingType: form.processingType,
            capacityKg: form.capacityKg,
          }
        : {
            productType: form.productType,
            quantityKg: form.quantityKg,
          }

    try {
      const result = await postJson(
        `${import.meta.env.VITE_API_BASE_URL || ''}/api/ecosystem/registrations`,
        { ...commonFields, ...roleFields },
      )

      setState({
        status: 'success',
        message: 'Data Anda tersimpan dan akan ditinjau oleh pengelola SIRKULIT. Data hanya muncul di direktori jika Anda menyetujui publikasi dan pendaftaran telah diverifikasi.',
        registrationCode: result.registrationCode,
      })
      setForm({ ...initialForm, role: form.role })
      formElement.reset()
      setLocationState({ status: 'idle', message: '', formattedAddress: '' })
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
          <h1>Bergabung dalam Ekosistem Organik</h1>
          <p className="registration-intro">Pilih peran Anda. Pengelola akan meninjau pendaftaran sebelum profil yang menyetujui publikasi ditampilkan di direktori.</p>

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
              <legend>Peran Anda</legend>
              <div className="new-form-grid">
                <SelectField
                  label="Kategori pengguna"
                  name="role"
                  onChange={updateField}
                  options={Object.entries(ECOSYSTEM_ROLES).map(([role, label]) => ({ role, label }))}
                  value={form.role}
                  required
                />
              </div>
            </fieldset>

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
                {form.role === 'supplier' && (
                  <SelectField label="Jenis pemasok" name="producerType" onChange={updateField} options={WASTE_PRODUCER_TYPES} value={form.producerType} required />
                )}
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

            <fieldset className="location-verification-fieldset">
              <legend>Verifikasi titik lokasi</legend>
              <p className="location-picker-help">
                Verifikasi alamat dengan Google Maps atau klik titik yang tepat pada peta. Titik peta awal hanya membantu navigasi, bukan koordinat usaha.
              </p>
              <div className="location-picker-actions">
                <button
                  className="button button-outline"
                  disabled={locationState.status === 'loading'}
                  onClick={verifyAddress}
                  type="button"
                >
                  {locationState.status === 'loading' ? 'Memverifikasi...' : 'Verifikasi alamat otomatis'}
                </button>
                {form.locationConfirmed && (
                  <button className="text-link" onClick={clearLocation} type="button">Hapus titik pilihan</button>
                )}
              </div>
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onSelect={selectLocation}
              />
              {locationState.message && (
                <p className={`location-picker-status location-picker-${locationState.status}`} role={locationState.status === 'error' ? 'alert' : 'status'}>
                  {locationState.message}
                  {locationState.formattedAddress && <><br />{locationState.formattedAddress}</>}
                </p>
              )}
              {form.locationConfirmed && (
                <p className="location-picker-coordinates">
                  Titik dipilih: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                </p>
              )}
              <label className="consent-field">
                <input checked={form.mapConsent} name="mapConsent" onChange={updateField} type="checkbox" />
                <span>Saya mengizinkan alamat lengkap, titik lokasi, nomor WhatsApp, jenis limbah/produk, kapasitas, dan keterangan saya ditampilkan pada peta publik setelah pendaftaran disetujui. Jika tidak dipilih, lokasi tidak ditampilkan.</span>
              </label>
            </fieldset>

            <fieldset>
              <legend>{form.role === 'supplier' ? 'Informasi Limbah' : form.role === 'processor' ? 'Informasi Pengolahan' : 'Informasi Kebutuhan Produk'}</legend>
              <div className="new-form-grid">
                {form.role !== 'buyer' && (
                  <MultiSelectField
                    label={form.role === 'supplier' ? 'Jenis limbah yang tersedia' : 'Jenis limbah yang dapat diolah'}
                    name="wasteTypes"
                    onChange={updateField}
                    options={FRUIT_TYPES}
                    selected={form.wasteTypes}
                  />
                )}
                {form.role === 'supplier' && (
                  <>
                    <Field label="Jumlah limbah tersedia (kg)" name="quantityKg" required>
                      <input inputMode="decimal" min="0.01" name="quantityKg" onChange={updateField} required step="0.01" type="number" value={form.quantityKg} />
                    </Field>
                    <SelectField label="Kondisi limbah" name="wasteCondition" onChange={updateField} options={WASTE_CONDITIONS} value={form.wasteCondition} required />
                  </>
                )}
                {form.role === 'processor' && (
                  <>
                    <MultiSelectField
                      label="Jenis hasil olahan yang diproduksi"
                      name="productTypes"
                      onChange={updateField}
                      options={ORGANIC_PRODUCTS}
                      selected={form.productTypes}
                    />
                    <Field label="Jenis pengolahan" name="processingType" required>
                      <input maxLength="120" name="processingType" onChange={updateField} required value={form.processingType} />
                    </Field>
                    <Field label="Kapasitas pengolahan (kg per periode)" name="capacityKg" required>
                      <input inputMode="decimal" min="0.01" name="capacityKg" onChange={updateField} required step="0.01" type="number" value={form.capacityKg} />
                    </Field>
                  </>
                )}
                {form.role === 'buyer' && (
                  <>
                    <SelectField label="Jenis produk yang dibutuhkan" name="productType" onChange={updateField} options={ORGANIC_PRODUCTS} value={form.productType} required />
                    <Field label="Jumlah kebutuhan (kg per periode)" name="quantityKg" required>
                      <input inputMode="decimal" min="0.01" name="quantityKg" onChange={updateField} required step="0.01" type="number" value={form.quantityKg} />
                    </Field>
                  </>
                )}
                <SelectField label="Frekuensi ketersediaan/kebutuhan" name="frequency" onChange={updateField} options={PRODUCTION_FREQUENCIES} value={form.frequency} required />
                <Field label="Keterangan tambahan (opsional)" name="notes">
                  <textarea maxLength="1000" name="notes" onChange={updateField} rows="3" value={form.notes} />
                </Field>
              </div>
            </fieldset>

            <label className="consent-field">
              <input checked={form.consent} name="consent" onChange={updateField} required type="checkbox" />
              <span>Saya menyetujui penggunaan data ini oleh pengelola SIRKULIT untuk meninjau pendaftaran dan menghubungi saya terkait kerja sama ekosistem.</span>
            </label>
            <label className="consent-field">
              <input checked={form.directoryConsent} name="directoryConsent" onChange={updateField} type="checkbox" />
              <span>Saya mengizinkan nama/nama usaha, kota/provinsi, jenis limbah/produk, kapasitas atau jumlah, frekuensi, dan nomor WhatsApp ditampilkan di direktori publik setelah pendaftaran diverifikasi.</span>
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
