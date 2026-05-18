document.addEventListener('DOMContentLoaded', () => {
  const socket = typeof io === 'function' ? io() : null;
  const carId = sessionStorage.getItem('selectedCarId');
  if (!carId) {
    window.location.href = 'buy.html';
    return;
  }

  const viewerCountElement = document.getElementById('viewerCount');
  const enquiryForm = document.getElementById('enquiryForm');
  const enquiryUsername = document.getElementById('enquiryUsername');
  const enquiryMessage = document.getElementById('enquiryMessage');
  const enquiryFeed = document.getElementById('enquiryFeed');
  let currentUser = null;

  // Check current logged-in user (session) for auth-protected actions
  fetch('/api/users/me', { credentials: 'include' })
    .then(r => {
      console.log('Fetched /api/users/me status', r.status)
      return r.ok ? r.json() : null
    })
    .then(data => {
      console.log('Current user payload:', data)
      if (data && data.user) {
        currentUser = data.user
        console.log('User is logged in as', currentUser.username || currentUser.email)
      } else {
        console.log('No logged-in user found')
      }
    })
    .catch((err) => { console.error('Error fetching current user', err) })

  // Fallback: if server session not present, allow client-side login state
  try {
    if (!currentUser) {
      const stored = sessionStorage.getItem('loggedInUser')
      if (stored) {
        currentUser = JSON.parse(stored)
        console.log('Restored currentUser from sessionStorage', currentUser.username)
      }
    }
  } catch (e) {
    console.warn('Could not parse loggedInUser from sessionStorage', e)
  }

  const appendEnquiry = (username, message, timestamp) => {
    if (!enquiryFeed) return;
    const line = document.createElement('p');
    const readableTime = new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    line.textContent = `[${readableTime}] ${username}: ${message}`;
    enquiryFeed.prepend(line);
  };

  if (socket) {
    console.log('Socket client: attempting connection...')
    socket.on('connect', () => console.log('Socket connected:', socket.id))
    socket.on('connect_error', (err) => console.error('Socket connect error:', err))
    socket.on('disconnect', (reason) => console.warn('Socket disconnected:', reason))
    socket.emit('viewCar', carId);

    socket.on('viewerCount', ({ carId: updatedCarId, count }) => {
      if (String(updatedCarId) !== String(carId)) return;
      if (viewerCountElement) {
        viewerCountElement.textContent = `Viewers right now: ${count}`;
      }
    });

    socket.on('newEnquiry', ({ username, message, timestamp }) => {
      appendEnquiry(username, message, timestamp);
    });
    socket.on('enquiryAck', (payload) => {
      console.log('Server ack for enquiry:', payload)
      if (payload && payload.ok) {
        // optionally show a small toast or console message
        console.log('Enquiry persisted with id', payload.id)
      } else if (payload) {
        console.error('Enquiry persistence failed on server:', payload.error)
      }
    })

    window.addEventListener('beforeunload', () => {
      socket.emit('leaveCar', carId);
    });
  } else if (viewerCountElement) {
    viewerCountElement.textContent = 'Live updates unavailable: socket client failed to load.';
  }

  fetch(`/cars/${carId}`)
    .then(response => response.json())
    .then(payload => {
      const car = payload.data || payload;
      if (!car) {
        window.location.href = 'buy.html';
        return;
      }
      document.getElementById('carImage').src = car.image;
      document.getElementById('carImage').alt = car.name;
      document.getElementById('carName').textContent = car.name;
      document.getElementById('carColor').textContent = 'Color: ' + car.color;
      document.getElementById('carPrice').textContent = '₹' + car.price.toLocaleString('en-IN');
      document.getElementById('carDescription').textContent = car.description;
      document.getElementById('carType').textContent = car.type;
      document.getElementById('carFuel').textContent = car.fuel;
      document.getElementById('carEngine').textContent = car.engine;
      document.getElementById('carSeats').textContent = car.seats;
      document.getElementById('carMileage').textContent = car.mileage;
      document.getElementById('carPower').textContent = car.horsepower;
      document.getElementById('carTopspeed').textContent = car.topspeed;
    })
    .catch(err => {
      console.error('Error loading car details:', err);
      window.location.href = 'buy.html';
    });

  const sendEnquiryBtn = document.getElementById('sendEnquiryBtn')
  if (sendEnquiryBtn) {
    sendEnquiryBtn.addEventListener('click', (event) => {
      const message = enquiryMessage.value.trim();

      // require login to send enquiry
      if (!currentUser) {
        alert('Login first to continue')
        return
      }

      if (!message || !socket) return

      const username = currentUser.username || enquiryUsername.value.trim()
      const email = currentUser.email || ''

      socket.emit('sendEnquiry', { carId, username, email, message });
      console.log('Sent enquiry via socket', { carId, username, email, message })
      enquiryMessage.value = '';
    })
  }

  document.getElementById('btnBack').addEventListener('click', () => {
    if (socket) {
      socket.emit('leaveCar', carId);
    }
    window.location.href = 'buy.html';
  });
  const btnBuy = document.getElementById('btnBuy')

  function setBuyEnabled(enabled) {
    if (!btnBuy) return
    // Keep the button clickable so we can show the login alert on unauthenticated clicks.
    // Use ARIA and CSS class for visual disabled state instead of the disabled attribute.
    btnBuy.setAttribute('aria-disabled', String(!enabled))
    btnBuy.title = enabled ? '' : 'Login required to buy'
    btnBuy.classList.toggle('disabled', !enabled)
  }

  // initialize buy button state
  setBuyEnabled(!!currentUser)

  // listen for auth changes from the login popup script
  window.addEventListener('authChanged', (e) => {
    currentUser = e?.detail?.user || null
    setBuyEnabled(!!currentUser)
  })

  if (btnBuy) {
    btnBuy.addEventListener('click', async () => {
      // re-check server session before posting
      try {
        const check = await fetch('/api/users/me', { credentials: 'include' })
        if (!check.ok) {
          if (typeof openPopup === 'function') {
            alert('Login first to continue')
            openPopup('login')
          } else {
            alert('Login first to continue')
            window.location.href = '/HTML/homepage.html'
          }
          return
        }
      } catch (err) {
        console.error('Auth check failed before Buy Now', err)
        alert('Login first to continue')
        if (typeof openPopup === 'function') openPopup('login')
        return
      }

      // POST to API to create a persistent enquiry in MongoDB
      fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ carId, message: 'User clicked Buy Now - interested in purchase' })
      })
        .then(async (r) => {
          const d = await r.json().catch(() => ({}))
          if (!r.ok) throw new Error(d.error || 'Failed to create enquiry')
          alert('Thank you! Your interest has been recorded. We will contact you soon.')
        })
        .catch((err) => {
          console.error('Buy Now API error', err)
          alert('Could not record your interest. Please try again later.')
        })
    })
  }
});
