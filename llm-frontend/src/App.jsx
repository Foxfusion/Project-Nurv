import { useState } from "react";
import "./App.css";

function App() {
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!message.trim()) return;

        const userMessage = message;

        setChat((prev) => [
            ...prev,
            { role: "user", text: userMessage }
        ]);

        setMessage("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:3001/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: userMessage,
                    model: "llama3"
                })
            });

            const data = await response.json();

            setChat((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: data.reply || "No response received."
                }
            ]);
        } catch (err) {
            setChat((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: "Error talking to backend: " + err.message
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="app">
            <h1>FoxBot LLM Chat</h1>

            <div className="chat-box">
                {chat.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <strong>{msg.role === "user" ? "You" : "FoxBot"}:</strong>
                        <p>{msg.text}</p>
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
            onChange={(e) => setMessage(e.target.value)}
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