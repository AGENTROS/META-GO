using UnityEngine;
using MetaGo;
using System.Threading.Tasks;

public class MetaGoEventListener : MonoBehaviour
{
    private MetaGoClient _sdk;
    
    // In a real production app, this would be injected via a configuration UI
    public string backendEndpoint = "ws://localhost:8000/api/v1/connectors/unity/stream";
    public string authenticationToken = "mock_valid_token";
    
    async void Start()
    {
        Debug.Log("====================================");
        Debug.Log(" MetaGo Unity SDK : Event Sandbox");
        Debug.Log("====================================");
        
        _sdk = new MetaGoClient(backendEndpoint);
        
        Debug.Log("[1/3] Connecting to Transport Layer...");
        await _sdk.Connect();
        
        Debug.Log("[2/3] Authenticating...");
        bool success = await _sdk.Authenticate(authenticationToken);
        
        if (success)
        {
            Debug.Log("[3/3] Auth Success! Booting subscriptions...");
            
            // Map the event directly into the Unity Engine
            _sdk.Subscribe("Presence.Active", (jsonPayload) => 
            {
                // Important: WebSocket callbacks run on a background thread.
                // If you intend to call GameObject.Instantiate or Transform.position,
                // you must dispatch this action to the Unity Main Thread.
                Debug.Log($"-> Global Event Received | Presence: {jsonPayload}");
            });
            
            // Example usage of SyncPresence (e.g. called inside Unity Update loop at 10hz)
            // await _sdk.SyncPresence(new float[]{0f, 1f, 0f}, new float[]{0f, 0f, 0f, 1f});
        }
        else
        {
            Debug.LogError("[!] MetaGo Authentication Failed. Check backend status.");
        }
    }
    
    async void OnDestroy()
    {
        if (_sdk != null)
        {
            await _sdk.Disconnect();
        }
    }
}
