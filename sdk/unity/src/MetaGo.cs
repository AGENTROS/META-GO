using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Net.WebSockets;
using System.Collections.Generic;

#if UNITY_5_3_OR_NEWER
using UnityEngine;
#endif

namespace MetaGo
{
    /// <summary>
    /// Official Unity SDK for the MetaGo Universal Protocol.
    /// Hides raw WebSocket I/O and exposes the unified Domain API.
    /// </summary>
    public class MetaGoClient
    {
        private string _endpoint;
        private ClientWebSocket _webSocket;
        private CancellationTokenSource _cts;
        private Dictionary<string, Action<string>> _subscriptions = new Dictionary<string, Action<string>>();
        private TaskCompletionSource<bool> _authTcs;
        
        public MetaGoClient(string endpoint)
        {
            _endpoint = endpoint;
        }
        
        public async Task Connect()
        {
            _cts = new CancellationTokenSource();
            _webSocket = new ClientWebSocket();
            Uri uri = new Uri(_endpoint);
            
            await _webSocket.ConnectAsync(uri, _cts.Token);
            _ = Task.Run(ListenLoop, _cts.Token);
            LogInfo($"[MetaGo SDK] Connected to Transport Layer: {_endpoint}");
        }
        
        public async Task<bool> Authenticate(string token)
        {
            _authTcs = new TaskCompletionSource<bool>();
            
            // Constructing standard v1.0 Envelope
            string authJson = $"{{\"version\":\"1.0\",\"event\":\"Auth.Request\",\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeSeconds()},\"payload\":{{\"token\":\"{token}\"}}}}";
            await SendRaw(authJson);
            
            // Await auth response up to 5 seconds to prevent locking
            var task = await Task.WhenAny(_authTcs.Task, Task.Delay(5000));
            if (task == _authTcs.Task) return await _authTcs.Task;
            return false;
        }
        
        public async Task SyncPresence(float[] position, float[] rotation)
        {
            string pos = $"[{position[0]:F3},{position[1]:F3},{position[2]:F3}]";
            string rot = $"[{rotation[0]:F3},{rotation[1]:F3},{rotation[2]:F3},{rotation[3]:F3}]";
            string payload = $"{{\"position\":{pos},\"rotation\":{rot}}}";
            
            string json = $"{{\"version\":\"1.0\",\"event\":\"Presence.Update\",\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeSeconds()},\"payload\":{payload}}}";
            await SendRaw(json);
        }

        public async Task SyncIdentity(string did, string handle)
        {
            string payload = $"{{\"did\":\"{did}\",\"handle\":\"{handle}\"}}";
            string json = $"{{\"version\":\"1.0\",\"event\":\"Identity.Sync\",\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeSeconds()},\"payload\":{payload}}}";
            await SendRaw(json);
        }

        public async Task SyncAvatar(string avatarUrl, string outfitId)
        {
            string payload = $"{{\"avatar_url\":\"{avatarUrl}\",\"outfit_id\":\"{outfitId}\"}}";
            string json = $"{{\"version\":\"1.0\",\"event\":\"Avatar.Update\",\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeSeconds()},\"payload\":{payload}}}";
            await SendRaw(json);
        }

        public async Task SyncPassport(string country, string level)
        {
            string payload = $"{{\"country\":\"{country}\",\"level\":\"{level}\"}}";
            string json = $"{{\"version\":\"1.0\",\"event\":\"Passport.Sync\",\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeSeconds()},\"payload\":{payload}}}";
            await SendRaw(json);
        }
        
        public void Subscribe(string eventType, Action<string> callback)
        {
            if (!_subscriptions.ContainsKey(eventType))
                _subscriptions[eventType] = callback;
            else
                _subscriptions[eventType] += callback;
        }
        
        public async Task VerifyCredential(string documentHash)
        {
            string payload = $"{{\"document_hash\":\"{documentHash}\"}}";
            string json = $"{{\"version\":\"1.0\",\"event\":\"Credential.Upload\",\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeSeconds()},\"payload\":{payload}}}";
            await SendRaw(json);
        }
        
        public async Task Disconnect()
        {
            if (_cts != null)
            {
                _cts.Cancel();
                _cts.Dispose();
                _cts = null;
            }
            if (_webSocket != null && _webSocket.State == WebSocketState.Open)
            {
                await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Client shutting down", CancellationToken.None);
            }
            LogInfo("[MetaGo SDK] Disconnected gracefully.");
        }
        
        private async Task SendRaw(string json)
        {
            if (_webSocket == null || _webSocket.State != WebSocketState.Open) return;
            var bytes = Encoding.UTF8.GetBytes(json);
            await _webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, _cts.Token);
        }
        
        private async Task ListenLoop()
        {
            byte[] buffer = new byte[8192];
            try
            {
                while (_webSocket.State == WebSocketState.Open && !_cts.Token.IsCancellationRequested)
                {
                    var result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), _cts.Token);
                    if (result.MessageType == WebSocketMessageType.Close) break;
                    
                    string json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    ProcessMessage(json);
                }
            }
            catch (Exception ex)
            {
                if (!_cts.Token.IsCancellationRequested) LogError($"[MetaGo SDK] Listen error: {ex.Message}");
            }
        }
        
        private void ProcessMessage(string json)
        {
            string eventType = ExtractJsonValue(json, "event");
            string payload = ExtractJsonValue(json, "payload", true);
            
            if (eventType == "Auth.Success" && _authTcs != null && !_authTcs.Task.IsCompleted)
                _authTcs.SetResult(true);
            else if (eventType == "Auth.Failed" && _authTcs != null && !_authTcs.Task.IsCompleted)
                _authTcs.SetResult(false);
                
            if (eventType != null && _subscriptions.ContainsKey(eventType))
            {
                // Invoke callback with the raw JSON payload.
                // In Unity, developers will use JsonUtility to deserialize into their own Structs.
                _subscriptions[eventType]?.Invoke(payload);
            }
        }
        
        // Lightweight regex-free parser optimized for C# without NewtonSoft dependency
        private string ExtractJsonValue(string json, string key, bool isObject = false)
        {
            string search = $"\"{key}\":";
            int idx = json.IndexOf(search);
            if (idx == -1) return null;
            
            int start = idx + search.Length;
            while (start < json.Length && (json[start] == ' ' || json[start] == ':')) start++;
            
            if (isObject)
            {
                if (json[start] == '{')
                {
                    int braces = 1, end = start + 1;
                    while (end < json.Length && braces > 0)
                    {
                        if (json[end] == '{') braces++;
                        if (json[end] == '}') braces--;
                        end++;
                    }
                    return json.Substring(start, end - start);
                }
            }
            
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
        
        private void LogInfo(string msg)
        {
#if UNITY_5_3_OR_NEWER
            Debug.Log(msg);
#else
            Console.WriteLine(msg);
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
    }
}
