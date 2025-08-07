import './style.css'
import '@fontsource-variable/fredoka'
import '@fontsource/libre-barcode-128-text'

const body = document.body

const state = {
  hue: 180,
  saturation: 50,
  lightness: 50,
  selectedColors: []
}

const createLayout = () => {
  const activeArea = document.createElement('div')
  activeArea.id = 'active-area'

  const colorDisplay = document.createElement('div')
  colorDisplay.id = 'color-display'
  colorDisplay.textContent = 'Click to save color'

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

const handleMouseMove = (e, activeArea) => {
  const rect = activeArea.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height

  state.hue = x * 360
  state.saturation = 100 - (y * 100)
  state.lightness = y * 100

  updateColor(activeArea)
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast('Color copied!')
  } catch (err) {
    showToast('Copy failed')
  }
}

const showToast = (message) => {
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = message
  body.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 2_000)
}

const saveColor = () => {
  const color = `hsl(${state.hue}, ${state.saturation}%, ${state.lightness}%)`
  const colorValue = `hsl(${Math.round(state.hue)}, ${Math.round(state.saturation)}%, ${Math.round(state.lightness)}%)`
  state.selectedColors.push({ color, value: colorValue })
  copyToClipboard(colorValue)
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
  document.querySelectorAll('.color-column').forEach(col => col.remove())

  state.selectedColors.forEach((colorObj, index) => {
    const column = document.createElement('div')
    column.className = 'color-column'
    column.style.backgroundColor = colorObj.color

    const colorValue = document.createElement('div')
    colorValue.className = 'color-value'
    colorValue.textContent = colorObj.value

    const actionButtons = document.createElement('div')
    actionButtons.className = 'action-buttons'

    const copyBtn = createActionButton('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.6 11.397c0-2.726 0-4.089.843-4.936c.844-.847 2.201-.847 4.917-.847h2.88c2.715 0 4.073 0 4.916.847c.844.847.844 2.21.844 4.936v4.82c0 2.726 0 4.089-.844 4.936c-.843.847-2.201.847-4.916.847h-2.88c-2.716 0-4.073 0-4.917-.847s-.843-2.21-.843-4.936z"/><path fill="currentColor" d="M4.172 3.172C3 4.343 3 6.229 3 10v2c0 3.771 0 5.657 1.172 6.828c.617.618 1.433.91 2.62 1.048c-.192-.84-.192-1.996-.192-3.66v-4.819c0-2.726 0-4.089.843-4.936c.844-.847 2.201-.847 4.917-.847h2.88c1.652 0 2.8 0 3.638.19c-.138-1.193-.43-2.012-1.05-2.632C16.657 2 14.771 2 11 2S5.343 2 4.172 3.172" opacity=".5"/></svg>', 'copy-btn', () => copyToClipboard(colorObj.value))
    const removeBtn = createActionButton('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 22c-4.714 0-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12s0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22" opacity=".5"/><path fill="currentColor" d="M8.97 8.97a.75.75 0 0 1 1.06 0L12 10.94l1.97-1.97a.75.75 0 1 1 1.06 1.06L13.06 12l1.97 1.97a.75.75 0 1 1-1.06 1.06L12 13.06l-1.97 1.97a.75.75 0 0 1-1.06-1.06L10.94 12l-1.97-1.97a.75.75 0 0 1 0-1.06"/></svg>', 'remove-btn', () => removeColor(index))

    actionButtons.appendChild(copyBtn)
    actionButtons.appendChild(removeBtn)

    column.appendChild(colorValue)
    column.appendChild(actionButtons)
    body.insertBefore(column, activeArea)
  })

  // Update active area width
  const totalColumns = state.selectedColors.length
  const activeWidth = Math.max(25, 100 - (totalColumns * 12))
  activeArea.style.width = `${activeWidth}%`
}

const { activeArea } = createLayout()

activeArea.addEventListener('mouseenter', (e) => handleMouseMove(e, activeArea))
activeArea.addEventListener('mousemove', (e) => handleMouseMove(e, activeArea))
activeArea.addEventListener('click', saveColor)

updateColor(activeArea)
