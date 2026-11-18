import { useState } from 'react'
import { estimateWasteVolumePerWeek } from './waste-estimate.js'

const formatKilograms = (value) => new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 1,
}).format(value)

export default function WasteEstimateCalculator() {
  const [dailyKg, setDailyKg] = useState('')
  const [daysPerWeek, setDaysPerWeek] = useState('')
  const estimate = estimateWasteVolumePerWeek(dailyKg, daysPerWeek)
  const hasInput = dailyKg !== '' || daysPerWeek !== ''

  return (
    <section aria-labelledby="waste-estimator-title" className="waste-estimator">
      <div className="waste-estimator-header">
        <h3 id="waste-estimator-title">Hitung potensi penyaluran</h3>
        <p>Perkirakan jumlah kulit buah yang tersedia untuk disalurkan.</p>
      </div>

      <div className="waste-estimator-fields">
        <label className="waste-estimator-field" htmlFor="waste-estimator-daily">
          Rata-rata limbah per hari
          <span>
            <input
              id="waste-estimator-daily"
              inputMode="decimal"
              min="0.01"
              onChange={(event) => setDailyKg(event.target.value)}
              placeholder="Contoh: 2.5"
              step="0.01"
              type="number"
              value={dailyKg}
            />
            kg
          </span>
        </label>
        <label className="waste-estimator-field" htmlFor="waste-estimator-days">
          Hari operasional per minggu
          <span>
            <input
              id="waste-estimator-days"
              inputMode="numeric"
              max="7"
              min="1"
              onChange={(event) => setDaysPerWeek(event.target.value)}
              placeholder="1–7"
              step="1"
              type="number"
              value={daysPerWeek}
            />
            hari
          </span>
        </label>
      </div>

      <div aria-live="polite" className="waste-estimator-output" role="status">
        {estimate ? (
          <>
            <p className="waste-estimator-result-title">Perkiraan limbah yang dapat disalurkan</p>
            <dl className="waste-estimator-results">
              <div><dt>Per minggu</dt><dd>{formatKilograms(estimate.weeklyKg)} kg</dd></div>
              <div><dt>Per bulan*</dt><dd>{formatKilograms(estimate.monthlyKg)} kg</dd></div>
              <div><dt>Per tahun</dt><dd>{formatKilograms(estimate.yearlyKg)} kg</dd></div>
            </dl>
          </>
        ) : (
          <p className="waste-estimator-empty">
            {hasInput
              ? 'Masukkan jumlah lebih dari 0 kg dan 1–7 hari operasional untuk melihat estimasi.'
              : 'Isi jumlah limbah dan hari operasional untuk melihat estimasi.'}
          </p>
        )}
      </div>
      <p className="waste-estimator-disclaimer">
        *Perkiraan bulanan memakai rata-rata 52 minggu ÷ 12 bulan. Hasil hanya simulasi dari masukan Anda, bukan jumlah aktual atau jaminan penjemputan.
      </p>
    </section>
  )
}
