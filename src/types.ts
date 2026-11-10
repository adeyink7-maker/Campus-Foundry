export type UserRole = 'user' | 'student' | 'trader' | 'admin';
export type AccountType = 'BUYER' | 'TRADER';
export type StudentLevel = '100L' | '200L' | '300L' | '400L' | '500L' | 'Postgraduate' | 'Postgrad';

export interface ProductListing {
  id: string;
  traderId: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  inStock: boolean;
  createdAt: string;
  category?: string;
}

export interface TraderProfile {
  id: string;
  brandName: string;
  brandLogoUrl: string; // "Face of the Product Brand"
  businessCategory: string;
  campusLocation: string; // e.g., "SUB Shop 04" or "Zamfara Hostel Block B"
  whatsappContact: string;
  products: ProductListing[];
  isVerifiedVendor: boolean;
  rating?: number;
  reviewsCount?: number;
  activeOrdersToday?: number;
}

export interface StudentProject {
  id: string;
  title: string;
  description: string;
  techStack: string;
  repoOrDemoUrl?: string;
  role?: string;
}

export interface PoliticalProfile {
  id: string;
  candidateName: string;
  officeSought: string; // e.g., "SUG President", "CIS Representative"
  slogan: string;
  manifestoText: string;
  campaignVideoUrl?: string;
  endorsementsCount: number;
}

export type StaffRole = 'student_verifier' | 'page_moderator' | 'super_admin' | null;

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  username?: string;
  role: UserRole;
  accountType?: AccountType;
  matricNumber?: string;
  university?: string;
  campus?: string;
  session?: string;
  coverUrl?: string;
  hostelLocation?: string;
  faculty?: string;
  department?: string;
  level?: StudentLevel;
  whatsapp?: string;
  joinedAt?: string;
  bio?: string;
  skills?: string[];
  avatarUrl?: string;
  businessProfileId?: string; // Links to Marketplace Venture
  traderProfile?: TraderProfile;
  politicalProfile?: PoliticalProfile;
  isPoliticalCandidate?: boolean;
  politicalRole?: string;
  
  // Follower Metrics & Privacy
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  followingUserIds?: string[];
  blockedUserIds?: string[]; // Users restricted from viewing posts
  badges?: string[];
  projects?: StudentProject[];
  isVerified?: boolean;
  isAdmin?: boolean;
  staffRole?: StaffRole;
  verifiedAt?: string;
  unilorinDomain?: string;
  
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
  };
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface VerificationRequest {
  id: string;
  userId: string;
  proofUrl: string;
  note?: string;
  status: VerificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  applicantName?: string;
  applicantUsername?: string;
  applicantEmail?: string;
  applicantFaculty?: string;
  applicantDepartment?: string;
  applicantLevel?: StudentLevel;
  applicantAvatarUrl?: string;
}

export type StudentUser = AppUser;

export interface StudentServiceItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  estimatedTime?: string;
  type?: 'good' | 'service';
  inStock?: boolean;
  imageUrl?: string;
}

export interface StudentBusiness {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  university: string;
  campus: 'Permanent Site' | 'Tanke Off-Campus' | 'Mini Campus' | 'Sub-Hostels';
  hostelLocation: string;
  ownerId?: string; // Authenticated user account ID who owns and manages this trade
  ownerName: string;
  ownerEmail?: string;
  studentFaculty?: string;
  studentDept: string;
  studentLevel: string; // e.g. "300L Microbiology"
  whatsapp: string;
  rating: number;
  reviewsCount: number;
  acceptsHostelDelivery: boolean;
  deliveryTimeEstimate?: string;
  startingPrice: number;
  services: StudentServiceItem[];
  imageUrl: string;
  badge?: string;
  verifiedStudent: boolean;
  activeOrdersToday?: number;
  isTemplate?: boolean;
  templateTheme?: string;
}

export interface BusinessBlueprint {
  id: string;
  title: string;
  category: string;
  startupCapital: string;
  potentialEarnings: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  steps: string[];
  tips: string[];
  equipmentNeeded: string[];
}

export interface CampusHub {
  id: string;
  name: string;
  zone: string;
  type: 'On-Campus Hostels' | 'Off-Campus Hub' | 'Academic Complex';
  description: string;
  topCategories: string[];
  popularSpot: string;
  businessCount: number;
}

