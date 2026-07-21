import { engine, Transform, executeTask } from '@dcl/sdk/ecs'
// @ts-ignore
import { getUserData } from '~system/UserIdentity'

// Real connection to MetaGo Backend
const METAGO_BACKEND_URL = "ws://127.0.0.1:8001/api/v1/connectors/decentraland/stream"
let socket: WebSocket | null = null

export function main() {
    executeTask(async () => {
        // Fetch real player data from Decentraland
        const userData = await getUserData({})
        if (!userData || !userData.data) {
            console.error("MetaGo: Failed to fetch Decentraland Player Data")
            return
        }
        
        const walletAddress = userData.data.publicKey
        if (!walletAddress) {
            console.error("MetaGo: Player is a guest, cannot link to Web3 Identity")
            return
        }

        // Establish Real WebSocket
        socket = new WebSocket(METAGO_BACKEND_URL)
        
        socket.onopen = () => {
            console.log("MetaGo: Real WebSocket Connected")
            
            // Send Authentication Request
            // In production, sign a challenge. Here we use a pre-provisioned testing JWT.
            socket?.send(JSON.stringify({
                version: "1.0",
                event: "Auth.Request",
                timestamp: Math.floor(Date.now() / 1000),
                payload: {
                    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3YWxsZXRBZGRyZXNzIjoiMHg4NjI0YzU3OTdmZWZkMmU5NGYzYTg4MWI3ZjdhNzQ5MWE2YzcyZGQ0In0.TEST_TOKEN"
                }
            }))
        }

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)
            console.log("MetaGo Received:", data.event)
            
            if (data.event === "Auth.Success") {
                // Sync Identity using real DCL profile data
                socket?.send(JSON.stringify({
                    version: "1.0",
                    event: "Identity.Sync",
                    timestamp: Math.floor(Date.now() / 1000),
                    payload: {
                        did: `did:metago:${walletAddress}`,
                        handle: userData.data!.displayName,
                        status: "synchronized"
                    }
                }))
                
                // Sync Avatar Data using real DCL wearables
                const wearables = userData.data!.avatar?.wearables || []
                socket?.send(JSON.stringify({
                    version: "1.0",
                    event: "Avatar.Sync",
                    timestamp: Math.floor(Date.now() / 1000),
                    payload: {
                        avatar_url: `https://peer.decentraland.org/lambdas/profiles?id=${walletAddress}`,
                        wearables: wearables,
                        status: "synchronized"
                    }
                }))
            }
        }
        
        // Push Real-time Presence Data on tick
        engine.addSystem(RealtimePresenceSystem)
    })
}

// System to push real coordinates every 1 second
let timer = 0
function RealtimePresenceSystem(dt: number) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    
    timer += dt
    if (timer >= 1.0) { // every 1 sec
        timer = 0
        const player = engine.PlayerEntity
        if (!player) return
        
        const transform = Transform.getOrNull(player)
        if (transform) {
            socket.send(JSON.stringify({
                version: "1.0",
                event: "Presence.Update",
                timestamp: Math.floor(Date.now() / 1000),
                payload: {
                    position: [transform.position.x, transform.position.y, transform.position.z],
                    rotation: [transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w],
                    status: "online"
                }
            }))
        }
    }
}
