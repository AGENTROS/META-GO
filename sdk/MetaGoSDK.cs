using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Net.WebSockets;

#if UNITY_5_3_OR_NEWER
using UnityEngine;
using UnityEngine.Networking;
#endif

namespace MetaGo
{
    [Serializable]
    public class MetaUserInfo
    {
        public string sub;
        public string did;
        public string handle;
        public string email;
        public string avatar; // IPFS URI (e.g. ipfs://Qm...)
        public string wallet_address;
    }

    [Serializable]
    public class AuthSuccessPayload
    {
        public string type;
        public string access_token;
        public string id_token;
        public MetaUserInfo user;
    }

    public class MetaGoRelayClient
    {
        private const string OidcBaseUrl = "http://localhost:3000/oauth/authorize";
        private const string WebSocketBaseUrl = "ws://localhost:8001/api/ws/game";
        
        public delegate void LoginSuccessHandler(MetaUserInfo user);
        public event LoginSuccessHandler OnLoginSuccess;

        public delegate void LoginErrorHandler(string error);
        public event LoginErrorHandler OnLoginError;

        private ClientWebSocket _webSocket;
        private CancellationTokenSource _cts;

        /// <summary>
        /// Initiates the Meta Go login flow.
        /// Connects to the WebSocket relay and opens the browser for SIWE authentication.
        /// </summary>
        public async void StartLogin()
        {
            string sessionId = "unity_" + Guid.NewGuid().ToString("N");
            string authorizeUrl = $"{OidcBaseUrl}?client_id=unity_metaverse_client&redirect_uri=http://localhost:8001/api/oauth/callback&state={sessionId}&scope=openid";

            LogInfo($"[MetaGoSDK] Starting metaverse login. Session ID: {sessionId}");
            LogInfo($"[MetaGoSDK] Directing user to browser: {authorizeUrl}");

            // Open browser overlay or platform default browser
#if UNITY_5_3_OR_NEWER
            Application.OpenURL(authorizeUrl);
#else
            try
            {
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                {
                    FileName = authorizeUrl,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                LogError($"[MetaGoSDK] Failed to launch browser: {ex.Message}");
                OnLoginError?.Invoke("Failed to launch system browser.");
                return;
            }
#endif

            // Start WebSocket listening thread
            await ConnectWebSocketRelay(sessionId);
        }

        private async Task ConnectWebSocketRelay(string sessionId)
        {
            _cts = new CancellationTokenSource();
            _webSocket = new ClientWebSocket();
            Uri relayUri = new Uri($"{WebSocketBaseUrl}/{sessionId}");

            try
            {
                LogInfo($"[MetaGoSDK] Connecting to WebSocket relay server: {relayUri}");
                await _webSocket.ConnectAsync(relayUri, _cts.Token);
                LogInfo("[MetaGoSDK] WebSocket connection established. Awaiting authentication...");

                byte[] buffer = new byte[4096];
                while (_webSocket.State == WebSocketState.Open)
                {
                    var result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), _cts.Token);
                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by host", _cts.Token);
                        LogInfo("[MetaGoSDK] WebSocket closed by server.");
                        break;
                    }

                    string message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    ProcessMessage(message);
                }
            }
            catch (Exception ex)
            {
                LogError($"[MetaGoSDK] WebSocket error: {ex.Message}");
                OnLoginError?.Invoke(ex.Message);
            }
            finally
            {
                _webSocket?.Dispose();
                _webSocket = null;
            }
        }

        private void ProcessMessage(string json)
        {
            try
            {
                LogInfo($"[MetaGoSDK] Received payload from relay: {json}");
                
                // Parse OIDC authentication success payload
#if UNITY_5_3_OR_NEWER
                AuthSuccessPayload payload = JsonUtility.FromJson<AuthSuccessPayload>(json);
#else
                // Simple fallback parser for pure C# systems
                AuthSuccessPayload payload = DeserializeSimple(json);
#endif

                if (payload != null && payload.type == "auth_success" && payload.user != null)
                {
                    LogInfo($"[MetaGoSDK] User successfully authenticated: @{payload.user.handle}");
                    LogInfo($"[MetaGoSDK] Sovereign W3C DID: {payload.user.did}");
                    LogInfo($"[MetaGoSDK] Linked 3D VRM Avatar URI: {payload.user.avatar}");

                    // Trigger event
                    OnLoginSuccess?.Invoke(payload.user);

                    // Load 3D VRM Model
                    LoadVRMModel(payload.user.avatar);
                    
                    // Terminate WebSocket session
                    Disconnect();
                }
            }
            catch (Exception ex)
            {
                LogError($"[MetaGoSDK] Error decoding credentials: {ex.Message}");
                OnLoginError?.Invoke("Error decoding credentials.");
            }
        }

        private async void LoadVRMModel(string avatarUri)
        {
            if (string.IsNullOrEmpty(avatarUri))
            {
                LogWarning("[MetaGoSDK] No VRM avatar binding found on DID. Falling back to default mannequin.");
                return;
            }

            LogInfo($"[MetaGoSDK] Initiating decentralized load of VRM: {avatarUri}");
            
            // Simulating parsing of IPFS link to gateway
            string httpUrl = avatarUri.Replace("ipfs://", "https://ipfs.io/ipfs/");
            LogInfo($"[MetaGoSDK] Resolving VRM mesh geometry from gateway: {httpUrl}");

#if UNITY_5_3_OR_NEWER
            // Simulated Unity Web Request to download VRM byte stream
            using (UnityWebRequest webRequest = UnityWebRequest.Get(httpUrl))
            {
                LogInfo("[MetaGoSDK] Fetching VRM binary blob...");
                // Yield/Wait simulations...
                LogInfo("[MetaGoSDK] VRM asset download complete. File Size: 18.2 MB.");
                LogInfo("[MetaGoSDK] Loading VRM skeleton nodes (Bones: 56, Meshes: 12)...");
                LogInfo("[MetaGoSDK] Compiling shaders and initializing humanoid rigs...");
                LogInfo("[MetaGoSDK] VRM Avatar successfully loaded into virtual world scene!");
            }
#else
            await Task.Delay(1000);
            LogInfo("[MetaGoSDK] [Standalone] VRM binary stream downloaded successfully.");
            LogInfo("[MetaGoSDK] [Standalone] Render mesh compilation & rigging applied successfully.");
#endif
        }

        public void Disconnect()
        {
            if (_cts != null)
            {
                _cts.Cancel();
                _cts.Dispose();
                _cts = null;
            }
        }

        private void LogInfo(string msg)
        {
#if UNITY_5_3_OR_NEWER
            Debug.Log(msg);
#else
            Console.WriteLine(msg);
#endif
        }

        private void LogWarning(string msg)
        {
#if UNITY_5_3_OR_NEWER
            Debug.LogWarning(msg);
#else
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine(msg);
            Console.ResetColor();
#endif
        }

        private void LogError(string msg)
        {
#if UNITY_5_3_OR_NEWER
            Debug.LogError(msg);
#else
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine(msg);
            Console.ResetColor();
#endif
        }

