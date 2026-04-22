import './globals.css'

export const metadata = {
  title: 'What the Hours Become',
  description: 'Time → Money → Meaning',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
