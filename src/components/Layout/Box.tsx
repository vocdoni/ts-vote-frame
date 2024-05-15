export const Box = ({ style, ...props }: any) => (
  <div
    style={{
      background:
        'linear-gradient(90.68deg, rgba(255, 255, 255, 0.25) 1.37%, rgba(255, 255, 255, 0.125) 99.55%)',
      backgroundFilter: 'blur(8px)',
      borderRadius: '12px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      color: 'white',
      padding: '20px',
      fontFamily: 'Inter',
      fontWeight: 700,
      lineHeight: 1.1,
      maxWidth: '600px',
      display: 'flex',
      flexDirection: 'column',
      textAlign: 'left',
      position: 'relative',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderBottom: 'none',
      ...style,
    }}
    {...props}
  />
)
