import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Rijksuitgaven.nl — Snel inzicht voor krachtige analyses'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Load IBM Plex Sans Bold locally — bundled at build time via import.meta.url
const ibmPlexSansBold = fetch(
  new URL('./IBMPlexSans-Bold.ttf', import.meta.url)
).then((res) => res.arrayBuffer())

export default async function Image() {
  const [fontData, logoArrayBuffer] = await Promise.all([
    ibmPlexSansBold,
    fetch(new URL('../../public/logo-white.png', import.meta.url)).then((res) =>
      res.arrayBuffer()
    ),
  ])

  const bytes = new Uint8Array(logoArrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const logoBase64 = `data:image/png;base64,${btoa(binary)}`

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background:
            'radial-gradient(ellipse at 50% 40%, #1e3a5f 0%, #122b4a 50%, #0f2440 100%)',
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          padding: '60px 90px',
        }}
      >
        {/* Logo — left-aligned, larger for crisper fine details */}
        <img
          src={logoBase64}
          width={550}
          height={156}
          style={{ marginBottom: '6px' }}
        />

        {/* Separator line */}
        <div
          style={{
            width: '140px',
            height: '2px',
            background: 'rgba(230, 45, 117, 0.4)',
            margin: '24px 0',
            borderRadius: '1px',
          }}
        />

        {/* Value proposition — left-aligned, dominant, IBM Plex Sans Bold */}
        <div
          style={{
            fontSize: 54,
            fontWeight: 700,
            color: '#E62D75',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            maxWidth: '1000px',
          }}
        >
          Overheidsbestedingen snel tot in detail doorzoeken en vergelijken
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'IBM Plex Sans',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  )
}
