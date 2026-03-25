const fs = require('fs');
const path = require('path');
const http = require('http');

const EXPORT_DIR = path.join(__dirname, 'export');
const PORT = 3000;

// Files and directories to include in the export
const INCLUDED_PATHS = ['index.html', 'css', 'js'];

// Recursive copy function
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        // Ensure directory exists
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(src, dest);
    }
}

// Perform initial export
function exportProject() {
    console.log('Exporting project files...');
    if (!fs.existsSync(EXPORT_DIR)) {
        fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }
    
    INCLUDED_PATHS.forEach((p) => {
        const srcPath = path.join(__dirname, p);
        const destPath = path.join(EXPORT_DIR, p);
        if (fs.existsSync(srcPath)) {
            copyRecursiveSync(srcPath, destPath);
        }
    });
    console.log('Export complete. Files are in the /export folder.');
}

// Simple debounce for the file watcher
let timeout;
function handleFileChange(eventType, filename) {
    if (filename && filename.startsWith('export')) return; // ignore changes in export dir
    if (filename && filename.endsWith('.js') && !filename.includes('/') && !filename.includes('\\')) {
        if (filename === 'export.js') return; // ignore self
    }

    clearTimeout(timeout);
    timeout = setTimeout(() => {
        console.log(`Change detected (${filename}). Updating export directory...`);
        exportProject();
    }, 300); // 300ms debounce
}

// Watch files
function watchProject() {
    INCLUDED_PATHS.forEach((p) => {
        const watchPath = path.join(__dirname, p);
        if (fs.existsSync(watchPath)) {
            fs.watch(watchPath, { recursive: true }, handleFileChange);
        }
    });
    console.log('Watching for file changes...');
}

// Simple web server for hosting
function serveExport() {
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.json': 'application/json'
    };

    const server = http.createServer((req, res) => {
        // Enable CORS for all requests so the local file:/// can talk to localhost:3000
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // --- API ENDPOINTS ---
        if (req.url === '/api/data') {
            const dataFilepath = path.join(__dirname, 'finance_data.json');

            if (req.method === 'GET') {
                if (fs.existsSync(dataFilepath)) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    fs.createReadStream(dataFilepath).pipe(res);
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'No data file found yet.' }));
                }
                return;
            }

            if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    try {
                        JSON.parse(body); // Validate JSON
                        fs.writeFileSync(dataFilepath, body, 'utf8');
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                        console.log('✅ Data saved to finance_data.json');
                    } catch (e) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
                        console.error('❌ Failed to save data (Invalid JSON)');
                    }
                });
                return;
            }
        }

        // --- STATIC FILES ---
        let filePath = path.join(EXPORT_DIR, req.url === '/' ? 'index.html' : req.url);
        
        // Basic security check (prevent directory traversal)
        if (!filePath.startsWith(EXPORT_DIR)) {
            res.writeHead(403);
            res.end();
            return;
        }

        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(filePath, (error, content) => {
            if (error) {
                if(error.code == 'ENOENT') {
                    res.writeHead(404);
                    res.end('File not found');
                } else {
                    res.writeHead(500);
                    res.end('Server error: '+error.code);
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    });

    server.listen(PORT, () => {
        console.log(`Hosting exported app locally at http://localhost:${PORT}`);
    });
}

// Run everything
exportProject();
watchProject();
serveExport();
