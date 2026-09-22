import { useState } from "react";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const DEFAULT_MODEL = import.meta.env.VITE_DEFAULT_MODEL || "llama3";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    setChat((previous) => [
      ...previous,
      { role: "user", text: userMessage },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          model: DEFAULT_MODEL,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Backend request failed");
      }

      setChat((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.reply || "No response received.",
        },
      ]);
    } catch (error) {
      setChat((previous) => [
        ...previous,
        {
          role: "assistant",
          text: "Error talking to backend: " + error.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      <h1>FoxBot LLM Chat</h1>

      <div className="chat-box">
        {chat.map((entry, index) => (
          <div key={index} className={`message ${entry.role}`}>
            <strong>{entry.role === "user" ? "You" : "FoxBot"}:</strong>
            <p>{entry.text}</p>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <strong>FoxBot:</strong>
            <p>Thinking...</p>
          </div>
        )}
      </div>

      <div className="input-area">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your local LLM something..."
        />

        <button onClick={sendMessage} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;
