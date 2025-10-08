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

  // Get chat history from sessionStorage
  const getChatHistory = () => {
    const sessionId = sessionStorage.getItem('currentSessionId');
    if (!sessionId) return [];
    
    const chatHistory = sessionStorage.getItem(`chat-history-${sessionId}`);
    return chatHistory ? JSON.parse(chatHistory) : [];
  };

  // Save chat message to sessionStorage
  const saveChatMessage = (message: any) => {
    const sessionId = sessionStorage.getItem('currentSessionId');
    if (!sessionId) return;
    
    const chatHistory = getChatHistory();
    chatHistory.push(message);
    
    sessionStorage.setItem(`chat-history-${sessionId}`, JSON.stringify(chatHistory));
  };

  const { data: chatHistory = [] } = useQuery({
    queryKey: [`/api/chat/${analysisId}`],
    enabled: !!analysisId,
    queryFn: async () => {
      // Return chat history from sessionStorage
      return getChatHistory();
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      try {
        // Get current analysis data
        const sessionId = sessionStorage.getItem('currentSessionId');
        if (!sessionId) {
          throw new Error("No session data found");
        }
        
        const analysisData = sessionStorage.getItem(`analysis-${sessionId}`);
        if (!analysisData) {
          throw new Error("No analysis data found");
        }
        
        const parsedAnalysis = JSON.parse(analysisData);
        
        const response = await apiRequest("POST", `/api/chat/${analysisId}`, { 
          message,
          productData: {
            productName: parsedAnalysis.productName,
            extractedText: parsedAnalysis.extractedText,
            ingredientsData: parsedAnalysis.ingredientsData,
            nutritionData: parsedAnalysis.nutritionData
          }
        });
        return response.json();
      } catch (error) {
        // Demo chat responses for static deployment
        console.log('Using dynamic chat response based on current analysis');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Get current analysis data
        const currentAnalysis = sessionStorage.getItem('currentAnalysis');
        let extractedText = null;
        let currentProductName = productName || 'this product';
        
        if (currentAnalysis) {
          const analysis = JSON.parse(currentAnalysis);
          extractedText = analysis.extractedText;
          currentProductName = analysis.productName || currentProductName;
        }
        
        // Generate contextual responses based on message content and extracted data
        let demoResponse = "";
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('ingredient') || lowerMessage.includes('contain')) {
          if (extractedText?.ingredients && !extractedText.ingredients.includes('Please check')) {
            demoResponse = `${currentProductName} contains: ${extractedText.ingredients}. Based on the ingredient analysis, most components are generally safe, though items with added sugars should be consumed in moderation as part of a balanced diet.`;
          } else {
            demoResponse = `${currentProductName} contains various ingredients. The main ingredients typically include grains, vitamins, and minerals. For the complete and most accurate ingredient list, please check the product packaging directly.`;
          }
        } else if (lowerMessage.includes('calorie') || lowerMessage.includes('nutrition')) {
          if (extractedText?.nutrition && !extractedText.nutrition.includes('Please check')) {
            demoResponse = `${currentProductName} nutrition facts: ${extractedText.nutrition}. This provides essential nutrients and energy for your daily activities. Consider this as part of your overall daily nutritional intake.`;
          } else {
            demoResponse = `${currentProductName} provides essential nutrients and calories. For specific nutritional information including calories, fats, carbohydrates, and protein content, please refer to the nutrition facts panel on the product packaging.`;
          }
        } else if (lowerMessage.includes('health') || lowerMessage.includes('safe')) {
          demoResponse = `${currentProductName} is generally safe for most people when consumed as part of a balanced diet. However, if you have specific allergies or dietary restrictions, always check the ingredient list and allergen information on the packaging. Consult with a healthcare provider for personalized dietary advice.`;
        } else if (lowerMessage.includes('diet') || lowerMessage.includes('weight')) {
          if (currentProductName.toLowerCase().includes('special k')) {
            demoResponse = `${currentProductName} can be part of a weight management plan when consumed in appropriate portions. It's designed to be lower in calories while providing essential nutrients. Combine with a balanced diet and regular exercise for best results.`;
          } else {
            demoResponse = `${currentProductName} can fit into various dietary plans when consumed in moderation. Consider the calorie content and nutritional profile in relation to your daily dietary goals and overall caloric intake.`;
          }
        } else if (lowerMessage.includes('exercise') || lowerMessage.includes('workout')) {
          demoResponse = `${currentProductName} can provide energy for physical activities. The carbohydrates can fuel your workouts, while any protein content supports muscle function. Timing of consumption around exercise depends on your specific fitness goals and the product's nutritional profile.`;
        } else {
          demoResponse = `${currentProductName} is a food product that can be part of a balanced diet. For specific questions about ingredients, nutrition, health considerations, or dietary fit, I can provide information based on general nutritional principles and the product analysis. What specific aspect would you like to know more about?`;
        }
        
        return {
          message,
          response: demoResponse,
          timestamp: new Date().toISOString()
        };
      }
    },
    onSuccess: (data) => {
      // Save the new message to sessionStorage
      saveChatMessage(data);
      
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
