import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Demo data for static deployment fallback
const demoData = {
  ingredients: {
    ingredients: [
      {
        name: "Whole Grain Oats",
        safety: "Safe",
        reason: "Natural whole grain"
      },
      {
        name: "Sugar",
        safety: "Moderate",
        reason: "High glycemic index"
      },
      {
        name: "Canola Oil",
        safety: "Safe",
        reason: "Heart-healthy fat"
      },
      {
        name: "Rice Flour",
        safety: "Safe",
        reason: "Gluten-free grain"
      },
      {
        name: "Honey",
        safety: "Safe",
        reason: "Natural sweetener"
      },
      {
        name: "Brown Sugar Syrup",
        safety: "Moderate",
        reason: "Added sugar content"
      },
      {
        name: "Salt",
        safety: "Safe",
        reason: "Mineral enhancement"
      },
      {
        name: "Natural Flavor",
        safety: "Safe",
        reason: "FDA approved"
      }
    ]
  },
  nutrition: {
    calories: 190,
    totalSugars: "11g",
    sugarTypes: [
      { type: "Total Sugars", amount: "11g" },
      { type: "Added Sugars", amount: "10g" }
    ]
  },
  reddit: {
    pros: [
      "Great for hiking and outdoor activities",
      "Crunchy texture is very satisfying",
      "Good source of whole grains and fiber",
      "Convenient portable snack option"
    ],
    cons: [
      "High sugar content for a health bar",
      "Can be too sweet for some people",
      "Crumbs everywhere when eating",
      "More expensive than regular granola bars"
    ]
  }
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Fallback for static deployment (GitHub Pages)
    console.log('API request failed, using demo data for:', url);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return demo data based on endpoint
    let responseData;
    if (url.includes('analyze-ingredients')) {
      responseData = demoData.ingredients;
    } else if (url.includes('analyze-nutrition')) {
      responseData = demoData.nutrition;
    } else if (url.includes('analyze-reddit')) {
      responseData = demoData.reddit;
    } else {
      throw error; // Re-throw for non-analysis endpoints
    }
    
    // Create a mock Response object
    return {
      ok: true,
      status: 200,
      json: async () => responseData
    } as Response;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
