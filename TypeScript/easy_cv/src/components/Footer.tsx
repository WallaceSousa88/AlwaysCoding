export function Footer() {
  return (
    <footer
      style={{
        height: '40px',
        backgroundColor: '#f8f8f8',
        borderTop: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.9rem'
      }}
    >
      © {new Date().getFullYear()} EasyCV. Todos os direitos reservados.
    </footer>
  )
}