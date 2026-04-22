import { ImageResponse } from 'next/og'
export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff7ed',
        fontFamily: 'sans-serif',
      }}>
        <div style={{
          fontSize: '72px',
          marginBottom: '20px'
        }}>🍱</div>
        <div style={{
          fontSize: '52px',
          fontWeight: 'bold',
          color: '#ea580c',
          textAlign: 'center',
          marginBottom: '16px',
          padding: '0 60px',
        }}>
          Smart Tiffin
        </div>
        <div style={{
          fontSize: '28px',
          color: '#374151',
          textAlign: 'center',
          padding: '0 80px',
        }}>
          Daily Fresh Ghar Ka Khana from PKR 200
        </div>
        <div style={{
          fontSize: '20px',
          color: '#6b7280',
          marginTop: '16px',
        }}>
          Lahore • Karachi • Islamabad • Rawalpindi
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
