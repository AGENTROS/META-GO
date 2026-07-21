import { engine, Transform, MeshRenderer, TextShape, executeTask } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
// @ts-ignore
import { getUserData } from '~system/UserIdentity'

// Real connection to MetaGo Backend
const METAGO_BACKEND_URL = "ws://127.0.0.1:8001/api/v1/connectors/decentraland/stream"
let socket: WebSocket | null = null

export function main() {
    // 1. Add 3D scene entity so Decentraland engine completes scene load
    const platform = engine.addEntity()
    Transform.create(platform, {
        position: Vector3.create(8, 0.1, 8),
        scale: Vector3.create(14, 0.2, 14)
    })
    MeshRenderer.setBox(platform)

    const title = engine.addEntity()
    Transform.create(title, {
        position: Vector3.create(8, 2.5, 8)
    })
    TextShape.create(title, {
        text: "MetaGo Identity Protocol",
        fontSize: 3
    })

    executeTask(async () => {
        let walletAddress = "0x8624c5797fefd2e94f3a881b7f7a7491a6c72dd4"
        let displayName = "MetaGo User"
        let wearables: string[] = []

        try {
            const userData = await getUserData({})
            if (userData && userData.data) {
                if (userData.data.publicKey) walletAddress = userData.data.publicKey
                if (userData.data.displayName) displayName = userData.data.displayName
                if (userData.data.avatar?.wearables) wearables = userData.data.avatar.wearables
            }
        } catch (e) {
            console.log("MetaGo: Guest mode / default profile")
        }

        // Establish Real WebSocket
        socket = new WebSocket(METAGO_BACKEND_URL)
        
        socket.onopen = () => {
            console.log("MetaGo: Real WebSocket Connected")
            
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
                socket?.send(JSON.stringify({
                    version: "1.0",
                    event: "Identity.Sync",
                    timestamp: Math.floor(Date.now() / 1000),
                    payload: {
                        did: `did:metago:${walletAddress}`,
                        handle: displayName,
                        status: "synchronized"
                    }
                }))
                
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
        
        engine.addSystem(RealtimePresenceSystem)
    })
}

let timer = 0
function RealtimePresenceSystem(dt: number) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    
    timer += dt
    if (timer >= 1.0) {
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
