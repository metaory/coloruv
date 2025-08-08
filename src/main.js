import './style.css'
import '@fontsource-variable/fredoka'
import '@fontsource/libre-barcode-128-text'

const body = document.body

const state = { hue: 260, saturation: 60, lightness: 30, selectedColors: [] }
const base = (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/'
const asset = (name) => `${base}${name}`

const addVersionBadge = () => {
  const v = (import.meta && import.meta.env && import.meta.env.VERSION) || ''
  if (!v) return
  const el = document.createElement('div')
  el.id = 'version'
  el.textContent = `v${v}`
  el.setAttribute('aria-hidden', 'true')
  body.appendChild(el)
}

const createLayout = () => {
  const activeArea = document.createElement('div')
  activeArea.id = 'active-area'
  const colorDisplay = document.createElement('div')
  colorDisplay.id = 'color-display'
  colorDisplay.textContent = 'Tap or click to save color'
  activeArea.appendChild(colorDisplay)
  body.appendChild(activeArea)
  return { activeArea, colorDisplay }
}

const updateColor = (activeArea) => {
  const { hue, saturation, lightness } = state
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`
  activeArea.style.backgroundColor = color
  const colorDisplay = activeArea.querySelector('#color-display')
  colorDisplay.textContent = `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`
}

const handlePointer = (e, activeArea) => {
  const rect = activeArea.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height
  state.hue = x * 360
  state.saturation = 100 - (y * 100)
  state.lightness = y * 100
  updateColor(activeArea)
}

const legacyCopy = (text) => {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.top = '-1000px'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  const ok = document?.execCommand('copy')
  ta.remove()
  showToast(ok ? 'Color copied!' : 'Copy unavailable')
  return Promise.resolve(ok)
}

const copyToClipboard = (text) => {
  const api = navigator?.clipboard?.writeText
  if (api) return navigator.clipboard.writeText(text).then(() => showToast('Color copied!'), () => legacyCopy(text))
  return legacyCopy(text)
}

const showToast = (message) => {
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = message
  body.appendChild(toast)
  setTimeout(() => toast.remove(), 2_000)
}

const saveColor = () => {
  const color = `hsl(${state.hue}, ${state.saturation}%, ${state.lightness}%)`
  const value = `hsl(${Math.round(state.hue)}, ${Math.round(state.saturation)}%, ${Math.round(state.lightness)}%)`
  state.selectedColors.push({ color, value })
  copyToClipboard(value)
  updateLayout()
}

const removeColor = (index) => {
  state.selectedColors.splice(index, 1)
  updateLayout()
}

const createActionButton = (html, className, onClick) => {
  const btn = document.createElement('button')
  btn.className = `action-btn ${className}`
  btn.innerHTML = html
  btn.onclick = onClick
  return btn
}

const updateLayout = () => {
  const existing = document.querySelectorAll('.color-column')
  for (const col of existing) col.remove()

  for (const [i, { color, value }] of state.selectedColors.entries()) {
    const column = document.createElement('div')
    column.className = 'color-column'
    column.style.backgroundColor = color

    const colorValue = document.createElement('button')
    colorValue.className = 'color-value'
    colorValue.textContent = value
    colorValue.onclick = () => copyToClipboard(value)

    const actionButtons = document.createElement('div')
    actionButtons.className = 'action-buttons'

    const copyBtn = createActionButton(`<img src="${asset('copy.svg')}" alt="copy" />`, 'copy-btn', () => copyToClipboard(value))
    const removeBtn = createActionButton(`<img src="${asset('close.svg')}" alt="remove" />`, 'remove-btn', () => removeColor(i))

    actionButtons.appendChild(copyBtn)
    actionButtons.appendChild(removeBtn)
    column.appendChild(colorValue)
    column.appendChild(actionButtons)
    body.insertBefore(column, activeArea)
  }

  const total = state.selectedColors.length
  const activeWidth = Math.max(25, 100 - (total * 12))
  activeArea.style.width = `${activeWidth}%`
}

const { activeArea } = createLayout()
activeArea.addEventListener('pointerenter', (e) => handlePointer(e, activeArea))
activeArea.addEventListener('pointermove', (e) => handlePointer(e, activeArea))
activeArea.addEventListener('click', saveColor)

updateColor(activeArea)

const hideSplash = () => document.documentElement.classList.add('loaded')

const fontsReady = document?.fonts.ready ? document.fonts.ready : Promise.resolve()
fontsReady
  .then(hideSplash)
  .then(addVersionBadge)
