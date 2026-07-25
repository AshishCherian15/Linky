const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const http = require('http')
const { exec } = require('child_process')

const DEV_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'

let mainWindow
let localServer
let activeToken = ''

function startLocalServer(win) {
  if (localServer) return

  localServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-linky-token')

    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    const token = req.headers['x-linky-token'] || new URL(req.url, `http://${req.headers.host}`).searchParams.get('token')

    if (!activeToken || token !== activeToken) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return
    }

    if (req.method === 'GET' && req.url.startsWith('/status')) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'running' }))
      return
    }

    if (req.method === 'POST' && req.url === '/add-shortcut') {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', () => {
        try {
          const data = JSON.parse(body)
          if (data.url) {
            win.webContents.send('extension:add-shortcut', data)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: true }))
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'URL is required' }))
          }
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Invalid JSON' }))
        }
      })
      return
    }

    res.writeHead(404)
    res.end()
  })

  // Start on 49152
  localServer.listen(49152, '127.0.0.1', () => {
    console.log('Linky local HTTP sync server running on 127.0.0.1:49152')
  })

  localServer.on('error', (err) => {
    console.error('Sync server error:', err)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#060c1a',
    title: 'Linky',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  } else {
    mainWindow.loadURL(DEV_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Start local sync server
  startLocalServer(mainWindow)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

/* ══ IPC Handlers ══ */

// Update active security token from store
ipcMain.on('linky:update-token', (event, token) => {
  activeToken = token
})

// Fetch metadata from URL
ipcMain.handle('linky:fetch-meta', async (event, url) => {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Linky/1.0' },
      signal: AbortSignal.timeout(6000)
    })
    if (!res.ok) return { title: '', description: '' }
    const html = await res.text()
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''

    // Extract description
    let description = ''
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i) ||
                      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    if (descMatch) {
      description = descMatch[1].trim()
    }
    
    return { title, description }
  } catch (err) {
    console.error('Failed to fetch URL metadata:', err)
    return { title: '', description: '' }
  }
})

// Launch a specific browser
ipcMain.on('linky:launch-browser', (event, { browser, url }) => {
  const platform = process.platform
  let cmd = ''

  if (platform === 'win32') {
    if (browser === 'chrome') cmd = `start chrome "${url}"`
    else if (browser === 'firefox') cmd = `start firefox "${url}"`
    else if (browser === 'edge') cmd = `start msedge "${url}"`
    else if (browser === 'brave') cmd = `start brave "${url}"`
  } else if (platform === 'darwin') {
    if (browser === 'chrome') cmd = `open -a "Google Chrome" "${url}"`
    else if (browser === 'firefox') cmd = `open -a "Firefox" "${url}"`
    else if (browser === 'edge') cmd = `open -a "Microsoft Edge" "${url}"`
    else if (browser === 'brave') cmd = `open -a "Brave Browser" "${url}"`
  } else {
    // Linux
    if (browser === 'chrome') cmd = `google-chrome "${url}" || chromium-browser "${url}"`
    else if (browser === 'firefox') cmd = `firefox "${url}"`
    else if (browser === 'edge') cmd = `microsoft-edge "${url}"`
    else if (browser === 'brave') cmd = `brave-browser "${url}"`
  }

  if (cmd) {
    exec(cmd, (err) => {
      if (err) {
        console.error(`Failed to launch browser: ${browser}. Falling back to default open.`, err)
        shell.openExternal(url)
      }
    })
  } else {
    shell.openExternal(url)
  }
})

// Broken Link Checker check API
ipcMain.handle('linky:check-link', async (event, url) => {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Linky/1.0' },
      signal: AbortSignal.timeout(6000)
    })
    return res.status < 400
  } catch {
    return false
  }
})
