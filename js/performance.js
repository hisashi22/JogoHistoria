/**
 * Performance Monitoring and Optimization Utilities
 * Provides profiling, caching, and debug tools for large world performance
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.enabled = false;
        this.frameTimings = [];
        this.maxFrameTimings = 60;
    }

    enable() {
        this.enabled = true;
        console.log('Monitoramento de desempenho ativado');
    }

    disable() {
        this.enabled = false;
    }

    startTimer(label) {
        if (!this.enabled) return null;
        return {
            label,
            start: performance.now()
        };
    }

    endTimer(timer) {
        if (!this.enabled || !timer) return null;
        const duration = performance.now() - timer.start;
        
        if (!this.metrics[timer.label]) {
            this.metrics[timer.label] = {
                count: 0,
                total: 0,
                min: Infinity,
                max: 0,
                avg: 0
            };
        }

        const metric = this.metrics[timer.label];
        metric.count++;
        metric.total += duration;
        metric.min = Math.min(metric.min, duration);
        metric.max = Math.max(metric.max, duration);
        metric.avg = metric.total / metric.count;
        return duration;
    }

    recordFrame(duration) {
        if (!this.enabled) return;
        this.frameTimings.push(duration);
        if (this.frameTimings.length > this.maxFrameTimings) {
            this.frameTimings.shift();
        }
    }

    getMetrics() {
        const copy = {};
        for (const [label, metric] of Object.entries(this.metrics)) {
            copy[label] = { ...metric };
        }
        return copy;
    }

    getFrameStats() {
        if (this.frameTimings.length === 0) return null;
        
        const sorted = [...this.frameTimings].sort((a, b) => a - b);
        return {
            avg: this.frameTimings.reduce((a, b) => a + b, 0) / this.frameTimings.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            p50: sorted[Math.floor(sorted.length * 0.5)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
            fps: 1000 / (this.frameTimings.reduce((a, b) => a + b, 0) / this.frameTimings.length)
        };
    }

    reset() {
        this.metrics = {};
        this.frameTimings = [];
    }

    printReport() {
        console.log('=== Relatório de Desempenho ===');
        console.log('Métricas::');
        Object.entries(this.metrics).forEach(([label, metric]) => {
            console.log(`  ${label}:`);
            console.log(`    Count: ${metric.count}`);
            console.log(`    Avg: ${metric.avg.toFixed(2)}ms`);
            console.log(`    Min: ${metric.min.toFixed(2)}ms`);
            console.log(`    Max: ${metric.max.toFixed(2)}ms`);
        });

        const frameStats = this.getFrameStats();
        if (frameStats) {
            console.log('Estatísticas de Quadros:');
            console.log(`  FPS: ${frameStats.fps.toFixed(1)}`);
            console.log(`  Avg: ${frameStats.avg.toFixed(2)}ms`);
            console.log(`  P50: ${frameStats.p50.toFixed(2)}ms`);
            console.log(`  P95: ${frameStats.p95.toFixed(2)}ms`);
            console.log(`  P99: ${frameStats.p99.toFixed(2)}ms`);
        }
    }
}

class RenderCache {
    constructor(maxSize = 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.hits = 0;
        this.misses = 0;
    }

    get(key) {
        if (this.cache.has(key)) {
            this.hits++;
            const entry = this.cache.get(key);
            // Keep LRU order by moving hits to the end of insertion order.
            this.cache.delete(key);
            this.cache.set(key, entry);
            return entry.value;
        }
        this.misses++;
        return null;
    }

    set(key, value) {
        const exists = this.cache.has(key);
        if (exists) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }
        this.cache.set(key, { value });
    }

    evictOldest() {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey !== undefined) {
            this.cache.delete(oldestKey);
        }
    }

    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    getStats() {
        const total = this.hits + this.misses;
        return {
            size: this.cache.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? (this.hits / total * 100).toFixed(1) + '%' : 'N/A'
        };
    }
}

// Global instances
const perfMonitor = new PerformanceMonitor();
const renderCache = new RenderCache(4000);

// Expose to window for debugging
if (typeof window !== 'undefined') {
    window.perfMonitor = perfMonitor;
    window.renderCache = renderCache;
    window.enablePerformanceMonitoring = () => perfMonitor.enable();
    window.disablePerformanceMonitoring = () => perfMonitor.disable();
    window.getPerformanceReport = () => perfMonitor.printReport();
    window.getRenderCacheStats = () => renderCache.getStats();
}