export interface ChatOrderSnippet {
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  deliveryRoom?: string;
  status?: 'pending' | 'accepted' | 'delivered';
}

export type MessageDeliveryState = 'sending' | 'sent' | 'delivered' | 'read';
export type ChatThemeMode = 'whatsapp' | 'dark' | 'emerald' | 'neon';

export interface ChatMessage {
  id: string;
  conversationId: string;
  businessId: string;
  businessName: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  hostelLocation?: string;
  orderSnippet?: ChatOrderSnippet;
  // Enterprise messaging extensions
  deliveryState?: MessageDeliveryState;
  voiceNoteUrl?: string;
  voiceDuration?: number; // in seconds
  voiceWaveform?: number[];
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file';
  attachmentName?: string;
  replyToMessage?: {
    id: string;
    senderName: string;
    text: string;
  };
  reactions?: Record<string, string[]>; // e.g., { "❤️": ["userId1"], "🔥": ["userId2"] }
}

export interface ChatConversation {
  id: string;
  kind?: 'direct' | 'marketplace';
  businessId: string;
  businessName: string;
  businessImageUrl?: string;
  traderName: string;
  traderId: string;
  traderHostel: string;
  buyerId: string;
  buyerName: string;
  buyerEmail?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  // Twitter / X Message Request & Privacy Flow
  isMessageRequest?: boolean;
  requestStatus?: 'pending' | 'accepted' | 'declined' | 'blocked';
  // WhatsApp / Instagram Features
  isOnline?: boolean;
  lastSeen?: string;
  isTyping?: boolean;
  chatTheme?: ChatThemeMode;
  isMuted?: boolean;
}

export interface CartItem {
  id: string;
  businessId: string;
  businessName: string;
  businessImageUrl?: string;
  businessWhatsapp?: string;
  traderHostel?: string;
  serviceId: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  customNotes?: string;
  addedAt: string;
}

export interface WishlistItem {
  id: string;
  businessId: string;
  businessName: string;
  businessCategory: string;
  campus: string;
  hostelLocation: string;
  imageUrl: string;
  startingPrice: number;
  savedAt: string;
}

export type OrderLifecycleStatus = 'placed' | 'accepted' | 'preparing' | 'in_transit' | 'delivered' | 'cancelled';

export interface OrderRecord {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerEmail?: string;
  buyerHostelRoom: string;
  buyerPhone?: string;
  businessId: string;
  businessName: string;
  traderHostel?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  deliveryFee: number;
  discountAmount?: number;
  promoCode?: string;
  grandTotal: number;
  status: OrderLifecycleStatus;
  createdAt: string;
  notes?: string;
  // Glovo / Jumia On-Demand Logistics Telemetry
  courierName?: string;
  courierPhone?: string;
  courierVehicle?: string;
  courierRating?: number;
  courierLat?: number;
  courierLng?: number;
  etaMinutes?: number;
  distanceKm?: number;
  deliveryPin?: string;
  paymentMethod?: 'card' | 'transfer' | 'wallet' | 'cash';
  paymentStatus?: 'paid' | 'pending';
}

// -------------------------------------------------------------
// SOCIAL & MOTIVATIONAL ECOSYSTEM TYPES
// -------------------------------------------------------------

export type AppModule = 
  | 'feed' 
  | 'marketplace' 
  | 'politics' 
  | 'academics' 
  | 'clubs' 
  | 'news' 
  | 'map' 
  | 'campus'
  | 'dashboard';

export type DomainCategory = 'POLITICS' | 'MARKETPLACE' | 'TECH' | 'ARTS' | 'LAW' | 'GENERAL';

export interface MotivationCard {
  id: string; // Unique identifier e.g., "awolowo_01"
  figureName: string; // Exact full name e.g., "Chief Obafemi Awolowo"
  figureImageUrl: string; // Direct relative path or verified CDN link to high-resolution portrait
  quoteText: string; // Verifiable quote attributed to the figure
  domainCategory: 'POLITICS' | 'MARKETPLACE' | 'TECH' | 'ARTS' | 'LAW' | 'GENERAL';
  backdropThemeCss: string; // Contextual CSS styling class or backdrop asset path
  authorTitle?: string;
  eraOrContext?: string;
  categoryBadge?: string;
  
  // Aliases for unified banner consumption
  author?: string;
  quote?: string;
  title?: string;
  module?: string;
  imageUrl?: string;
}

