# MetaGo Presence Protocol

The Presence protocol defines how spatial and volumetric data is encoded when transmitting continuous state changes across the Universal Trust Protocol.

## Coordinate System

MetaGo assumes a **Right-Handed, Y-Up** coordinate system (similar to WebGL and OpenGL) as the universal translation layer. 
- `+Y` is Up.
- `+X` is Right.
- `+Z` is Forward (or Depth).

*Note: The Unity SDK handles automatic translation to its Left-Handed, Z-Forward system locally to hide this from developers.*

## Presence Payload Structure

Whenever a `Presence.Active` event is fired over the Transport Layer, the `payload` must contain the following strict structure:

### Position
A 3-element array of floating-point numbers `[x, y, z]` representing absolute world-space coordinates in meters.

### Rotation
A 4-element array of floating-point numbers `[x, y, z, w]` representing a normalized Quaternion.

### Example Payload
```json
{
    "user_id": "did:metago:0x8624c5...",
    "position": [1.5, 0.0, -2.3],
    "rotation": [0.0, 0.707, 0.0, 0.707]
}
```
