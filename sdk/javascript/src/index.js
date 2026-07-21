/**
 * Official JavaScript SDK for the MetaGo Universal Protocol.
 * Hides raw WebSocket I/O and exposes the Unified Domain API to Web Clients.
 */
export class MetaGo {
    constructor(endpoint) {
        this.endpoint = endpoint;
        this.ws = null;
        this.subscriptions = new Map();
        this._authResolve = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            // Note: In Node.js environments you would inject the 'ws' package,
            // but for browsers, native WebSocket is leveraged.
            this.ws = new WebSocket(this.endpoint);
            this.ws.onopen = () => resolve(this);
            this.ws.onerror = (err) => reject(err);
            this.ws.onmessage = this._handleMessage.bind(this);
            this.ws.onclose = () => console.log("[MetaGo WebSDK] Disconnected.");
        });
    }

    async authenticate(token) {
        this._send("Auth.Request", { token });
        
        return new Promise((resolve) => {
            this._authResolve = resolve;
            
            // Replicate the 5-second AuthTimeout constraint globally defined in docs/protocol/error_codes.md
            setTimeout(() => {
                if (this._authResolve) {
                    this._authResolve = null;
                    resolve(false);
                }
            }, 5000);
        });
    }

    syncPresence(position, rotation = [0, 0, 0, 1]) {
        this._send("Presence.Update", { position, rotation });
    }

    subscribe(eventType, callback) {
        if (!this.subscriptions.has(eventType)) {
            this.subscriptions.set(eventType, []);
        }
        this.subscriptions.get(eventType).push(callback);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    _send(event, payload) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        
        // Strict mapping of the MetaGoEvent Envelope format to pass jsonschema validation
        const envelope = {
            version: "1.0",
            event: event,
            timestamp: Date.now() / 1000.0,
            payload: payload
        };
        this.ws.send(JSON.stringify(envelope));
    }

    _handleMessage(msg) {
        try {
            const data = JSON.parse(msg.data);
            const eventType = data.event;
            
            // Internal intercept for Lifecycle Handshakes
            if (eventType === "Auth.Success" && this._authResolve) {
                this._authResolve(true);
                this._authResolve = null;
            } else if (eventType === "Auth.Failed" && this._authResolve) {
                this._authResolve(false);
                this._authResolve = null;
            }

            // Execute developer-provided Domain callbacks
            const callbacks = this.subscriptions.get(eventType) || [];
            
            // Deliver just the Payload logic body, hiding the internal Envelope
            callbacks.forEach(cb => cb(data.payload));
            
        } catch (err) {
            console.error("[MetaGo WebSDK] Payload Parse Error:", err);
        }
    }
}