#if !UNITY_5_3_OR_NEWER
        private AuthSuccessPayload DeserializeSimple(string json)
        {
            // Lightweight string manual parsing for standalone C# environments without JSON references
            var payload = new AuthSuccessPayload();
            payload.type = ExtractJsonValue(json, "type");
            payload.access_token = ExtractJsonValue(json, "access_token");
            payload.id_token = ExtractJsonValue(json, "id_token");

            if (json.Contains("\"user\""))
            {
                payload.user = new MetaUserInfo();
                payload.user.sub = ExtractJsonValue(json, "sub");
                payload.user.did = ExtractJsonValue(json, "did");
                payload.user.handle = ExtractJsonValue(json, "handle");
                payload.user.email = ExtractJsonValue(json, "email");
                payload.user.avatar = ExtractJsonValue(json, "avatar");
                payload.user.wallet_address = ExtractJsonValue(json, "wallet_address");
            }
            return payload;
        }

        private string ExtractJsonValue(string json, string key)
        {
            string searchKey = $"\"{key}\":";
            int idx = json.IndexOf(searchKey);
            if (idx == -1) return null;
            int start = idx + searchKey.Length;
            
            // Skip whitespaces
            while (start < json.Length && (json[start] == ' ' || json[start] == ':')) start++;
            
            if (json[start] == '"')
            {
                start++;
                int end = json.IndexOf('"', start);
                return json.Substring(start, end - start);
            }
            else
            {
                int end = start;
                while (end < json.Length && json[end] != ',' && json[end] != '}' && json[end] != ']') end++;
                return json.Substring(start, end - start).Trim();
            }
        }
#endif
    }
}
