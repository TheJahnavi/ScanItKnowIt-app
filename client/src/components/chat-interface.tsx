import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ChatMessage } from "@/types/analysis";

interface ChatInterfaceProps {
  analysisId: string;
  productName?: string;
}

export function ChatInterface({ analysisId, productName }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatHistory = [], refetch } = useQuery({
    queryKey: [`/api/chat/${analysisId}`],
    enabled: !!analysisId,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/chat/${analysisId}`);
      return response.json();
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Get current analysis data from sessionStorage
      const currentAnalysis = sessionStorage.getItem('currentAnalysis');
      if (!currentAnalysis) {
        throw new Error("No analysis data found");
      }
      
      const parsedAnalysis = JSON.parse(currentAnalysis);
      
      const response = await apiRequest("POST", `/api/chat/${analysisId}`, { 
        message,
        productData: parsedAnalysis,
        chatHistory: chatHistory.slice(-4) // Send last 4 messages for context
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Refetch chat history to get the new message
      refetch();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSend = () => {
    if (!inputValue.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-interface space-y-4" data-testid="chat-interface">
      {/* Chat Messages */}
      <div className="chat-messages space-y-3 max-h-64 overflow-y-auto" data-testid="chat-messages">
        {/* Welcome Message */}
        <div className="bg-secondary p-3 rounded-xl">
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="text-primary-foreground text-xs" />
            </div>
            <div className="flex-1">
              <p className="text-sm">What do you want to know about "{productName || "product name"}"</p>
            </div>
          </div>
        </div>

        {/* Chat History */}
        {chatHistory.map((msg: any, index: number) => (
          <div key={index} className="space-y-2">
            {/* User Message */}
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground p-3 rounded-xl max-w-xs">
                <div className="flex items-start space-x-2">
                  <User className="text-primary-foreground text-xs mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            </div>
            
            {/* AI Response */}
            <div className="bg-secondary p-3 rounded-xl">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="text-primary-foreground text-xs" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{msg.response}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading Message */}
        {sendMessageMutation.isPending && (
          <>
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground p-3 rounded-xl max-w-xs">
                <div className="flex items-start space-x-2">
                  <User className="text-primary-foreground text-xs mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{inputValue}</p>
                </div>
              </div>
            </div>
            <div className="bg-secondary p-3 rounded-xl">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="text-primary-foreground text-xs" />
                </div>
                <div className="flex-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat Input */}
      <div className="flex space-x-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about this product..."
          className="flex-1"
          disabled={sendMessageMutation.isPending}
          data-testid="input-chat"
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim() || sendMessageMutation.isPending}
          data-testid="button-send-message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}