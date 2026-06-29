import type {
  CompanyProfile,
  LearningMemory,
  PromptAsset,
  PromptSkill,
  UserProfile,
} from "@/lib/prompt";

export interface WorkspaceRepository {
  getUserProfile(userId: string): Promise<UserProfile>;
  saveUserProfile(userId: string, profile: UserProfile): Promise<void>;
  getCompanyProfile(workspaceId: string): Promise<CompanyProfile>;
  saveCompanyProfile(workspaceId: string, profile: CompanyProfile): Promise<void>;
  listPromptAssets(workspaceId: string): Promise<PromptAsset[]>;
  savePromptAsset(workspaceId: string, prompt: PromptAsset): Promise<void>;
  updatePromptAsset(workspaceId: string, prompt: PromptAsset): Promise<void>;
  listLearningMemories(workspaceId: string): Promise<LearningMemory[]>;
  saveLearningMemory(workspaceId: string, memory: LearningMemory): Promise<void>;
  listPromptSkills(workspaceId: string): Promise<PromptSkill[]>;
  savePromptSkill(workspaceId: string, skill: PromptSkill): Promise<void>;
  updatePromptSkill(workspaceId: string, skill: PromptSkill): Promise<void>;
}
