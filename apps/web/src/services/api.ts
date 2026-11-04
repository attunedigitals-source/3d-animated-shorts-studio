import {
  CreateProjectInput,
  FullProjectDetails,
  ProjectSummary,
  UpdateProjectInput,
  StoryPromptOptions,
  StoryDocument,
  StoryRecord,
  ScriptDocument,
  ScriptRecord,
  StructuredScene,
  AISettings,
  TestConnectionResponse,
  UserProfile,
  UserCredentials,
} from '@studio/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

class ApiService {
  private token: string | null = null;
  private devUserId: string = 'dev-user-001';

  constructor() {
    this.token = localStorage.getItem('studio_auth_token');
    const storedDevId = localStorage.getItem('studio_dev_user_id');
    if (storedDevId) this.devUserId = storedDevId;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('studio_auth_token', token);
    } else {
      localStorage.removeItem('studio_auth_token');
    }
  }

  setDevUserId(userId: string) {
    this.devUserId = userId;
    localStorage.setItem('studio_dev_user_id', userId);
  }

  getDevUserId(): string {
    return this.devUserId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    headers['x-user-id'] = this.devUserId;

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      const message = data.error?.message || `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return (data.data !== undefined ? data.data : data) as T;
  }

  // Auth
  async login(credentials: UserCredentials): Promise<{ user: UserProfile; accessToken: string; isDevFallback?: boolean }> {
    const res = await this.request<{ user: UserProfile; accessToken: string; isDevFallback?: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(res.accessToken);
    if (res.user?.id) this.setDevUserId(res.user.id);
    return res;
  }

  async register(credentials: UserCredentials): Promise<{ user: UserProfile; accessToken: string; isDevFallback?: boolean }> {
    const res = await this.request<{ user: UserProfile; accessToken: string; isDevFallback?: boolean }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(res.accessToken);
    if (res.user?.id) this.setDevUserId(res.user.id);
    return res;
  }

  async getSession(): Promise<{ user: UserProfile; isDevFallback?: boolean }> {
    return this.request<{ user: UserProfile; isDevFallback?: boolean }>('/auth/session');
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' }).catch(() => {});
    this.setToken(null);
  }

  // Projects
  async getProjects(): Promise<ProjectSummary[]> {
    return this.request<ProjectSummary[]>('/projects');
  }

  async getProject(id: string): Promise<FullProjectDetails> {
    return this.request<FullProjectDetails>(`/projects/${id}`);
  }

  async createProject(input: CreateProjectInput): Promise<ProjectSummary> {
    return this.request<ProjectSummary>('/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<ProjectSummary> {
    return this.request<ProjectSummary>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateProject(id: string): Promise<ProjectSummary> {
    return this.request<ProjectSummary>(`/projects/${id}/duplicate`, {
      method: 'POST',
    });
  }

  // Stories
  async generateStory(projectId: string, options: StoryPromptOptions, settings?: Partial<AISettings>): Promise<{ story: StoryRecord }> {
    return this.request<{ story: StoryRecord }>('/stories/generate', {
      method: 'POST',
      body: JSON.stringify({ projectId, options, settings }),
    });
  }

  async getStory(projectId: string): Promise<StoryDocument> {
    return this.request<StoryDocument>(`/stories/${projectId}`);
  }

  async saveStory(projectId: string, story: StoryDocument): Promise<StoryRecord> {
    return this.request<StoryRecord>(`/stories/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(story),
    });
  }

  // Scripts
  async generateScript(projectId: string, targetDurationSeconds?: number, settings?: Partial<AISettings>): Promise<{ script: ScriptRecord }> {
    return this.request<{ script: ScriptRecord }>('/scripts/generate', {
      method: 'POST',
      body: JSON.stringify({ projectId, targetDurationSeconds, settings }),
    });
  }

  async getScript(projectId: string): Promise<ScriptDocument> {
    return this.request<ScriptDocument>(`/scripts/${projectId}`);
  }

  async saveScript(projectId: string, script: ScriptDocument): Promise<ScriptRecord> {
    return this.request<ScriptRecord>(`/scripts/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(script),
    });
  }

  // Scenes
  async breakdownScenes(projectId: string, settings?: Partial<AISettings>): Promise<{ scenes: StructuredScene[] }> {
    return this.request<{ scenes: StructuredScene[] }>('/scenes/breakdown', {
      method: 'POST',
      body: JSON.stringify({ projectId, settings }),
    });
  }

  async getScenes(projectId: string): Promise<StructuredScene[]> {
    return this.request<StructuredScene[]>(`/scenes/${projectId}`);
  }

  async saveScenes(projectId: string, scenes: StructuredScene[]): Promise<StructuredScene[]> {
    return this.request<StructuredScene[]>(`/scenes/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(scenes),
    });
  }

  async updateScene(projectId: string, sceneId: string, sceneUpdate: Partial<StructuredScene>): Promise<StructuredScene> {
    return this.request<StructuredScene>(`/scenes/${projectId}/${sceneId}`, {
      method: 'PATCH',
      body: JSON.stringify(sceneUpdate),
    });
  }

  // Settings
  async getSettings(): Promise<any> {
    return this.request<any>('/settings');
  }

  async testConnection(settings: Partial<AISettings>): Promise<TestConnectionResponse> {
    return this.request<TestConnectionResponse>('/settings/test-connection', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }
}

export const api = new ApiService();

