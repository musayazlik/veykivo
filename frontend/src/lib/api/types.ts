import type { components } from "./schema";

type S = components["schemas"];

export type Media = S["MediaDto"];
export type ServiceListItem = S["ServiceListItemDto"];
export type ServiceDetail = S["ServiceDetailDto"];
export type ProjectListItem = S["ProjectListItemDto"];
export type ProjectDetail = S["ProjectDetailDto"];
export type Technology = S["TechnologyDto"];
export type TechnologyCategory = S["TechnologyCategory"];
export type TeamMember = S["TeamMemberDto"];
export type PostListItem = S["PostListItemDto"];
export type PostDetail = S["PostDetailDto"];
export type PagedPosts = S["PagedResultOfPostListItemDto"];
export type CategoryRef = S["CategoryRefDto"];
export type TagRef = S["TagRefDto"];
export type BlogCategory = S["BlogCategoryDto"];
export type BlogTag = S["BlogTagDto"];
export type PublicComment = S["PublicCommentDto"];
export type CreateInquiryRequest = S["CreateInquiryRequest"];

export type AdminService = S["AdminServiceDto"];
export type UpsertService = S["UpsertServiceRequest"];
export type AdminProject = S["AdminProjectDto"];
export type UpsertProject = S["UpsertProjectRequest"];
export type AdminTechnology = S["AdminTechnologyDto"];
export type UpsertTechnology = S["UpsertTechnologyRequest"];
export type AdminTeamMember = S["AdminTeamMemberDto"];
export type UpsertTeamMember = S["UpsertTeamMemberRequest"];
export type AdminPost = S["AdminPostDto"];
export type AdminPostListItem = S["AdminPostListItemDto"];
export type AdminCategory = S["AdminCategoryDto"];
export type AdminTag = S["AdminTagDto"];
export type AdminComment = S["AdminCommentDto"];
export type CommentStatus = S["CommentStatus"];
export type AiModels = S["AiModelsDto"];
export type AiModel = S["AiModelDto"];
export type AiGenerateRequest = S["AiGeneratePostRequest"];
export type AiGenerateResult = S["AiGeneratePostResult"];
export type AiRewriteResult = S["AiRewriteResult"];
export type UpsertPost = S["UpsertPostRequest"];
export type PostStatus = S["PostStatus"];
export type MediaAsset = S["MediaAssetDto"];
export type InquiryListItem = S["InquiryListItemDto"];
export type InquiryDetail = S["InquiryDetailDto"];
export type InquiryStatus = S["InquiryStatus"];
export type DashboardSummary = S["DashboardSummaryDto"];
export type CurrentUser = S["CurrentUserDto"];

/** RFC 9457 problem ayrıntısı (ASP.NET ValidationProblem dahil). */
export type Problem = {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
};

export const technologyCategoryLabels: Record<TechnologyCategory, string> = {
  Frontend: "Frontend",
  Backend: "Backend",
  Mobile: "Mobil",
  Database: "Veritabanı",
  Infrastructure: "Altyapı ve DevOps",
  AI: "Yapay zekâ",
};
