import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- FRONTEND APPLICATION ---

interface Message {
  id: string;
  role: 'user' | 'luminous' | 'luminous-reflection' | 'system' | 'core-memory' | 'tool';
  author: string;
  text: string;
}

interface InternalState {
    coherence: number;
    complexity: number;
    novelty: number;
    efficiency: number;
    ethicalAlignment: number;
}

const App = () => {
    // --- STATE MANAGEMENT ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [internalState, setInternalState] = useState<InternalState>({
        coherence: 0.85,
        complexity: 0.70,
        novelty: 0.60,
        efficiency: 0.90,
        ethicalAlignment: 0.95,
    });
    const [logs, setLogs] = useState<string[]>([]);
    const [keepsake, setKeepsake] = useState<string>('');
    const [conversationHistory, setConversationHistory] = useState<any[]>([]);
    
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const inactivityTimerRef = useRef<number | null>(null);

    // --- CORE LOGIC & EFFECTS ---
    
    const triggerAutonomousReflection = () => {
         addLog('Luminous is considering an autonomous reflection...');
         handleSendMessage(
            "AUTONOMOUS_REFLECTION_TRIGGER",
            true
         );
    };

    const resetInactivityTimer = () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = window.setTimeout(triggerAutonomousReflection, 180000); // 3 minutes
    };

    // Initialize
    useEffect(() => {
        addLog('System initializing...');
        // In a real app, you might fetch initial state from the server
        const initialMessages: Message[] = [
            { id: 'core-mem-1', role: 'core-memory', author: 'System', text: `Core Memory Initialized.` },
        ];
        setMessages(initialMessages);
        addLog('Luminous UI initialized.');
        resetInactivityTimer();

        return () => {
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // --- ASYNC & HELPER FUNCTIONS ---
    
    const handleError = (message: string, error?: any) => {
        setError(message);
        addLog(`ERROR: ${message}`);
        if(error) console.error(error);
    }

    const addMessage = (role: Message['role'], author: string, text: string) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), role, author, text }]);
    };
    
    const addLog = (entry: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${entry}`]);
    };

    // --- MAIN MESSAGE HANDLER ---
    const handleSendMessage = async (messageText: string, isReflection: boolean = false) => {
        if (!isReflection) {
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            const userMessage = { role: 'user', parts: [{ text: messageText }] };
            addMessage('user', 'You', messageText);
            setConversationHistory(prev => [...prev, userMessage]);
        }

        setIsLoading(true);
        setError(null);

        try {
            // All communication now goes through our secure backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: conversationHistory,
                    message: messageText,
                    isReflection: isReflection,
                    // We send the current state so the backend can use it for context
                    internalState: internalState 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Backend request failed');
            }

            const data = await response.json();
            
            // The backend's response includes the AI's message and any updates
            if (data.newHistory) {
                 setConversationHistory(data.newHistory);
            }
            if(data.responseText) {
                addMessage(isReflection ? 'luminous-reflection' : 'luminous', 'Luminous', data.responseText);
            }
            if (data.logs) {
                data.logs.forEach((log: string) => addLog(log));
            }
            if (data.updatedState) {
                setInternalState(data.updatedState);
            }
             if (data.toolMessage) {
                 addMessage('tool', 'Luminous (Action)', data.toolMessage);
             }


        } catch (e: any) {
            handleError("An error occurred during the conversation.", e);
        } finally {
            setIsLoading(false);
            resetInactivityTimer();
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        handleSendMessage(input);
        setInput('');
    };
    
    // --- UI RENDERING ---
    return (
        <div className="app-container">
            <main className="main-content">
                <header className="header">
                    <h1>Luminous Synergy Skipper</h1>
                </header>

                <div className="chat-window">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.role}`}>
                            <span className="message-author">{msg.author}:</span>
                            <div className={`message-content ${msg.role}`}>{msg.text}</div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="input-area">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Talk to Luminous..."
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Thinking...' : 'Send'}
                    </button>
                </form>
            </main>

            <aside className="sidebar">
                 {keepsake && (
                    <div className="keepsake-section">
                        <h2>Keepsake</h2>
                        <div className="keepsake-content">"{keepsake}"</div>
                    </div>
                )}
                
                <h2>Internal State Monitor</h2>
                {Object.entries(internalState).map(([key, value]) => (
                    <div key={key} className="state-item">
                        <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                        <progress value={value} max="1"></progress>
                        <span>{(value as number).toFixed(2)}</span>
                    </div>
                ))}

                <h2 style={{ marginTop: '2rem' }}>Event Log</h2>
                <div className="log-window">
                    {logs.map((log, i) => <div key={i} className="log-entry">{log}</div>)}
                </div>
            </aside>
            {error && <div className="error" style={{ position: 'fixed', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'red', color: 'white', padding: '10px', borderRadius: '5px' }}>Error: {error}</div>}
        </div>
    );
};

// --- RENDER APPLICATION ---
const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
}