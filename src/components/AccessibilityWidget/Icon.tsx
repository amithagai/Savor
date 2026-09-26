const paths: Record<string, string> = {
  accessibility: 'M12 3a1.5 1.5 0 1 0 0 .01M5 7l7 2 7-2M12 9v6m0 0-4 6m4-6 4 6',
  keyboard: 'M3 5h18v14H3zM6 8h1m3 0h1m3 0h1m3 0h1M6 11h1m3 0h1m3 0h1m3 0h1M7 15h10',
  grid: 'M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18',
  ear: 'M8 10c0-8 13-8 13 0 0 5-6 4-6 9 0 4-7 3-7-1M12 10c0-3 5-3 5 0 0 3-4 2-4 6M4 8c-2 3-2 6 0 9',
  volume: 'M3 9h4l5-5v16l-5-5H3zM16 8q5 4 0 8M19 5q8 7 0 14',
  mic: 'M9 4a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0zM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8',
  sun: 'M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
  moon: 'M19 16A9 9 0 0 1 9 3a9 9 0 1 0 10 13z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0',
  drop: 'M12 2S4 10 4 15a8 8 0 0 0 16 0c0-5-8-13-8-13zM6 15q6 5 12 0',
  contrast: 'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0M12 3v18M15 5v14M18 8v8',
  type: 'M4 20 12 3l8 17M7 14h10M5 23h14',
  cursor: 'M5 2v18l5-5 4 7 3-2-4-7h7z',
  zoom: 'M15 15l7 7M18 10a8 8 0 1 0-16 0 8 8 0 0 0 16 0M6 10h8M10 6v8',
  image: 'M3 3h18v18H3zM3 17l6-6 4 4 3-3 5 5M16 7h.01',
  link: 'M10 7l3-3a5 5 0 0 1 7 7l-3 3M14 17l-3 3a5 5 0 0 1-7-7l3-3M8 16l8-8',
  pen: 'm3 21 2-7L17 2l5 5L10 19zM5 14l5 5',
  expand: 'M3 9V3h6M3 3l7 7M21 15v6h-6M21 21l-7-7',
  page: 'M5 2h14v20H5zM8 6h8M8 10h8M8 14h8M8 18h5',
  map: 'm2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3zM8 2v17M16 5v17',
  focus: 'M3 3h12v12H3zM9 9h12v12H9z',
  book: 'M12 5Q7 1 2 4v16q5-3 10 1 5-4 10-1V4q-5-3-10 1v16',
  guide: 'M2 6h20M2 12h20M2 18h20M2 10l4 2-4 2',
  stop: 'M20 4 4 20M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0',
}
export default function Icon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.page} /></svg>
}
