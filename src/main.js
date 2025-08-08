import './style.css'
import '@fontsource-variable/fredoka'
import '@fontsource/libre-barcode-128-text'

const body = document.body

const state = { hue: 260, saturation: 60, lightness: 30, selectedColors: [], contrast: null }
const base = (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/'
const asset = name => `${base}${name}`

const el = (tag, props = {}, ...children) => {
  const { style, dataset, ...rest } = props
  const node = Object.assign(document.createElement(tag), rest)
  if (style) Object.assign(node.style, style)
  if (dataset) Object.assign(node.dataset, dataset)
  for (const child of children) node.append(child)
  return node
}

const currentColor = () => `hsl(${state.hue}, ${state.saturation}%, ${state.lightness}%)`
const hslToHex = (h, s, l) => {
  h = Math.round(h) % 360
  s = Math.round(s) / 100
  l = Math.round(l) / 100
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  }
  return `#${f(0)}${f(8)}${f(4)}`
}
const currentValue = () => hslToHex(state.hue, state.saturation, state.lightness)

const addVersionBadge = () => {
  const v = (import.meta && import.meta.env && import.meta.env.VERSION) || ''
  if (!v) return
  const node = el('div', { id: 'version', textContent: `v${v}` })
  node.setAttribute('aria-hidden', 'true')
  body.appendChild(node)
}

const createLayout = () => {
  const colorDisplay = el('div', { id: 'color-display', textContent: 'Tap or click to save color' })
  const activeArea = el('div', { id: 'active-area' }, colorDisplay)
  body.appendChild(activeArea)
  return { activeArea, colorDisplay }
}

const updateColor = activeArea => {
  activeArea.style.backgroundColor = currentColor()
  const colorDisplay = activeArea.querySelector('#color-display')
  colorDisplay.textContent = currentValue()
  if (state.contrast) updateContrast(state.contrast)
}

const handlePointer = (e, activeArea) => {
  const rect = activeArea.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height
  state.hue = x * 360
  state.saturation = 100 - y * 100
  state.lightness = y * 100
  updateColor(activeArea)
}

const createContrast = () => {
  const word = 'coloruv'
  const node = el('div', { id: 'contrast' })
  node.append(
    el('div', { className: 'sample', textContent: word, style: { background: '#fff' } }),
    el('div', { className: 'sample', textContent: word, style: { background: '#000' } }),
    el('div', { className: 'sample', textContent: word }),
    el('div', { className: 'sample', textContent: word }),
  )
  body.appendChild(node)
  state.contrast = node
  return node
}

const updateContrast = node => {
  const c = currentColor()
  const [onWhite, onBlack, whiteOnActive, blackOnActive] = node.children
  onWhite.style.color = c
  onBlack.style.color = c
  whiteOnActive.style.background = c
  whiteOnActive.style.color = '#fff'
  blackOnActive.style.background = c
  blackOnActive.style.color = '#000'
}

const legacyCopy = text => {
  const ta = el('textarea', {
    value: text,
    readOnly: true,
    style: { position: 'fixed', top: '-1000px', opacity: '0' },
  })
  body.appendChild(ta)
  ta.select()
  const ok = document?.execCommand('copy')
  ta.remove()
  showToast(ok ? 'Color copied!' : 'Copy unavailable')
  return Promise.resolve(ok)
}

const copyToClipboard = text => {
  const api = navigator?.clipboard?.writeText
  if (api)
    return navigator.clipboard.writeText(text).then(
      () => showToast('Color copied!'),
      () => legacyCopy(text),
    )
  return legacyCopy(text)
}

const showToast = message => {
  const toast = el('div', { className: 'toast', textContent: message })
  body.appendChild(toast)
  setTimeout(() => toast.remove(), 2_000)
}

const saveColor = () => {
  const color = currentColor()
  const value = currentValue()
  state.selectedColors.push({ color, value })
  copyToClipboard(value)
  updateLayout()
}

const removeColor = index => {
  state.selectedColors.splice(index, 1)
  updateLayout()
}

const createActionButton = (html, className, onClick) =>
  el('button', { className: `action-btn ${className}`, innerHTML: html, onclick: onClick })

const updateLayout = () => {
  const existing = document.querySelectorAll('.color-column')
  for (const col of existing) col.remove()

  for (const [i, { color, value }] of state.selectedColors.entries()) {
    const colorValue = el('button', {
      className: 'color-value',
      textContent: value,
      onclick: () => copyToClipboard(value),
    })
    const actionButtons = el(
      'div',
      { className: 'action-buttons' },
      createActionButton(`<img src="${asset('copy.svg')}" alt="copy" />`, 'copy-btn', () => copyToClipboard(value)),
      createActionButton(`<img src="${asset('close.svg')}" alt="remove" />`, 'remove-btn', () => removeColor(i)),
    )
    const column = el('div', { className: 'color-column', style: { backgroundColor: color } }, colorValue, actionButtons)
    body.insertBefore(column, activeArea)
  }

  const total = state.selectedColors.length
  const activeWidth = Math.max(25, 100 - total * 12)
  activeArea.style.width = `${activeWidth}%`
}

const { activeArea } = createLayout()
createContrast()
activeArea.addEventListener('pointerenter', e => handlePointer(e, activeArea))
activeArea.addEventListener('pointermove', e => handlePointer(e, activeArea))
activeArea.addEventListener('click', saveColor)

updateColor(activeArea)

const hideSplash = () => document.documentElement.classList.add('loaded')

const fontsReady = document?.fonts.ready ? document.fonts.ready : Promise.resolve()
fontsReady.then(hideSplash).then(addVersionBadge)