export type MotivationQuoteCard = MotivationCard;
export type MotivationalQuote = MotivationCard;

export interface CampusComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string;
  authorLevel?: StudentLevel;
  authorDept?: string;
  text: string;
  createdAt: string;
}

export interface PostReactionCounts {
  heart: number;
  fire: number;
  lightbulb: number;
  clap: number;
  myReaction?: 'heart' | 'fire' | 'lightbulb' | 'clap';
}

export interface CampusPost {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string;
  authorFaculty?: string;
  authorDept?: string;
  authorLevel: StudentLevel;
  authorRole: UserRole;
  authorAccountType?: AccountType;
  authorBusinessId?: string;
  authorBusinessName?: string;
  authorBrandLogo?: string;
  content: string;
  category: 'Academics & GNS' | 'Gist & Social' | 'Student Hustle & Trades' | 'SUG & Elections' | 'Campus Life & Hostels' | 'Events & Sports';
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  locationTag?: string; // e.g., "Walk of Fame", "Senate Building", "CBT Centre", "Tanke Gate"
  likesCount: number;
  likedByMe?: boolean;
  commentsCount: number;
  comments?: CampusComment[];
  // X / Twitter Content Feed Rules: View, React, Share, and Reshare (Comments disabled)
  resharesCount?: number;
  resharedByMe?: boolean;
  reactions?: PostReactionCounts;
  quoteSnippet?: {
    authorName: string;
    authorDept?: string;
    content: string;
  };
  createdAt: string;
  isVerifiedStudent?: boolean;
  pinned?: boolean;
  restrictedUserIds?: string[]; // Hide post from specific users
  productSnippet?: {
    title: string;
    price: number;
    businessId: string;
    imageUrl?: string;
  };
  // Page Post Extension Fields
  pageId?: string;
  pageName?: string;
  pageLogoUrl?: string;
  pageType?: 'club' | 'news';
  pageIsVerified?: boolean;
  isBreaking?: boolean;
}

export interface SnapViewerRecord {
  id: string;
  name: string;
  username?: string;
  avatarUrl: string;
  dept: string;
  viewedAt: string;
}

export interface CampusSnap {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar: string;
  authorDept: string;
  authorLevel: StudentLevel;
  locationTag: 'Senate Building' | 'Main Auditorium' | 'CBT Centre' | 'Tanke Gate' | 'SUB' | 'PS Terminal' | 'Hostels' | string;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  caption: string;
  createdAt: string;
  expiresAt?: string;
  expiresInHours: number;
  viewsCount: number;
  hasSeen?: boolean;
  stickers?: StorySticker[];
  // Instagram / WhatsApp Advanced Status System
  privacySetting?: 'all' | 'close_friends' | 'except';
  musicTrack?: {
    title: string;
    artist: string;
    coverUrl?: string;
  };
  viewersList?: SnapViewerRecord[];
}

