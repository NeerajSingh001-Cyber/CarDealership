document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm')
  const statusElement = document.getElementById('contactStatus')
  const submitButton = form?.querySelector('button[type="submit"]')

  if (!form) return

  const setStatus = (message, isError = false) => {
    if (!statusElement) return
    statusElement.textContent = message
    statusElement.classList.toggle('error', isError)
    statusElement.classList.toggle('success', !isError)
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const name = document.getElementById('contactName')?.value.trim()
    const email = document.getElementById('contactEmail')?.value.trim()
    const subject = document.getElementById('contactSubject')?.value.trim()
    const message = document.getElementById('contactMessage')?.value.trim()

    if (!name || !email || !subject || !message) {
      setStatus('Please fill in all fields.', true)
      return
    }

    submitButton?.setAttribute('disabled', 'disabled')
    setStatus('Sending your message...')

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, subject, message })
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send your message.')
      }

      form.reset()
      setStatus(payload.message || 'Your message has been sent successfully.')
    } catch (error) {
      setStatus(error.message || 'Something went wrong. Please try again.', true)
    } finally {
      submitButton?.removeAttribute('disabled')
    }
  })
})