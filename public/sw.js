// RestoFlow Service Worker — Push Notifications

self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'RestoFlow'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data.data || {},
    vibrate: [200, 100, 200],
    tag: data.data?.type || 'default',
    renotify: true,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const type = event.notification.data?.type
  let url = '/alertes'

  if (type === 'stock_critique') url = '/stocks'
  else if (type === 'ecart_livraison') url = '/livraisons'
  else if (type === 'haccp_non_conforme') url = '/hygiene'
  else if (type === 'hausse_prix') url = '/alertes'
  else if (type === 'dlc_proche') url = '/stocks'

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url.includes(url) && 'focus' in clientList[i]) {
          return clientList[i].focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
