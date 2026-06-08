export type Role = "FARMER" | "BUYER" | "CONTRACTOR" | "ADMIN";

export type ListingImage = {
  id: number;
  image: string;
  is_primary: boolean;
  uploaded_at: string;
};

export type ListingListItem = {
  id: number;
  title: string;
  waste_type: string;
  notes: string;
  category: string;
  category_display: string;
  listing_type: string;
  listing_type_display: string;
  quantity: string;
  unit: string;
  location: string;
  price: string | null;
  rental_period: string | null;
  condition: string | null;
  status: string;
  created_at: string;
  farmer_username: string;
  primary_image: ListingImage | null;
  remaining_quantity?: number;
  request_count?: number;
};

export type WasteListingListItem = ListingListItem;

export type BidSummary = {
  total_bids: number;
  pending_bids: number;
  accepted_bids: number;
  price_range: { min: string | number; max: string | number } | null;
  quantity_range: { min: string | number; max: string | number } | null;
};

export type ListingDetail = {
  id: number;
  farmer?: number | string;
  farmer_username: string;
  title: string;
  waste_type: string;
  description: string;
  notes: string;
  category: string;
  category_display: string;
  listing_type: string;
  listing_type_display: string;
  quantity: string;
  unit: string;
  location: string;
  price: string | null;
  rental_period: string | null;
  condition: string | null;
  status: string;
  created_at: string;
  images: ListingImage[];
  remaining_quantity?: number | string;
  request_count?: number;
  bid_summary?: BidSummary;
};

export type OrderRequest = {
  id: number;
  listing: number;
  listing_title: string;
  listing_category: string;
  listing_location: string;
  listing_quantity: string | number;
  listing_unit: string;
  buyer: number;
  buyer_username: string;
  quantity_requested: string | number;
  proposed_price: string | number | null;
  status: string;
  created_at: string;
  remaining_quantity?: string | number | null;
  total_bids?: number;
};

export type CartItem = {
  id: number;
  listing: number;
  listing_title: string;
  listing_price: string | null;
  listing_category: string;
  listing_unit: string;
  listing_image: string | null;
  quantity: string;
  subtotal: string;
  added_at: string;
};

export type Cart = {
  id: number;
  items: CartItem[];
  total_items: number;
  total_price: string;
  updated_at: string;
};

export interface DashboardData {
  total_platform_transactions: {
    total_transactions: number;
    total_transaction_value: string;
    timeline: Array<{period: string; count: number; amount?: string}>;
  };
  marketplace_liquidity: {
    total_listings: number;
    sold_listings: number;
    unsold_listings: number;
    sell_through_rate: number;
  };
  active_users_over_time: Array<{period: string; active_users: number}>;
  waste_categories_distribution: Array<{
    waste_type: string;
    listing_count: number;
    total_quantity: string;
  }>;
  granularity: string;
}
