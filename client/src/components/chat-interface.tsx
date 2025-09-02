import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChatMessage } from "@/types/analysis";

interface ChatInterfaceProps {
  analysisId: string;
  productName?: string;
}

export function ChatInterface({ analysisId, productName }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatHistory = [] } = useQuery({
    queryKey: [`/api/chat/${analysisId}`],
    enabled: !!analysisId,
    queryFn: async () => {
      try {
        const response = await fetch(`/api/chat/${analysisId}`);
        if (!response.ok) {
          throw new Error('Chat history not available');
        }
        return response.json();
      } catch (error) {
        // Return empty array for demo mode
        console.log('Chat history not available in demo mode');
        return [];
      }
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      try {
        const response = await apiRequest("POST", `/api/chat/${analysisId}`, { message });
        return response.json();
      } catch (error) {
        // Demo chat responses for static deployment
        console.log('Using demo chat response');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate contextual responses based on message content
        let demoResponse = "";
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('ingredient') || lowerMessage.includes('contain')) {
          demoResponse = `${productName || 'This product'} contains whole grain oats, sugar, canola oil, rice flour, honey, brown sugar syrup, salt, and natural flavors. The main ingredients are whole grains which provide fiber and sustained energy. The sugar content is moderate, so it's best enjoyed as part of a balanced diet.`;
        } else if (lowerMessage.includes('calorie') || lowerMessage.includes('nutrition')) {
          demoResponse = `${productName || 'This product'} contains 190 calories per serving (2 bars). It provides 4g of protein, 32g of carbohydrates including 11g of sugars, and 6g of fat. It's a good source of energy for active lifestyles but should be consumed in moderation due to the sugar content.`;
        } else if (lowerMessage.includes('health') || lowerMessage.includes('safe')) {
          demoResponse = `${productName || 'This product'} is generally safe for most people. The whole grain oats provide beneficial fiber and nutrients. However, it does contain added sugars, so those monitoring sugar intake should be mindful. It's free from major allergens but check the packaging for any 'may contain' warnings.`;
        } else if (lowerMessage.includes('diet') || lowerMessage.includes('weight')) {
          demoResponse = `For weight management, ${productName || 'this product'} can be part of a balanced diet when consumed in moderation. At 190 calories per serving, it's a substantial snack. The fiber and protein can help with satiety, but the sugar content means it's best enjoyed post-workout or as an occasional treat rather than a daily snack.`;
        } else if (lowerMessage.includes('exercise') || lowerMessage.includes('workout')) {
          demoResponse = `${productName || 'This product'} is excellent for exercise fuel! The combination of complex carbs from oats and quick energy from sugars makes it ideal for pre-workout energy or post-workout recovery. Many athletes use these bars for hiking, cycling, and endurance activities.`;
        } else {
          demoResponse = `${productName || 'This product'} is a nutritious granola bar made with whole grain oats and natural sweeteners. It provides sustained energy and is convenient for on-the-go nutrition. For specific questions about ingredients, nutrition, or health considerations, I can provide detailed information based on the product analysis.`;
        }
        
        return {
          message,
          response: demoResponse,
          timestamp: new Date().toISOString()
        };
      }
    },
    onSuccess: () => {
      // Invalidate chat history to refetch
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${analysisId}`] });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, sendMessageMutation.data]);

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

  // Combine chat history with new messages
  const allMessages = Array.isArray(chatHistory) ? [...chatHistory] : [];
  if (sendMessageMutation.data) {
    allMessages.push(sendMessageMutation.data);
  }

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
        {allMessages.map((msg, index) => (
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
          placeholder="im at your assistance"
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
