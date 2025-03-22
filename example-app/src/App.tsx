import { createTheme, CssBaseline, ThemeProvider } from '@mui/material'
import { DemoPage } from './pages/DemoPage';

function App() {
  const theme = createTheme({ palette: { mode: 'dark' } })

  return <ThemeProvider theme={theme}>
    <CssBaseline />

    <DemoPage />
  </ThemeProvider>
}

export default App
