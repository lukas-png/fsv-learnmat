export interface LearningModule {
    name: string;
    etag: string;
    // ISO date of the last change inside the module folder, if known
    updated?: string;
}
