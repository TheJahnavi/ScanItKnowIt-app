import { useState } from "react";
import { ChevronDown, Leaf, Flame, Star, MessageCircle, Check, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChatInterface } from "./chat-interface";
import type { CardType, IngredientsData, NutritionData, RedditData } from "@/types/analysis";

interface AnalysisCardProps {
  type: CardType;
  title: string;
  description: string;
  analysisId: string;
  productName?: string;
  isOpen: boolean;
  onToggle: () => void;
  data?: any;
  onDataLoaded: (type: CardType, data: any) => void;
}

const cardConfig = {
  ingredients: {
    icon: Leaf,
    bgColor: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
  },
  calories: {
    icon: Flame,
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  reddit: {
    icon: Star,
    bgColor: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
  },
  qa: {
    icon: MessageCircle,
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
};

export function AnalysisCard({ 
  type, 
  title, 
  description, 
  analysisId, 
  productName,
  isOpen, 
  onToggle, 
  data, 
  onDataLoaded 
}: AnalysisCardProps) {
  const { toast } = useToast();
  const config = cardConfig[type];
  const Icon = config.icon;

  // Get the analysis data from sessionStorage
  const getAnalysisData = () => {
    const currentAnalysis = sessionStorage.getItem('currentAnalysis');
    if (!currentAnalysis) return null;
    
    try {
      return JSON.parse(currentAnalysis);
    } catch (parseError) {
      console.error('Failed to parse currentAnalysis from sessionStorage:', parseError);
      return null;
    }
  };

  const fetchDataMutation = useMutation({
    mutationFn: async () => {
      const analysisData = getAnalysisData();
      if (!analysisData) {
        throw new Error("No analysis data found");
      }

      let endpoint = "";
      let requestBody = {};
      
      switch (type) {
        case "ingredients":
          if (!analysisData.extractedText) {
            throw new Error("No extracted text available for ingredients analysis");
          }
          endpoint = `/api/analyze-ingredients/${analysisData.analysisId || analysisData.id || analysisId}`;
          requestBody = { extractedText: analysisData.extractedText };
          break;
        case "calories":
          if (!analysisData.extractedText) {
            throw new Error("No extracted text available for nutrition analysis");
          }
          endpoint = `/api/analyze-nutrition/${analysisData.analysisId || analysisData.id || analysisId}`;
          requestBody = { extractedText: analysisData.extractedText };
          break;
        case "reddit":
          const productNameToUse = productName || analysisData.productName;
          if (!productNameToUse) {
            throw new Error("No product name available for Reddit analysis");
          }
          endpoint = `/api/analyze-reddit/${analysisData.analysisId || analysisData.id || analysisId}`;
          requestBody = { productName: productNameToUse };
          break;
        default:
          throw new Error("Invalid card type");
      }
      
      const response = await apiRequest("POST", endpoint, requestBody);
      return response.json();
    },
    onSuccess: (result) => {
      onDataLoaded(type, result);
      toast({
        title: "Analysis Complete",
        description: `${title} data loaded successfully`,
      });
    },
    onError: (error) => {
      console.error(`Failed to load ${type} data:`, error);
      toast({
        title: "Analysis Failed",
        description: `Failed to load ${title.toLowerCase()}. ${error.message || "Please try again."}`,
        variant: "destructive",
      });
    },
  });

  const handleToggle = () => {
    if (!isOpen && !data && type !== "qa") {
      fetchDataMutation.mutate();
    }
    onToggle();
  };

  const renderContent = () => {
    if (type === "qa") {
      return <ChatInterface analysisId={analysisId} productName={productName} />;
    }

    if (fetchDataMutation.isPending) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {type === "ingredients" && "Analyzing ingredients..."}
              {type === "calories" && "Analyzing nutrition..."}
              {type === "reddit" && "Searching Reddit..."}
            </span>
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Click to load {title.toLowerCase()}</p>
        </div>
      );
    }

    switch (type) {
      case "ingredients":
        return <IngredientsContent data={data as IngredientsData} />;
      case "calories":
        return <NutritionContent data={data as NutritionData} />;
      case "reddit":
        return <RedditContent data={data as RedditData} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`analysis-card bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all duration-300 ${
        isOpen ? "scale-102" : ""
      }`}
      data-testid={`card-${type}`}
    >
      <Button
        variant="ghost"
        className="w-full p-6 text-left hover:bg-accent/50 transition-colors h-auto"
        onClick={handleToggle}
        data-testid={`button-toggle-${type}`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${config.bgColor} rounded-xl flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <div>
              <h3 className="font-semibold text-left">{title}</h3>
              <p className="text-sm text-muted-foreground text-left">{description}</p>
            </div>
          </div>
          <ChevronDown 
            className={`h-5 w-5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`} 
          />
        </div>
      </Button>

      {isOpen && (
        <div className="px-6 pb-6 animate-slide-up" data-testid={`content-${type}`}>
          {renderContent()}
        </div>
      )}
    </div>
  );
}

function IngredientsContent({ data }: { data: IngredientsData }) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-4">
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Safe</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Moderate</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Harmful</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {data.ingredients?.map((ingredient, index) => {
          const safetyLevel = ingredient.safety || "Safe";
          const isHarmful = safetyLevel === "Harmful";
          const isModerate = safetyLevel === "Moderate";
          const isSafe = safetyLevel === "Safe";
          
          return (
            <div 
              key={index} 
              className={`flex items-center justify-between p-3 rounded-xl border-l-4 ${
                isSafe 
                  ? "bg-green-50 dark:bg-green-900/20 border-l-green-500 hover:bg-green-100 dark:hover:bg-green-900/30"
                  : isModerate
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-l-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30" 
                  : "bg-red-50 dark:bg-red-900/20 border-l-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
              } transition-colors`}
            >
              <div className="flex-1">
                <p className={`font-medium text-sm ${
                  isSafe 
                    ? "text-green-800 dark:text-green-200"
                    : isModerate
                    ? "text-yellow-800 dark:text-yellow-200"
                    : "text-red-800 dark:text-red-200"
                }`}>
                  {ingredient.name}
                </p>
                <p className={`text-xs mt-1 ${
                  isSafe 
                    ? "text-green-600 dark:text-green-400" 
                    : isModerate
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {ingredient.reason}
                </p>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isSafe
                  ? "bg-green-100 dark:bg-green-800/50"
                  : isModerate
                  ? "bg-yellow-100 dark:bg-yellow-800/50"
                  : "bg-red-100 dark:bg-red-800/50"
              }`}>
                {isSafe ? (
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className={`w-4 h-4 ${
                    isModerate
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                  }`} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {data.ingredients && data.ingredients.length > 0 && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            Safety assessment based on FDA, CPSC, and EU health standards. Always consult packaging for complete ingredient information and allergen warnings.
          </p>
        </div>
      )}
    </div>
  );
}

function NutritionContent({ data }: { data: NutritionData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-secondary p-3 rounded-xl text-center">
          <div className="text-xl font-bold text-primary">{data.calories || "N/A"}</div>
          <div className="text-xs text-muted-foreground">Calories</div>
        </div>
        <div className="bg-secondary p-3 rounded-xl text-center">
          <div className="text-xl font-bold text-orange-600">{data.totalSugars || "N/A"}</div>
          <div className="text-xs text-muted-foreground">Total Sugars</div>
        </div>
        <div className="bg-secondary p-3 rounded-xl text-center">
          <div className="text-xl font-bold text-blue-600">{data.protein || "N/A"}</div>
          <div className="text-xs text-muted-foreground">Protein</div>
        </div>
      </div>
      
      {data.sugarTypes && data.sugarTypes.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Sugar Types & Nutritional Breakdown</h4>
          <div className="space-y-2">
            {data.sugarTypes.map((sugar, index) => (
              <div key={index} className="flex justify-between text-sm p-2 bg-secondary rounded-lg">
                <span className="text-foreground">{sugar.type}</span>
                <span className="font-medium text-primary">{sugar.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-3 p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground">
          Nutritional values per serving. Individual needs may vary based on age, gender, and activity level. Consult packaging for complete nutrition facts.
        </p>
      </div>
    </div>
  );
}

function RedditContent({ data }: { data: RedditData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
          <h4 className="font-semibold text-green-700 dark:text-green-400 text-sm mb-2">Pros</h4>
          <ul className="text-xs text-green-600 dark:text-green-300 space-y-1">
            {data.pros?.map((pro, index) => (
              <li key={index}>• {pro}</li>
            ))}
          </ul>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
          <h4 className="font-semibold text-red-700 dark:text-red-400 text-sm mb-2">Cons</h4>
          <ul className="text-xs text-red-600 dark:text-red-300 space-y-1">
            {data.cons?.map((con, index) => (
              <li key={index}>• {con}</li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="bg-secondary p-3 rounded-xl">
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex space-x-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`text-xs ${
                  i < Math.floor(data.averageRating || 0)
                    ? "text-yellow-400 fill-current"
                    : i < (data.averageRating || 0)
                    ? "text-yellow-400 fill-current opacity-50"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium">{data.averageRating}/5 overall</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Based on {data.totalMentions} Reddit mentions
        </p>
      </div>
    </div>
  );
}