export interface PoliticalCandidate {
  id: string;
  name: string;
  runningFor: string; // e.g., "SUG President (CEC)", "SUG Vice President", "Senate Council President", "NACOS President"
  session: string; // e.g., "2026/2027 Academic Session"
  faculty: string;
  department: string;
  level: StudentLevel;
  matricOrSlug: string;
  slogan: string;
  photoUrl: string;
  bannerUrl: string;
  manifestoSummary: string;
  manifestoPillars: Array<{ title: string; description: string }>;
  videoPitchUrl?: string;
  townhallLink?: string;
  endorsementsCount: number;
  endorsedByMe?: boolean;
  campaignUpdates: Array<{ id: string; title: string; date: string; content: string }>;
  contacts: {
    whatsapp?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface DepartmentResource {
  id: string;
  title: string;
  courseCode: string;
  faculty: string;
  department: string;
  level: StudentLevel;
  category: 'GNS & Orientation' | 'Lecture Slides' | 'Past Questions & Solutions' | 'SIWES & IT Leads' | 'Final Year Projects';
  description: string;
  fileType: 'PDF' | 'ZIP' | 'DOCX' | 'LINK';
  downloadUrl?: string;
  uploadedBy: string;
  downloadsCount: number;
  date: string;
  tags: string[];
}

export interface CommunityMember {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  role: 'admin' | 'moderator' | 'member';
  customTitle?: string; // e.g. "Lead Coordinator", "President", "Admin"
  isMuted?: boolean;
  joinedAt: string;
}

export interface CommunitySubChannel {
  id: string;
  name: string;
  topic?: string;
  unreadCount?: number;
}

export interface CommunityMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: 'admin' | 'moderator' | 'member';
  customTitle?: string;
  text: string;
  timestamp: string;
  pinned?: boolean;
  reactions?: Record<string, number>;
  mediaUrl?: string;
}

export interface CampusClub {
  id: string;
  name: string;
  acronym: string;
  category: 'Leadership' | 'Tech & Innovation' | 'Humanitarian' | 'Arts & Culture' | 'Academic' | 'Sports & Fitness' | 'Religious';
  description: string;
  tagline: string;
  logoUrl: string;
  bannerUrl: string;
  memberCount: number;
  meetingSchedule: string;
  meetingVenue: string;
  presidentName: string;
  presidentPhone: string;
  isRecruiting: boolean;
  membershipFee?: string;
  highlights: string[];
  // Telegram / WhatsApp Supergroup Community Engine
  isChatLocked?: boolean; // WhatsApp Admin Lock: Only admins can send messages
  subChannels?: CommunitySubChannel[];
  pinnedAnnouncement?: {
    id: string;
    text: string;
    author: string;
    date: string;
  };
  members?: CommunityMember[];
}

export interface CampusNewsArticle {
  id: string;
  title: string;
  slug: string;
  category: 'Senate & Admin' | 'Academic Calendar' | 'Exams & CBT' | 'Sports & UNILORIN League' | 'Campus Events';
  summary: string;
  content: string;
  publishedAt: string;
  author: string;
  authorRole: string;
  imageUrl: string;
  readTime: string;
  isBreaking?: boolean;
  pinned?: boolean;
}

export interface CampusLandmark {
  id: string;
  name: string;
  shortName: string;
  category: 'Academic Complex' | 'Administrative' | 'Hostels' | 'Food & Amenities' | 'Transit & Gates' | 'Sports & Worship';
  zone: 'Permanent Site' | 'Mini Campus' | 'Tanke Off-Campus';
  description: string;
  popularActivities: string[];
  openingHours: string;
  busStopNear: string;
  imageUrl: string;
}

export interface ShuttleRoute {
  id: string;
  routeName: string;
  from: string;
  to: string;
  fare: number; // e.g. ₦150
  frequencyMinutes: string;
  operatingHours: string;
  status: 'Active High Frequency' | 'Normal Frequency' | 'Reduced Evening Service';
  currentBusesActive: number;
}

// ==========================================
// Interactive Story Sticker Data Models
// ==========================================
export type StickerType = 'location' | 'poll' | 'quiz';

export interface BaseSticker {
  id: string;
  type: StickerType;
  x: number; // Normalized X coordinate (0.0 to 1.0)
  y: number; // Normalized Y coordinate (0.0 to 1.0)
  rotation?: number; // Rotation angle in degrees
  scale?: number; // Scale factor
}

export interface LocationSticker extends BaseSticker {
  type: 'location';
  locationName: string;
  latitude: number;
  longitude: number;
}

export interface PollSticker extends BaseSticker {
  type: 'poll';
  question: string;
  options: { id: string; text: string; votes: number }[];
  userVotedOptionId?: string;
}

export interface QuizSticker extends BaseSticker {
  type: 'quiz';
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  userSelectedOptionId?: string;
}

export type StorySticker = LocationSticker | PollSticker | QuizSticker;

export interface PollVotePayload {
  event: 'POLL_VOTE';
  data: {
    storyId: string;
    stickerId: string;
    optionId: string;
    voterUserId: string;
  };
}

export interface PollUpdatedPayload {
  event: 'POLL_UPDATED';
  data: {
    storyId: string;
    stickerId: string;
    totalVotes: number;
    options: {
      id: string;
      votes: number;
    }[];
  };
}

export * from './types/playercard';

// ==========================================
// Marketplace Core Data Models (Supabase)
// ==========================================
export type ProductKind = 'good' | 'service';

export interface Product {
  id: string;
  businessId: string;
  ownerId: string;
  kind: ProductKind;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  estimatedTime?: string | null;
  stockQuantity: number | null; // null = unlimited, 0 = sold out
  isActive: boolean;
  soldCount: number;
  createdAt?: string;
  updatedAt?: string;
  // Joined business properties
  businessName?: string;
  businessImageUrl?: string;
  businessHostel?: string;
  businessRating?: number;
  businessCategory?: string;
  businessWhatsapp?: string;
}

export type OrderStatus = 'pending' | 'placed' | 'accepted' | 'preparing' | 'in_transit' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash_on_delivery' | 'transfer';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productTitle?: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface MarketplaceOrder {
  id: string;
  orderNumber?: string;
  businessId: string;
  businessName?: string;
  businessImageUrl?: string;
  businessHostel?: string;
  businessWhatsapp?: string;
  traderId?: string;
  buyerId: string;
  buyerName?: string;
  buyerPhone?: string;
  status: OrderStatus;
  subtotal?: number;
  deliveryFee?: number;
  grandTotal?: number;
  totalAmount: number;
  deliveryAddress: string;
  phone: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt?: string;
  acceptedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  items?: OrderItem[];
  deliveryPin?: string; // available to buyer via order_secrets
  cancellationReason?: string;
  cancelReason?: string;
}

