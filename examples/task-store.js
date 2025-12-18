const fs = require('fs');
const path = require('path');

function ensureDirSync(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function safeParseJson(text) {
    try {
        return JSON.parse(text);
    } catch (_) {
        return null;
    }
}

class TaskStore {
    constructor(options = {}) {
        const defaultPath = path.join(__dirname, '.runtime', 'tasks.json');
        this.filePath = options.filePath || process.env.TASK_STORE_PATH || defaultPath;
        this.tasks = new Map();
        this._persistChain = Promise.resolve();
        this._loadFromDisk();
    }

    _loadFromDisk() {
        try {
            if (!fs.existsSync(this.filePath)) return;
            const raw = fs.readFileSync(this.filePath, 'utf8');
            const parsed = safeParseJson(raw);
            if (!parsed || !Array.isArray(parsed.tasks)) {
                this._backupCorruptFile(raw);
                return;
            }
            parsed.tasks.forEach(task => {
                if (task && task.id) this.tasks.set(task.id, task);
            });
        } catch (_) {
            // ignore
        }
    }

    _backupCorruptFile(raw) {
        try {
            const dir = path.dirname(this.filePath);
            const base = path.basename(this.filePath, path.extname(this.filePath));
            const backup = path.join(dir, `${base}.corrupt.${Date.now()}.json`);
            ensureDirSync(dir);
            fs.writeFileSync(backup, raw, 'utf8');
        } catch (_) {
            // ignore
        }
        try {
            fs.unlinkSync(this.filePath);
        } catch (_) {
            // ignore
        }
    }

    get(id) {
        return this.tasks.get(id) || null;
    }

    set(id, task) {
        this.tasks.set(id, task);
        this._persistAsync();
    }

    delete(id) {
        this.tasks.delete(id);
        this._persistAsync();
    }

    list() {
        return Array.from(this.tasks.values());
    }

    _persistAsync() {
        this._persistChain = this._persistChain
            .then(() => this._persistNow())
            .catch(() => {
                // keep chain alive
            });
    }

    async _persistNow() {
        const dir = path.dirname(this.filePath);
        ensureDirSync(dir);
        const tempPath = `${this.filePath}.tmp`;
        const data = JSON.stringify({ version: 1, tasks: this.list() }, null, 2);
        await fs.promises.writeFile(tempPath, data, 'utf8');
        await fs.promises.rename(tempPath, this.filePath);
    }
}

module.exports = TaskStore;

