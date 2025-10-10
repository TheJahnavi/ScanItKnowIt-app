export class MemStorage {
    async getUser(id) {
        return undefined;
    }
    async getUserByUsername(username) {
        return undefined;
    }
    async createUser(insertUser) {
        return { id: 'mock-user-id', ...insertUser };
    }
    async createProductAnalysis(analysis) {
        return {
            id: 'mock-analysis-id',
            createdAt: new Date(),
            imageUrl: analysis.imageUrl || null,
            ingredientsData: analysis.ingredientsData || null,
            nutritionData: analysis.nutritionData || null,
            redditData: analysis.redditData || null,
            ...analysis
        };
    }
    async getProductAnalysis(id) {
        return undefined;
    }
    async updateProductAnalysis(id, updates) {
        return undefined;
    }
    async createChatMessage(message) {
        return {
            id: 'mock-message-id',
            createdAt: new Date(),
            ...message
        };
    }
    async getChatMessages(analysisId) {
        return [];
    }
}
export const storage = new MemStorage();