export interface MarketplaceConversation {
  id: string;
  kind?: 'direct' | 'marketplace';
  businessId: string;
  businessName?: string;
  businessImageUrl?: string;
  buyerId: string;
  buyerName?: string;
  buyerAvatar?: string;
  traderId: string;
  traderName?: string;
  status: 'accepted' | 'declined' | 'blocked';
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  buyerUnread: number;
  traderUnread: number;
  createdAt: string;
}

export interface MarketplaceMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  orderId?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  voiceNoteUrl?: string | null;
  voiceDuration?: number | null;
  replyTo?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface MarketplaceReview {
  id: string;
  businessId: string;
  orderId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface DashboardStats {
  revenueTotal: number;
  revenuePeriod: number;
  ordersTotal: number;
  ordersNew: number;
  ordersActive: number;
  ordersDelivered: number;
  ordersCancelled: number;
  daily: Array<{ day: string; revenue: number; orders: number }>;
  topProducts: Array<{ name: string; qty: number; revenue: number }>;
}

// ==========================================
// Hubs Pages & Clubs & News Outlet Data Models
// ==========================================
export type HubPageType = 'club' | 'news';
export type PageJoinMode = 'open' | 'request' | 'follow_only';
export type PageStatus = 'pending' | 'approved' | 'rejected';
export type PageMemberRole = 'owner' | 'admin' | 'member' | 'follower';
export type PageMemberStatus = 'active' | 'pending';
export type PagePostKind = 'announcement' | 'event' | 'poll' | 'article' | 'breaking';
export type PagePostStatus = 'published' | 'pending' | 'removed';

export interface HubPage {
  id: string;
  type: HubPageType;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  ownerId: string;
  isVerified: boolean;
  joinMode: PageJoinMode;
  status: PageStatus;
  note?: string;
  createdAt: string;
  // Joined or computed properties
  membersCount?: number;
  followersCount?: number;
  myRole?: PageMemberRole | null;
  myStatus?: PageMemberStatus | null;
  isMuted?: boolean;
}

export interface PageMember {
  id: string;
  pageId: string;
  userId: string;
  role: PageMemberRole;
  status: PageMemberStatus;
  isMuted?: boolean;
  createdAt: string;
  // Joined user fields
  userName?: string;
  userUsername?: string;
  userAvatarUrl?: string;
}

export interface PagePost {
  id: string;
  pageId: string;
  authorId: string;
  kind: PagePostKind;
  title?: string;
  body: string;
  imageUrl?: string;
  eventDate?: string;
  eventLocation?: string;
  pollOptions?: Array<{ id: string; option: string; votes: number }>;
  isBreaking?: boolean;
  status: PagePostStatus;
  createdAt: string;
  // Joined fields from pages
  pageName?: string;
  pageLogoUrl?: string;
  pageType?: HubPageType;
  pageIsVerified?: boolean;
}

export interface PageReport {
  id: string;
  pageId?: string;
  postId?: string;
  reporterId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
  // Joined details
  reporterName?: string;
  postTitleOrBody?: string;
  pageName?: string;
}

export interface PageMessage {
  id: string;
  pageId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: string;
}

export interface AdminActionLog {
  id: string;
  staffId: string;
  action: string;
  targetId: string;
  details?: any;
  createdAt: string;
  staffName?: string;
  staffEmail?: string;
}


