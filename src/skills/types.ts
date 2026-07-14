export type Skill = {
  readonly id: string;
  readonly name: string; // slug único: "analyze-pr", "deploy-checklist"
  readonly title: string;
  readonly description: string;
  readonly content: string; // markdown — pode ter blocos de código/scripts
  readonly tags: readonly string[];
  readonly docSetId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type SkillPreview = Omit<Skill, 'content'>;

export type CreateSkillInput = {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly content: string;
  readonly tags?: string[];
  readonly docSetId?: string;
};

export type UpdateSkillInput = Partial<CreateSkillInput>;
