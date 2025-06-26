export interface SearchResponse<T = any> {
    items: T[];
    totalItems: number;
    page: number;
    limit: number;
}