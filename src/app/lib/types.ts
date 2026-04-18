export type Role = "FARMER" | "PROCESSOR" | "ADMIN";

export type ListingImage = {
  id: number;
  image: string;
  is_primary: boolean;
  uploaded_at: string;
};

export type WasteListingListItem = {
  id: number;
  waste_type: string;
  quantity: string;
  unit: string;
  location: string;
  price: string | null;
  status: string;
  created_at: string;
  farmer_username: string;
  primary_image: ListingImage | null;
  remaining_quantity?: number;
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

export type WasteListingDetail = {
  id: number;
  farmer_username: string;
  waste_type: string;
  quantity: string;
  unit: string;
  location: string;
  price: string | null;
  notes: string;
  status: string;
  created_at: string;
  images: ListingImage[];
};

export type ListingBid = {
  id: number;
  processor_username?: string;
  bidder_username?: string;
  quantity_requested?: string | number | null;
  quantity?: string | number | null;
  amount?: string | number | null;
  proposed_price?: string | number | null;
  price?: string | number | null;
  message?: string;
  notes?: string;
  status?: string;
  created_at?: string;
};
