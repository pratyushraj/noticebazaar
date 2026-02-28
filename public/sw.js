self.addEventListener('push', (event) => {
  let payload = {
    title: 'New Brand Offer',
    body: 'A brand wants to collaborate with you.',
    url: '/collab-requests',
  };

  try {
    const parsed = event.data?.json();
    if (parsed && typeof parsed === 'object') {
      payload = {
        ...payload,
        ...parsed,
      };
    }
  } catch (error) {
    // Ignore parse errors and use defaults
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      actions: [
        { action: 'view-offer', title: 'View Offer' },
      ],
      data: {
        url: payload.url || '/collab-requests',
      },
      tag: payload.requestId ? `collab-request-${payload.requestId}` : 'collab-request',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/collab-requests';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
