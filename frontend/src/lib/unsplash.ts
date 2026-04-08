const UNSPLASH_BASE = 'https://api.unsplash.com';

const photoCache = new Map<string, string>();

const FALLBACK_PHOTOS: Record<string, string> = {
  'Los Angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=400&h=300&fit=crop',
  'Cancún': 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=400&h=300&fit=crop',
  'San Juan': 'https://images.unsplash.com/photo-1580237541049-2d715a09486e?w=400&h=300&fit=crop',
  'Miami': 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=400&h=300&fit=crop',
  'Denver': 'https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=400&h=300&fit=crop',
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop',
  'San Francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
  'Chicago': 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&h=300&fit=crop',
  'Seattle': 'https://images.unsplash.com/photo-1502175353174-a7a70e73b4c3?w=400&h=300&fit=crop',
  'Boston': 'https://images.unsplash.com/photo-1501979376754-2ff867a4f659?w=400&h=300&fit=crop',
  'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop',
  'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop',
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=300&fit=crop',
  'Lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=400&h=300&fit=crop',
  'Amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=300&fit=crop',
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop',
  'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=300&fit=crop',
  'Sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=300&fit=crop',
  'Seoul': 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=400&h=300&fit=crop',
  'Nassau': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&h=300&fit=crop',
  'Montego Bay': 'https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=400&h=300&fit=crop',
  'Bogotá': 'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=400&h=300&fit=crop',
  'Lima': 'https://images.unsplash.com/photo-1531968455001-5c5272a67c71?w=400&h=300&fit=crop',
  'Orlando': 'https://images.unsplash.com/photo-1575089776834-8be34571d60e?w=400&h=300&fit=crop',
  'Atlanta': 'https://images.unsplash.com/photo-1575917649111-0cee4e7e8ab1?w=400&h=300&fit=crop',
  'Phoenix': 'https://images.unsplash.com/photo-1558645836-e44122a743ee?w=400&h=300&fit=crop',
  'Houston': 'https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=400&h=300&fit=crop',
  'Dallas': 'https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=400&h=300&fit=crop',
};

export async function getDestinationPhoto(cityName: string): Promise<string> {
  if (photoCache.has(cityName)) {
    return photoCache.get(cityName)!;
  }

  if (FALLBACK_PHOTOS[cityName]) {
    photoCache.set(cityName, FALLBACK_PHOTOS[cityName]);
    return FALLBACK_PHOTOS[cityName];
  }

  const key = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (!key) {
    return '';
  }

  try {
    const res = await fetch(
      `${UNSPLASH_BASE}/search/photos?query=${encodeURIComponent(cityName + ' travel cityscape')}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${key}`,
        },
      }
    );
    const data = await res.json();
    const url = data.results?.[0]?.urls?.small || '';
    if (url) {
      photoCache.set(cityName, url);
    }
    return url;
  } catch {
    return FALLBACK_PHOTOS[cityName] || '';
  }
}

export function getDestinationPhotoSync(cityName: string): string {
  return FALLBACK_PHOTOS[cityName] || '';
}
