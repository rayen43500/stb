/** En-tête STB partagé (connexion, inscription, activation). */
export function AuthBrandHeader({ title }: { title: string }) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #0A2463 0%, #1D4ED8 100%)',
          borderRadius: '12px',
          padding: '20px 16px',
        }}
      >
        <img
          src="/stb-logo.png"
          alt="STB Bank"
          style={{ height: '48px', width: 'auto', objectFit: 'contain', display: 'block' }}
        />
      </div>
      <h1
        style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#0F172A',
          textAlign: 'center',
          marginBottom: '24px',
        }}
      >
        {title}
      </h1>
    </>
  )
}
